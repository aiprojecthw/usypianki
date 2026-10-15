/**
 * Bramka rodzica: mnożenie dwóch liczb z zakresu 2–9, nowe przy każdym
 * otwarciu. Dziecko w wieku 3–8 lat zwykle go nie rozwiąże, dorosły tak.
 */
export type GateQuestion = { a: number; b: number };

export const GATE_MIN = 2;
export const GATE_MAX = 9;

/** `random` zwraca liczbę z [0, 1) — wstrzykiwane dla testów. */
export function makeGateQuestion(random: () => number = Math.random): GateQuestion {
  const pick = () => GATE_MIN + Math.floor(random() * (GATE_MAX - GATE_MIN + 1));
  return { a: pick(), b: pick() };
}

/** Akceptuje tylko cyfry (spacje dookoła są ignorowane). */
export function isGateAnswerCorrect(question: GateQuestion, answer: string): boolean {
  const trimmed = answer.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return false;
  return Number(trimmed) === question.a * question.b;
}
