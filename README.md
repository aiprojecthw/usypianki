# Usypianki: Bajki na sen

Aplikacja na Androida z bajkami audio do słuchania przed snem (dzieci 3–8 lat). Expo SDK 57, Expo Router.
Projekt graficzny: makieta „Usypianki – makieta MVP” (Claude Design). Decyzje produktowe: dokument
„Decyzje aplikacji – Usypianki” w projekcie Claude.

## Co jest w wersji testowej

- **Trzy pory dnia** (dzień od 06:00, wieczór od 17:00, noc od 19:00 — zmienia rodzic): tapeta, niebo, kolory, przycisk słońce/księżyc.
- **Start**: systemowy ekran startowy (księżyc + napis „Usypianki”), potem jednorazowa, bezgłośna animacja jeżyka na tapecie; kończy się pauzą na ostatniej klatce, bez przenikania; bajki klikalne od razu.
- **Odtwarzacz**: tło nieba, drewniana strzałka „Wróć”, ±15 s, odtwarzanie w tle i z ekranu blokady, wznawianie od miejsca przerwania.
- **Po bajce** (przycisk z klepsydrą): Cisza albo Spokojna melodia 10 min (plik z wbudowanym wyciszeniem); wybór zapamiętany. Bajka nigdy nie jest ściszana, kolejna nie włącza się sama.
- **Tryb nocny**: płynne przyciemnienie okna aplikacji do ~10%, dotyk rozjaśnia na 10 s ze sterowaniem; po wyjściu jasność wraca.
- **Bramka rodzica**: mnożenie przez 3 (druga liczba 1–9, losowa kolejność), nowe przy każdym otwarciu; własna klawiatura numeryczna (bez klawiatury systemowej).
- **Strefa rodzica**: słuchanie bez internetu (na górze), pory dnia, przypomnienie (przełącznik), zarządzanie pobranymi.
- **Wszystkie bajki**: karuzela do 10 bajek z kafelkiem „Wszystkie bajki →” i ekran z pełną siatką.
- **Pobieranie offline** (9,99 zł w wydaniu sklepowym): w wersji testowej odblokowanie bez płatności; „Pobierz” w odtwarzaczu, lista w „Pobrane” bez koszy, usuwanie tylko w Strefie rodzica.
- **4 bajki testowe** czytane syntezatorem mowy (espeak-ng), dołączone do aplikacji.

## Struktura

```
src/app/            ekrany (Expo Router): (tabs)/index, (tabs)/downloads, player, timer, night,
                    gate, parent, purchase, manage-downloads, about
src/components/     wspólne elementy UI (Txt, przyciski, okładka, animacja jeżyka)
src/data/           katalog bajek, ustawienia (plik JSON w telefonie), pobrane pliki
src/logic/          czysta logika z testami: pory dnia, bramka, wznawianie, wyłącznik
src/player/         odtwarzacz (expo-audio)
src/ui/media.ts     wszystkie grafiki, animacje i nagrania testowe
assets/ui, assets/video, assets/stories, assets/covers
```

## Katalog bajek (Cloudflare R2)

Adres katalogu ustawia się w `app.json`: `"extra": { "catalogUrl": "https://<bucket>.r2.dev/catalog.json" }`.
Format opisuje `src/data/types.ts` (tytuł, czas, adres MP3, okładka, wiek, `publishAt` do planowania premier).
Nowa bajka = MP3 w buckecie + wpis w `catalog.json`; aktualizacja aplikacji nie jest potrzebna.
Dopóki `catalogUrl` jest puste, aplikacja pokazuje bajki testowe.

## Budowanie testowego APK

Każdy push na `main` uruchamia `.github/workflows/android-apk.yml`: testy, sprawdzenie typów, build APK
i nowe wydanie na GitHubie. Najnowszy plik:
https://github.com/aiprojecthw/usypianki/releases/latest/download/usypianki-test.apk

APK testowy jest podpisany kluczem deweloperskim — nadaje się do instalacji na własnym telefonie,
nie do Google Play (wydanie sklepowe: profil `production` w EAS).

## Praca lokalna

```bash
npm install
npm test            # testy jednostkowe (jest-expo)
npx tsc --noEmit    # typy
npx expo lint       # lint
npx expo start      # podgląd (animacja i odtwarzanie w tle wymagają zbudowanej aplikacji)
```
