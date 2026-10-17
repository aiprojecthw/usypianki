#!/usr/bin/env python3
"""
Publikacja bajek z vaulta Obsidian do aplikacji Usypianki (Cloudflare R2).

Publikuje WYŁĄCZNIE bajki, których karta ma status COMPLETED (audio zatwierdzone
przez Norberta na bramce 2) i które nie mają jeszcze „aplikacja” w polu `publikacje`.

Dla każdej bajki:
  1. usuwa dudnienie, wycisza pauzy, wyrównuje głośność do -22 LUFS (jak bajki testowe; melodia „Po bajce” jest ciszej),
     kompresuje nagranie do MP3 64 kb/s mono (ffmpeg) i mierzy czas (ffprobe),
  2. przygotowuje okładkę 640×640 JPG (jeśli w karcie jest pole `okladka`),
  3. wgrywa pliki do R2: audio/<id>.mp3, covers/<id>.jpg,
  4. dopisuje / aktualizuje wpis w katalog.json na R2,
  5. zapisuje w karcie: publikacje += aplikacja, aplikacja_opublikowano, wpis w Recent Activity.
Przed wgraniem pokazuje plan i czeka na potwierdzenie „t”.

Klucze R2: plik D:\\Audiobooki_na_dobranoc\\.r2-klucze.txt (KLUCZ=wartość w liniach):
  R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET, R2_PUBLIC_URL

Gdy nagrania nie ma pod ścieżką z karty, skrypt pokazuje ostatnie pliki audio z folderu
Pobrane, pozwala wybrać numer, przenosi plik do D:\\Audiobooki_na_dobranoc\\audio\\Bxxx\\
(Bxxx_vN_narracja.mp3) i wpisuje ścieżkę do karty.

Pola karty używane przez skrypt (nagłówek YAML):
  id (B001), tytul, wiek ("5-6"), status, audio_plik (ścieżka .mp3 może być wewnątrz opisu),
  publikacje (lista), opcjonalnie: okladka (ścieżka do obrazka), aplikacja_od (RRRR-MM-DD),
  aplikacja_na_dzis (true = bajka „Na dziś”).

Okładka: gdy karta nie ma pola `okladka` (albo przy --odswiez), skrypt pokazuje ostatnie
obrazki z Pobranych; wybrany zapisuje jako Bxxx_okladka.jpg/png w folderze bajki w vaultcie.

Użycie (Windows, PowerShell):
  py publikuj_bajki.py                 # pokaż plan, zapytaj, opublikuj
  py publikuj_bajki.py --podglad       # tylko pokaż, co byłoby opublikowane
  py publikuj_bajki.py --usun-testowe  # przy okazji usuń z katalogu bajki testowe (test-*)
  py publikuj_bajki.py --odswiez B001  # ponowna publikacja (np. nowa okładka) bajki już w aplikacji

Wymagania: Python 3.10+, ffmpeg w PATH (winget install Gyan.FFmpeg),
           pip install boto3 pyyaml pillow
"""

from __future__ import annotations

import argparse
import hashlib
import datetime as dt
import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

DOMYSLNY_VAULT = Path(r"D:\Obsidian\Vault\03_Projects\Audiobooki_na_dobranoc")
DOMYSLNE_KLUCZE = Path(r"D:\Audiobooki_na_dobranoc\.r2-klucze.txt")
FOLDER_AUDIO = Path(r"D:\Audiobooki_na_dobranoc\audio")
FOLDER_POBRANE = Path.home() / "Downloads"
ROZSZERZENIA_AUDIO = (".mp3", ".wav", ".m4a", ".flac")
ROZSZERZENIA_OBRAZU = (".png", ".jpg", ".jpeg", ".webp")
WYMAGANE_KLUCZE = ("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT", "R2_BUCKET", "R2_PUBLIC_URL")
KATALOG_KLUCZ = "katalog.json"
BITRATE = "64k"
# Docelowa głośność narracji. Melodia „Po bajce” ma ok. -25 LUFS, więc nigdy nie zagra głośniej niż bajka.
GLOSNOSC_LUFS = -22
SZCZYT_DBTP = -2
OKLADKA_PX = 640
KOLORY_TLA = ["#2B3A5E", "#3C4A6B", "#4A3E5C", "#2F4A4E", "#3A3358", "#2E3F55"]


class BladPublikacji(Exception):
    pass


# ---------------------------------------------------------------- konfiguracja

def wczytaj_klucze(sciezka: Path) -> dict[str, str]:
    if not sciezka.is_file():
        raise BladPublikacji(f"Brak pliku z kluczami: {sciezka}")
    wartosci: dict[str, str] = {}
    for linia in sciezka.read_text(encoding="utf-8-sig").splitlines():
        linia = linia.strip()
        if not linia or linia.startswith("#") or "=" not in linia:
            continue
        klucz, _, wartosc = linia.partition("=")
        wartosci[klucz.strip()] = wartosc.strip().strip('"').strip("'")
    brak = [k for k in WYMAGANE_KLUCZE if not wartosci.get(k)]
    if brak:
        raise BladPublikacji(f"W pliku {sciezka.name} brakuje: {', '.join(brak)}")
    wartosci["R2_PUBLIC_URL"] = wartosci["R2_PUBLIC_URL"].rstrip("/")
    wartosci["R2_ENDPOINT"] = wartosci["R2_ENDPOINT"].rstrip("/")
    return wartosci


# ---------------------------------------------------------------- karty bajek

@dataclass
class Karta:
    sciezka: Path
    tekst: str
    meta: dict

    @property
    def kod(self) -> str:
        return str(self.meta.get("id", "")).strip()

    @property
    def id_aplikacji(self) -> str:
        return self.kod.lower()

    @property
    def tytul(self) -> str:
        return str(self.meta.get("tytul") or self.meta.get("title") or self.kod).strip()


def rozdziel_naglowek(tekst: str) -> tuple[str, str] | None:
    """Zwraca (yaml, reszta) albo None, gdy plik nie ma nagłówka YAML."""
    if not tekst.startswith("---"):
        return None
    koniec = re.search(r"^---\s*$", tekst[3:], flags=re.MULTILINE)
    if not koniec:
        return None
    yaml_tekst = tekst[3 : 3 + koniec.start()]
    reszta = tekst[3 + koniec.end() :]
    return yaml_tekst, reszta


def wczytaj_karty(vault: Path) -> list[Karta]:
    import yaml

    karty: list[Karta] = []
    for plik in sorted((vault / "01_Bajki").glob("*/*.md")):
        tekst = plik.read_text(encoding="utf-8")
        czesci = rozdziel_naglowek(tekst)
        if not czesci:
            continue
        try:
            meta = yaml.safe_load(czesci[0]) or {}
        except yaml.YAMLError as e:
            print(f"  ! Pomijam {plik.name}: błędny nagłówek YAML ({e})")
            continue
        if meta.get("typ") != "karta-bajki":
            continue
        karty.append(Karta(plik, tekst, meta))
    return karty


def lista_publikacji(meta: dict) -> list[str]:
    wartosc = meta.get("publikacje") or []
    if isinstance(wartosc, str):
        wartosc = [wartosc]
    return [str(x).strip().lower() for x in wartosc]


def do_publikacji(karta: Karta, odswiez: set[str] | None = None) -> bool:
    if odswiez and karta.kod.upper() in odswiez:
        return str(karta.meta.get("status", "")).strip().upper() == "COMPLETED"
    return str(karta.meta.get("status", "")).strip().upper() == "COMPLETED" and "aplikacja" not in lista_publikacji(karta.meta)


def sciezka_z_pola(wartosc: object, rozszerzenia: tuple[str, ...]) -> Path | None:
    """Wyciąga ścieżkę Windows z pola, nawet gdy jest wpleciona w opis (jak w B001)."""
    if not wartosc:
        return None
    tekst = str(wartosc)
    wzorzec = r"[A-Za-z]:\\[^\"\n|]*?\.(?:" + "|".join(rozszerzenia) + r")\b"
    trafienie = re.search(wzorzec, tekst, flags=re.IGNORECASE)
    if trafienie:
        return Path(trafienie.group(0).strip())
    kandydat = Path(tekst.strip())
    return kandydat if kandydat.suffix.lower().lstrip(".") in rozszerzenia else None


def etykieta_wieku(wiek: object) -> str | None:
    if not wiek:
        return None
    tekst = str(wiek).strip().replace("-", "–").replace(" ", "")
    return tekst if tekst.endswith("lat") else f"{tekst} lat"


def kolor_tla(kod: str) -> str:
    return KOLORY_TLA[sum(map(ord, kod)) % len(KOLORY_TLA)]



def ostatnie_pobrane(folder: Path, rozszerzenia: tuple[str, ...], ile: int = 8) -> list[Path]:
    if not folder.is_dir():
        return []
    pliki = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in rozszerzenia]
    return sorted(pliki, key=lambda p: p.stat().st_mtime, reverse=True)[:ile]


def wybierz_z_pobranych(karta: "Karta", folder: Path, rodzaj: str = "nagranie",
                        rozszerzenia: tuple[str, ...] = ROZSZERZENIA_AUDIO) -> Path | None:
    """Pokaż ostatnie pliki danego rodzaju z Pobranych i daj wybrać numer (Enter = pomiń)."""
    pliki = ostatnie_pobrane(folder, rozszerzenia)
    if not pliki:
        print(f"  ! {karta.kod}: brak pliku ({rodzaj}) w {folder}")
        return None
    print(f"  ? {karta.kod} „{karta.tytul}” — {rodzaj}. Ostatnie pliki w {folder}:")
    for i, p in enumerate(pliki, 1):
        kiedy = dt.datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
        print(f"      {i}. {p.name}  ({p.stat().st_size / 1e6:.1f} MB, {kiedy})")
    odp = input(f"    Numer pliku ({rodzaj}) dla tej bajki (Enter = pomiń): ").strip()
    if not odp.isdigit() or not 1 <= int(odp) <= len(pliki):
        print(f"    Pomijam ({rodzaj}).")
        return None
    return pliki[int(odp) - 1]


def ustaw_pole(karta: "Karta", klucz: str, wartosc: str) -> None:
    """Zapisuje pole w nagłówku karty (pojedyncze cudzysłowy — ukośniki Windows są bezpieczne)."""
    czesci = rozdziel_naglowek(karta.tekst)
    assert czesci is not None
    linie = [l for l in czesci[0].splitlines() if not l.startswith(f"{klucz}:")]
    linie.append(f"{klucz}: '" + wartosc.replace("'", "''") + "'")
    karta.tekst = "---\n" + "\n".join(linie).strip("\n") + "\n---" + czesci[1]
    karta.meta[klucz] = wartosc
    karta.sciezka.write_text(karta.tekst, encoding="utf-8")


def umiesc_okladke(karta: "Karta", zrodlo: Path) -> Path:
    """Przenosi okładkę do folderu bajki w vaultcie (Bxxx_okladka.ext) i wpisuje pole okladka."""
    cel = karta.sciezka.parent / f"{karta.kod}_okladka{zrodlo.suffix.lower()}"
    if cel.exists():
        cel.unlink()  # nowa okładka zastępuje poprzednią tej samej bajki
    shutil.move(str(zrodlo), str(cel))
    ustaw_pole(karta, "okladka", str(cel))
    print(f"    ✓ okładka zapisana jako {cel.name} w folderze bajki")
    return cel


def umiesc_nagranie(karta: "Karta", zrodlo: Path, folder_audio: Path) -> Path:
    """Przenosi wybrany plik do D:\\Audiobooki_na_dobranoc\\audio\\Bxxx\\Bxxx_vN_narracja.ext i wpisuje ścieżkę do karty."""
    wersja = str(karta.meta.get("wersja_zatwierdzona") or karta.meta.get("wersja_robocza") or "v1").strip() or "v1"
    cel = folder_audio / karta.kod / f"{karta.kod}_{wersja}_narracja{zrodlo.suffix.lower()}"
    cel.parent.mkdir(parents=True, exist_ok=True)
    if cel.exists():
        raise BladPublikacji(f"{cel} już istnieje — nie nadpisuję. Usuń go albo popraw pole audio_plik w karcie.")
    shutil.move(str(zrodlo), str(cel))
    ustaw_pole(karta, "audio_plik", str(cel))
    print(f"    ✓ przeniesiono do {cel} i wpisano ścieżkę w karcie")
    return cel

# ---------------------------------------------------------------- media

def wymagaj_programu(nazwa: str) -> None:
    if shutil.which(nazwa) is None:
        raise BladPublikacji(f"Nie znaleziono programu „{nazwa}”. Zainstaluj ffmpeg: winget install Gyan.FFmpeg")


# Obróbka przed wzmocnieniem: dudnienie < 80 Hz (zabiera zapas głośności, telefon i tak go nie gra)
# i bramka, która w pauzach daje pełną ciszę (jak w czystych nagraniach). Głos przechodzi bez zmian.
# Szumu POD głosem filtr nie usunie bez szkody dla lektora; od tego jest Voice Isolator w ElevenLabs
# przed publikacją. Potem jedno stałe wzmocnienie i limiter na pojedyncze trzaski.
FILTR_CZYSZCZENIA = (
    "highpass=f=80,"
    "agate=threshold=0.004:ratio=8:range=0.003:attack=5:release=250:knee=4:detection=rms"
)
# Limiter przycina szczyty o kilka dziesiątych dB; kompensujemy, żeby trafić w cel.
KOMPENSACJA_LIMITERA_DB = 0.5


def zmierz_glosnosc(zrodlo: Path, filtr: str) -> float:
    """Zintegrowana głośność (LUFS) nagrania po podanym filtrze."""
    wynik = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(zrodlo), "-vn", "-ac", "1",
         "-af", f"{filtr},ebur128=framelog=quiet", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    trafienia = re.findall(r"^\s*I:\s*(-?[\d.]+) LUFS", wynik.stderr, re.MULTILINE)
    if wynik.returncode != 0 or not trafienia:
        raise BladPublikacji(f"ffmpeg nie zmierzył głośności {zrodlo.name}: {wynik.stderr.strip()[-400:]}")
    return float(trafienia[-1])


def kompresuj_audio(zrodlo: Path, cel: Path) -> None:
    wymagaj_programu("ffmpeg")
    glosnosc = zmierz_glosnosc(zrodlo, FILTR_CZYSZCZENIA)
    wzmocnienie = GLOSNOSC_LUFS - glosnosc + KOMPENSACJA_LIMITERA_DB
    limit = 10 ** (SZCZYT_DBTP / 20)
    filtr = (
        f"{FILTR_CZYSZCZENIA},volume={wzmocnienie:.2f}dB,"
        f"alimiter=limit={limit:.3f}:attack=1:release=60:level=false"
    )
    wynik = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(zrodlo), "-vn", "-ac", "1", "-af", filtr,
         "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", BITRATE, "-map_metadata", "-1", str(cel)],
        capture_output=True, text=True,
    )
    if wynik.returncode != 0:
        raise BladPublikacji(f"ffmpeg nie przekonwertował {zrodlo.name}: {wynik.stderr.strip()}")
    print(f"    głośność: {glosnosc:.1f} → {GLOSNOSC_LUFS} LUFS (wzmocnienie {wzmocnienie:+.1f} dB, cisza w pauzach)")


def czas_trwania(plik: Path) -> int:
    wymagaj_programu("ffprobe")
    wynik = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(plik)],
        capture_output=True, text=True,
    )
    try:
        return round(float(wynik.stdout.strip()))
    except ValueError as e:
        raise BladPublikacji(f"Nie udało się odczytać długości {plik.name}") from e


def przygotuj_okladke(zrodlo: Path, cel: Path) -> None:
    from PIL import Image, ImageOps

    with Image.open(zrodlo) as obraz:
        kwadrat = ImageOps.fit(obraz.convert("RGB"), (OKLADKA_PX, OKLADKA_PX), Image.LANCZOS)
        kwadrat.save(cel, "JPEG", quality=85, optimize=True, progressive=True)


# ---------------------------------------------------------------- R2

def skrot(plik: Path) -> str:
    """8 znaków skrótu treści — nowa wersja pliku = nowy adres, więc telefon nie pokaże starej kopii."""
    return hashlib.sha256(plik.read_bytes()).hexdigest()[:8]


def klient_r2(klucze: dict[str, str]):
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=klucze["R2_ENDPOINT"],
        aws_access_key_id=klucze["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=klucze["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(retries={"max_attempts": 5, "mode": "standard"}),
    )


def pobierz_katalog(s3, bucket: str) -> dict:
    try:
        obiekt = s3.get_object(Bucket=bucket, Key=KATALOG_KLUCZ)
    except s3.exceptions.NoSuchKey:
        return {"version": 1, "stories": []}
    katalog = json.loads(obiekt["Body"].read().decode("utf-8"))
    if not isinstance(katalog.get("stories"), list):
        raise BladPublikacji("katalog.json na R2 ma nieprawidłowy format (brak listy stories)")
    return katalog


def wyslij(s3, bucket: str, plik: Path, klucz: str, typ: str, cache: str) -> None:
    s3.upload_file(str(plik), bucket, klucz, ExtraArgs={"ContentType": typ, "CacheControl": cache})


def wyslij_katalog(s3, bucket: str, katalog: dict) -> None:
    dane = json.dumps(katalog, ensure_ascii=False, indent=2).encode("utf-8")
    s3.put_object(Bucket=bucket, Key=KATALOG_KLUCZ, Body=dane,
                  ContentType="application/json; charset=utf-8", CacheControl="no-cache")


# ---------------------------------------------------------------- katalog

def wpis_katalogu(karta: Karta, czas: int, rozmiar: int, publiczny: str,
                  klucz_audio: str, klucz_okladki: str | None) -> dict:
    wpis: dict = {
        "id": karta.id_aplikacji,
        "title": karta.tytul,
        "durationSec": czas,
        "audioUrl": f"{publiczny}/{klucz_audio}",
        "coverColor": kolor_tla(karta.kod),
        "sizeBytes": rozmiar,
    }
    if klucz_okladki:
        wpis["coverUrl"] = f"{publiczny}/{klucz_okladki}"
    wiek = etykieta_wieku(karta.meta.get("wiek"))
    if wiek:
        wpis["ageLabel"] = wiek
    od = karta.meta.get("aplikacja_od")
    if od:
        wpis["publishAt"] = str(od)
    if karta.meta.get("aplikacja_na_dzis") is True:
        wpis["featured"] = True
    return wpis


def scal_katalog(katalog: dict, nowe: list[dict], usun_testowe: bool) -> dict:
    nowe_id = {w["id"] for w in nowe}
    stare = [s for s in katalog["stories"] if s.get("id") not in nowe_id]
    if usun_testowe:
        stare = [s for s in stare if not str(s.get("id", "")).startswith("test-")]
    if any(w.get("featured") for w in nowe):
        for s in stare:
            s.pop("featured", None)
    return {"version": katalog.get("version", 1), "stories": nowe + stare}


# ---------------------------------------------------------------- zapis w karcie

def oznacz_karte(karta: Karta, dzis: str, wpis: dict) -> str:
    """Zwraca nową treść karty: publikacje += aplikacja, data publikacji, wpis w historii."""
    czesci = rozdziel_naglowek(karta.tekst)
    assert czesci is not None
    naglowek, reszta = czesci
    linie = naglowek.splitlines()

    obecne = lista_publikacji(karta.meta)
    nowa_lista = "publikacje: [" + ", ".join(dict.fromkeys(obecne + ["aplikacja"])) + "]"
    indeks = next((i for i, l in enumerate(linie) if l.startswith("publikacje:")), None)
    if indeks is None:
        linie.append(nowa_lista)
    else:
        koniec = indeks + 1
        while koniec < len(linie) and re.match(r"^\s+-\s", linie[koniec]):
            koniec += 1
        linie[indeks:koniec] = [nowa_lista]

    linie = [l for l in linie if not l.startswith("aplikacja_opublikowano:")]
    linie.append(f'aplikacja_opublikowano: "{dzis}"')
    linie = [re.sub(r"^last_updated:.*$", f"last_updated: {dzis}", l) for l in linie]

    teraz = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    historia = (f"\n- {teraz} [skrypt publikacji]\n"
                f"  Opublikowano w aplikacji: {wpis['audioUrl']} ({wpis['durationSec']} s).\n")
    reszta = reszta.rstrip("\n") + "\n" + historia
    return "---\n" + "\n".join(linie).strip("\n") + "\n---" + ("" if reszta.startswith("\n") else "\n") + reszta


# ---------------------------------------------------------------- przebieg

def main() -> int:
    parser = argparse.ArgumentParser(description="Publikacja zatwierdzonych bajek do aplikacji Usypianki.")
    parser.add_argument("--vault", type=Path, default=DOMYSLNY_VAULT)
    parser.add_argument("--klucze", type=Path, default=DOMYSLNE_KLUCZE)
    parser.add_argument("--pobrane", type=Path, default=FOLDER_POBRANE, help="folder z pobranymi nagraniami")
    parser.add_argument("--folder-audio", type=Path, default=FOLDER_AUDIO, help="docelowy folder nagrań")
    parser.add_argument("--odswiez", nargs="+", default=[], metavar="BXXX",
                        help="opublikuj ponownie bajki już obecne w aplikacji (np. nowa okładka)")
    parser.add_argument("--bez-okladki", action="store_true", help="nie pytaj o okładkę z Pobranych")
    parser.add_argument("--podglad", action="store_true", help="tylko pokaż plan, nic nie wysyłaj")
    parser.add_argument("--usun-testowe", action="store_true", help="usuń z katalogu bajki testowe (test-*)")
    parser.add_argument("--tak", action="store_true", help="nie pytaj o potwierdzenie")
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    karty = wczytaj_karty(args.vault)
    odswiez = {k.upper() for k in args.odswiez}
    gotowe = [k for k in karty if do_publikacji(k, odswiez)]
    print(f"Karty bajek: {len(karty)} · gotowe do publikacji (COMPLETED, jeszcze nie w aplikacji): {len(gotowe)}")
    for k in karty:
        if k not in gotowe:
            powod = "już w aplikacji" if "aplikacja" in lista_publikacji(k.meta) else f"status {k.meta.get('status')}"
            print(f"  – {k.kod} {k.tytul}: pomijam ({powod})")

    plan: list[tuple[Karta, Path, Path | None]] = []
    for k in gotowe:
        if not re.fullmatch(r"B\d{3,}", k.kod):
            print(f"  ! {k.sciezka.name}: brak poprawnego id (np. B001) — pomijam")
            continue
        audio = sciezka_z_pola(k.meta.get("audio_plik"), ("mp3", "wav", "m4a", "flac"))
        if not audio or not audio.is_file():
            if args.podglad:
                print(f"  ? {k.kod}: brak nagrania na miejscu — przy publikacji skrypt zaproponuje plik z {args.pobrane}")
                continue
            wybrany = wybierz_z_pobranych(k, args.pobrane)
            if not wybrany:
                continue
            audio = umiesc_nagranie(k, wybrany, args.folder_audio)
        okladka = sciezka_z_pola(k.meta.get("okladka"), ("png", "jpg", "jpeg", "webp"))
        if okladka and not okladka.is_file():
            print(f"  ! {k.kod}: okładka {okladka} nie istnieje")
            okladka = None
        if (okladka is None or k.kod.upper() in odswiez) and not args.podglad and not args.bez_okladki:
            wybrana = wybierz_z_pobranych(k, args.pobrane, "okładka", ROZSZERZENIA_OBRAZU)
            if wybrana:
                okladka = umiesc_okladke(k, wybrana)
        plan.append((k, audio, okladka))
        print(f"  + {k.kod} „{k.tytul}” · audio: {audio.name} · okładka: {okladka.name if okladka else 'brak (kolor tła)'}")

    if not plan:
        # Bez nowych bajek katalogu nie ruszamy (także z --usun-testowe), żeby nie zostawić aplikacji bez bajek.
        print("Nic do opublikowania. Katalog na serwerze bez zmian.")
        return 0
    if args.podglad:
        print("Tryb podglądu: nic nie zostało wysłane.")
        return 0

    klucze = wczytaj_klucze(args.klucze)
    if not args.tak:
        odp = input(f"Opublikować {len(plan)} bajk(i) do R2 ({klucze['R2_BUCKET']})? [t/N] ").strip().lower()
        if odp not in ("t", "tak", "y"):
            print("Przerwano. Nic nie zostało wysłane.")
            return 1

    s3 = klient_r2(klucze)
    bucket, publiczny = klucze["R2_BUCKET"], klucze["R2_PUBLIC_URL"]
    katalog = pobierz_katalog(s3, bucket)
    dzis = dt.date.today().isoformat()
    nowe_wpisy: list[dict] = []
    karty_do_zapisu: list[tuple[Karta, dict]] = []

    with tempfile.TemporaryDirectory() as tmp:
        for karta, audio, okladka in plan:
            print(f"→ {karta.kod}: kompresja audio…")
            mp3 = Path(tmp) / f"{karta.id_aplikacji}.mp3"
            kompresuj_audio(audio, mp3)
            czas = czas_trwania(mp3)
            print(f"   {czas // 60}:{czas % 60:02d} · {mp3.stat().st_size / 1e6:.1f} MB → wysyłam")
            klucz_audio = f"audio/{karta.id_aplikacji}-{skrot(mp3)}.mp3"
            wyslij(s3, bucket, mp3, klucz_audio, "audio/mpeg", "public, max-age=31536000, immutable")
            klucz_okladki = None
            if okladka:
                jpg = Path(tmp) / f"{karta.id_aplikacji}.jpg"
                przygotuj_okladke(okladka, jpg)
                klucz_okladki = f"covers/{karta.id_aplikacji}-{skrot(jpg)}.jpg"
                wyslij(s3, bucket, jpg, klucz_okladki, "image/jpeg", "public, max-age=31536000, immutable")
            wpis = wpis_katalogu(karta, czas, mp3.stat().st_size, publiczny, klucz_audio, klucz_okladki)
            nowe_wpisy.append(wpis)
            karty_do_zapisu.append((karta, wpis))

    nowy_katalog = scal_katalog(katalog, nowe_wpisy, args.usun_testowe)
    if not nowy_katalog["stories"]:
        raise BladPublikacji("Nowy katalog byłby pusty — przerywam, nic nie zmieniam na serwerze.")
    wyslij_katalog(s3, bucket, nowy_katalog)
    print(f"✓ katalog.json zaktualizowany: {len(nowy_katalog['stories'])} bajek")

    # Karty zapisujemy dopiero po udanym wysłaniu katalogu.
    for karta, wpis in karty_do_zapisu:
        karta.sciezka.write_text(oznacz_karte(karta, dzis, wpis), encoding="utf-8")
        print(f"✓ {karta.kod}: karta oznaczona jako opublikowana w aplikacji")
    print("Gotowe. Nowe bajki pojawią się w aplikacji po jej ponownym otwarciu (z internetem).")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except BladPublikacji as e:
        print(f"BŁĄD: {e}")
        sys.exit(2)
    except KeyboardInterrupt:
        print("\nPrzerwano.")
        sys.exit(1)
