/**
 * Bramka rodzica: mnożenie przez 3, druga liczba 1–9, losowa kolejność
 * czynników (3 × 7 albo 7 × 3). Nowe działanie przy każdym otwarciu.
 * Decyzja Norberta (2026-10-16): łatwe dla zmęczonego rodzica wieczorem.
 */
export type GateQuestion = { a: number; b: number };

export const GATE_FIXED = 3;
export const GATE_MIN = 1;
export const GATE_MAX = 9;

/** `random` zwraca liczbę z [0, 1) — wstrzykiwane dla testów. */
export function makeGateQuestion(random: () => number = Math.random): GateQuestion {
  const other = GATE_MIN + Math.floor(random() * (GATE_MAX - GATE_MIN + 1));
  return random() < 0.5 ? { a: GATE_FIXED, b: other } : { a: other, b: GATE_FIXED };
}

/** Akceptuje tylko cyfry (spacje dookoła są ignorowane). */
export function isGateAnswerCorrect(question: GateQuestion, answer: string): boolean {
  const trimmed = answer.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return false;
  return Number(trimmed) === question.a * question.b;
}
