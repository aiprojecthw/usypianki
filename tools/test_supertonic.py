#!/usr/bin/env python3
"""
Test lektora Supertonic (lokalne TTS na CPU, bez kredytów) dla Usypianek.

Nagrywa ten sam fragment B001, którym testowaliśmy głosy ElevenLabs,
wszystkimi 10 wbudowanymi głosami (M1–M5 męskie, F1–F5 kobiece).
Pliki trafiają do D:\\Audiobooki_na_dobranoc\\audio\\testy_supertonic\\
(Claude ma dostęp do folderu audio i zmierzy szum/głośność).

Pierwsze uruchomienie pobiera model z Hugging Face (kilkaset MB).

Wymagania:  py -m pip install supertonic
Użycie:     py test_supertonic.py              # wszystkie głosy, tempo 0.9
            py test_supertonic.py --tempo 0.85 --glosy M2 M4
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

FRAGMENT = (
    "W jaskini było wilgotno i chłodno… Kap… kap… – kapała woda ze skały. "
    "Brrr… Było tam naprawdę zimno.\n"
    "Na dnie jaskini, zwinięty w kłębek, leżał smok.\n"
    "– Hyk! – zrobił smok.\n"
    "– Dobry wieczór, smoku – powiedział cicho Skuba.\n"
    "– Dobry wieczór – odpowiedział smok. – Ja po prostu… nie mogę zasnąć.\n\n"
    "I tak kończy się dzisiejsza bajka… Otul się kołderką… zamknij oczy… Dobranoc."
)

GLOSY = ["M1", "M2", "M3", "M4", "M5", "F1", "F2", "F3", "F4", "F5"]
FOLDER = Path(r"D:\Audiobooki_na_dobranoc\audio\testy_supertonic")


def main() -> None:
    p = argparse.ArgumentParser(description="Test głosów Supertonic po polsku")
    p.add_argument("--tempo", type=float, default=0.9, help="0.7–2.0; 1.05 = domyślne Supertonic")
    p.add_argument("--kroki", type=int, default=16, help="jakość: 8 domyślnie, 16 lepiej, wolniej")
    p.add_argument("--glosy", nargs="*", default=GLOSY)
    p.add_argument("--folder", type=Path, default=FOLDER)
    a = p.parse_args()

    from supertonic import TTS  # import tu, żeby --help działało bez instalacji

    a.folder.mkdir(parents=True, exist_ok=True)
    print("Ładuję model (pierwszy raz pobiera go z internetu)…")
    tts = TTS(auto_download=True)

    for glos in a.glosy:
        start = time.time()
        styl = tts.get_voice_style(glos)
        wav, _ = tts.synthesize(
            FRAGMENT, voice_style=styl, lang="pl", speed=a.tempo,
            total_steps=a.kroki, silence_duration=0.6,
        )
        plik = a.folder / f"supertonic_{glos}_tempo{a.tempo:.2f}.wav"
        tts.save_audio(wav, str(plik))
        print(f"  {glos}: {plik.name}  ({time.time() - start:.1f} s liczenia)")

    print(f"\nGotowe. Pliki w: {a.folder}")
    print("Napisz Claude „są”, a zmierzy szum i porówna z próbkami ElevenLabs.")


if __name__ == "__main__":
    main()
