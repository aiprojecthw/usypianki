#!/usr/bin/env python3
"""
Test mieszania głosów Supertonic: bazowy głos (domyślnie F5) z domieszką innych.

Każdy głos Supertonic to dwa wektory: barwa/intonacja (ttl) i rytm (dp).
Mieszanka „F5 + 25% F2” to nowy głos — szukamy cieplejszej, żywszej intonacji
przy zachowaniu charakteru F5. Nagrywa ten sam fragment co wcześniejsze testy.

Wynik: D:\\Audiobooki_na_dobranoc\\audio\\testy_supertonic\\mieszanka_*.wav
Użycie: py test_mieszanie_glosow.py            (F5 + 25% każdego z F1–F4 i M2)
        py test_mieszanie_glosow.py --udzial 0.35 --domieszki F2 F3
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

from test_supertonic import FOLDER, FRAGMENT


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--baza", default="F5")
    p.add_argument("--domieszki", nargs="*", default=["F1", "F2", "F3", "F4", "M2"])
    p.add_argument("--udzial", type=float, default=0.25, help="udział domieszki 0–1")
    p.add_argument("--tempo", type=float, default=0.88)
    p.add_argument("--kroki", type=int, default=64)
    a = p.parse_args()

    from supertonic import TTS
    from supertonic.core import Style

    FOLDER.mkdir(parents=True, exist_ok=True)
    tts = TTS(auto_download=True)
    baza = tts.get_voice_style(a.baza)
    w = a.udzial

    warianty = [(f"{a.baza}_czysty", baza)]
    for d in a.domieszki:
        s = tts.get_voice_style(d)
        mix = Style(baza.ttl * (1 - w) + s.ttl * w, baza.dp * (1 - w) + s.dp * w)
        warianty.append((f"{a.baza}+{int(w * 100)}{d}", mix))

    for nazwa, styl in warianty:
        t0 = time.time()
        wav, _ = tts.synthesize(FRAGMENT, voice_style=styl, lang="pl", speed=a.tempo,
                                total_steps=a.kroki, silence_duration=0.6)
        plik = FOLDER / f"mieszanka_{nazwa}.wav"
        tts.save_audio(wav, str(plik))
        print(f"  {nazwa}: {plik.name}  ({time.time() - t0:.0f} s)")
    print(f"\nGotowe. Pliki w: {FOLDER}\nNapisz Claude „są”.")


if __name__ == "__main__":
    main()
