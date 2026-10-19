#!/usr/bin/env python3
"""
Nagrywa całą bajkę lokalnym TTS Supertonic (CPU, bez kredytów).

Czyta tekst z pliku wersji bajki w vaultcie (sekcja między <!-- TEKST:START -->
a <!-- TEKST:END -->), nagrywa akapit po akapicie i skleja z pauzami:
zwykła pauza między akapitami, dłuższa w ostatnich 30% bajki (wyciszenie).

Wynik: D:\\Audiobooki_na_dobranoc\\audio\\Bxxx\\Bxxx_vN_supertonic_<GLOS>.wav
To jest nagranie do odsłuchu (bramka 2: „Audio Bxxx OK”) — skrypt niczego nie publikuje.

Wymagania:  py -m pip install supertonic
Użycie:     py nagraj_bajke_supertonic.py "…\\01_Bajki\\B001 Smok Wawelski\\B001 v1.md" --glos F5 --tempo 0.88
"""
from __future__ import annotations

import argparse
import re
import time
from pathlib import Path

FOLDER_AUDIO = Path(r"D:\Audiobooki_na_dobranoc\audio")
PAUZA_AKAPIT_S = 0.9      # między akapitami
PAUZA_WYCISZENIE_S = 1.8  # między akapitami w ostatnich 30% bajki
PAUZA_ZDANIA_S = 0.45     # między kawałkami jednego akapitu (dzielenie wewnętrzne modelu)
CISZA_NA_KONIEC_S = 3.0


def wczytaj_tekst(plik: Path) -> tuple[str, str, list[str]]:
    tresc = plik.read_text(encoding="utf-8")
    m = re.search(r"<!-- TEKST:START -->(.*?)<!-- TEKST:END -->", tresc, re.S)
    if not m:
        raise SystemExit(f"Brak sekcji TEKST:START/END w {plik}")
    tekst = m.group(1).strip()
    # Cudzysłowy drukarskie bywają nieobsługiwane przez model; zamieniamy na proste.
    for z, na in (("„", '"'), ("”", '"'), ("“", '"'), ("’", "'")):
        tekst = tekst.replace(z, na)
    akapity = [a.strip() for a in tekst.split("\n\n") if a.strip()]
    nazwa = plik.stem  # np. "B001 v1"
    mid = re.match(r"(B\d{3})\s+(v\d+)", nazwa)
    if not mid:
        raise SystemExit(f"Nazwa pliku musi zaczynać się od „Bxxx vN”: {plik.name}")
    return mid.group(1), mid.group(2), akapity


def main() -> None:
    p = argparse.ArgumentParser(description="Nagranie całej bajki w Supertonic")
    p.add_argument("wersja", type=Path, help="plik wersji tekstu, np. B001 v1.md")
    p.add_argument("--glos", default="F5")
    p.add_argument("--tempo", type=float, default=0.88)
    p.add_argument("--kroki", type=int, default=64)
    a = p.parse_args()

    import numpy as np
    from supertonic import TTS

    bid, wer, akapity = wczytaj_tekst(a.wersja)
    cel = FOLDER_AUDIO / bid / f"{bid}_{wer}_supertonic_{a.glos}.wav"
    cel.parent.mkdir(parents=True, exist_ok=True)

    print(f"{bid} {wer}: {len(akapity)} akapitów, głos {a.glos}, tempo {a.tempo}, jakość {a.kroki}")
    tts = TTS(auto_download=True)
    styl = tts.get_voice_style(a.glos)
    sr = tts.sample_rate
    start_wyciszenia = int(len(akapity) * 0.7)

    czesci = []
    t0 = time.time()
    for i, akapit in enumerate(akapity):
        wav, _ = tts.synthesize(
            akapit, voice_style=styl, lang="pl", speed=a.tempo,
            total_steps=a.kroki, silence_duration=PAUZA_ZDANIA_S,
        )
        czesci.append(wav.reshape(-1).astype(np.float32))
        pauza = PAUZA_WYCISZENIE_S if i >= start_wyciszenia else PAUZA_AKAPIT_S
        if i == len(akapity) - 1:
            pauza = CISZA_NA_KONIEC_S
        czesci.append(np.zeros(int(pauza * sr), dtype=np.float32))
        print(f"  akapit {i + 1}/{len(akapity)}  ({time.time() - t0:.0f} s)")

    calosc = np.concatenate(czesci)[None, :]
    tts.save_audio(calosc, str(cel))
    print(f"\nGotowe: {cel}  ({calosc.shape[1] / sr / 60:.1f} min, liczenie {time.time() - t0:.0f} s)")
    print("Napisz Claude „jest”, a sprawdzi nagranie i przygotuje wersję do odsłuchu.")


if __name__ == "__main__":
    main()
