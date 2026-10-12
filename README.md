# Usypianki: Bajki na sen

Aplikacja na Androida z bajkami audio do słuchania przed snem. Expo SDK 57, Expo Router.

## Co jest w MVP

- **Bajki**: lista z katalogu, bajka „Na dziś”, pobieranie na telefon.
- **Odtwarzacz**: odtwarzanie w tle i przy zgaszonym ekranie, sterowanie z ekranu blokady, ±10 s.
- **Wyłącznik czasowy**: po tej bajce / 10 / 20 / 30 min, stopniowe ściszanie przez ostatnią minutę.
- **Tryb nocny**: prawie czarny ekran z jednym przyciskiem.
- **Pobrane**: bajki offline, usuwanie, komunikat o braku internetu.
- **Bez autoodtwarzania** kolejnych bajek, bez reklam, bez kont, bez analityki.

## Katalog bajek (Cloudflare R2)

Aplikacja pobiera listę bajek z pliku JSON, którego adres ustawia się w `app.json`:

```json
"extra": { "catalogUrl": "https://<twoj-bucket>.r2.dev/catalog.json" }
```

Format pliku opisuje `src/data/types.ts`. Każda bajka to plik MP3 o nazwie `<id>.mp3`.
Nowa bajka = nowy MP3 w buckecie + nowa pozycja w `catalog.json`. Aktualizacja aplikacji nie jest potrzebna.

Dopóki `catalogUrl` jest puste, aplikacja pokazuje 4 bajki testowe odtwarzające dołączony dźwięk próbny (`assets/audio/test.mp3`).

## Budowanie APK

1. Konto na expo.dev, projekt połączony z tym repo (`extra.eas.projectId` w `app.json`).
2. Workflow `.eas/workflows/android-preview.yml`: uruchom ręcznie na expo.dev albo zrób push na gałąź `release`.
3. Gotowy APK pobierasz z expo.dev i instalujesz na telefonie.

Odtwarzanie w tle wymaga zbudowanej aplikacji (APK). W Expo Go nie zadziała w pełni.

## Praca lokalna

```bash
npm install
npx expo start      # podgląd
npx tsc --noEmit    # typy
npx expo lint       # lint
```
