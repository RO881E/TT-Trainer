import { BLOCKS, blockByKey, type Block, type Stufe } from './cyclePlan';
import { addDays, mondayOf } from './week';

/** Zustand des Zyklenplans. Wird als ein JSON-Wert in den Einstellungen gespeichert (und mit gesichert). */
export type CycleState = {
  start: string;                                  // Montag des ersten Blocks
  order: string[];                                // Reihenfolge der Block-Schlüssel
  weeks: Record<string, number>;                  // abweichende Dauer je Block
  results: Record<string, { date: string; value: string; passed: boolean }>;
};
export const CYCLE_KEY = 'cycle';

/** Plan beginnt am nächsten Montag (oder heute, falls Montag). */
export function initialCycle(today: string): CycleState {
  const m = mondayOf(today);
  return { start: m === today ? m : addDays(m, 7), order: BLOCKS.map(b => b.key), weeks: {}, results: {} };
}
export const weeksOf = (s: CycleState, b: Block) => Math.max(1, s.weeks[b.key] ?? b.weeks);

export type Slot = { block: Block; start: string; end: string; weeks: number; index: number };
/** Blöcke hintereinander ab dem Startdatum, die Dauer jedes Blocks verschiebt alle folgenden. */
export function schedule(s: CycleState): Slot[] {
  let at = s.start;
  return s.order.flatMap((key, index) => {
    const block = blockByKey(key);
    if (!block) return [];
    const weeks = weeksOf(s, block), slot = { block, start: at, end: addDays(at, weeks * 7 - 1), weeks, index };
    at = addDays(at, weeks * 7);
    return [slot];
  });
}

/** Stufe der Woche innerhalb eines Blocks: erst Einführen, dann Festigen, danach Variation, letzte Woche Test. */
export function stufeOf(weekIdx: number, weeks: number): Stufe {
  if (weeks === 1) return 'festigen';
  if (weekIdx === weeks - 1) return 'test';
  if (weekIdx === 0) return 'einfuehren';
  return weekIdx === 1 ? 'festigen' : 'variation';
}

export type Position = { slot: Slot; week: number; stufe: Stufe } | { upcoming: Slot; startsInDays: number } | { done: true };
export function locate(s: CycleState, today: string): Position {
  const slots = schedule(s);
  if (!slots.length) return { done: true };
  if (today < slots[0].start) return { upcoming: slots[0], startsInDays: Math.round((Date.parse(slots[0].start) - Date.parse(today)) / 864e5) };
  const slot = slots.find(x => today >= x.start && today <= x.end);
  if (!slot) return { done: true };
  const week = Math.floor((Date.parse(today) - Date.parse(slot.start)) / (7 * 864e5));
  return { slot, week: week + 1, stufe: stufeOf(week, slot.weeks) };
}

/* ---------- Änderungen (rein, geben einen neuen Zustand zurück) ---------- */
export const setWeeks = (s: CycleState, key: string, weeks: number): CycleState => ({ ...s, weeks: { ...s.weeks, [key]: Math.max(1, Math.min(12, weeks)) } });
/** Block früher beenden: heute ist die letzte Woche, die Folgeblöcke rücken vor. */
export function endBlockThisWeek(s: CycleState, key: string, today: string): CycleState {
  const slot = schedule(s).find(x => x.block.key === key);
  if (!slot || today < slot.start) return s;
  return setWeeks(s, key, Math.floor((Date.parse(today) - Date.parse(slot.start)) / (7 * 864e5)) + 1);
}
export function move(s: CycleState, key: string, dir: -1 | 1): CycleState {
  const i = s.order.indexOf(key), j = i + dir;
  if (i < 0 || j < 0 || j >= s.order.length) return s;
  const order = [...s.order];
  [order[i], order[j]] = [order[j], order[i]];
  return { ...s, order };
}
export const setResult = (s: CycleState, key: string, r: { date: string; value: string; passed: boolean }): CycleState => ({ ...s, results: { ...s.results, [key]: r } });
export const clearResult = (s: CycleState, key: string): CycleState => { const { [key]: _drop, ...results } = s.results; return { ...s, results }; };

/** Alle Blöcke des Plans anhängen, die der gespeicherte Zustand noch nicht kennt (nach App-Updates mit neuen Blöcken). */
export function withNewBlocks(s: CycleState): CycleState {
  const missing = BLOCKS.filter(b => !s.order.includes(b.key)).map(b => b.key);
  return missing.length ? { ...s, order: [...s.order, ...missing] } : s;
}

/** Was heute inhaltlich dran ist. */
export type Focus = { title: string; stufe: Stufe; week: number; weeks: number; goal: string; test: Block['test']; drills: string[]; spielnah: string[]; home: string[] };
export function focusFor(pos: Position): Focus | undefined {
  if (!('slot' in pos)) return undefined;
  const b = pos.slot.block;
  const drills = pos.stufe === 'test' ? [`Test heute oder diese Woche: ${b.test.label}, Ziel ${b.test.target}`, ...b.drills.variation.slice(0, 1)] : b.drills[pos.stufe];
  return { title: b.title, stufe: pos.stufe, week: pos.week, weeks: pos.slot.weeks, goal: b.goal, test: b.test, drills, spielnah: b.spielnah, home: b.home };
}

/** Einen Block direkt hinter einen anderen ziehen, z. B. wenn die Statistik ein anderes Thema nahelegt. */
export function pullAfter(s: CycleState, key: string, afterKey: string): CycleState {
  if (key === afterKey || !s.order.includes(key)) return s;
  const order = s.order.filter(k => k !== key);
  order.splice(order.indexOf(afterKey) + 1, 0, key);
  return { ...s, order };
}
/** Nächster noch nicht gelaufener Block, dessen Fehlerkategorien zum Fehler passen. */
export function blockForError(s: CycleState, err: string, after: string): Block | undefined {
  const slots = schedule(s), i = slots.findIndex(x => x.block.key === after);
  return slots.slice(i + 1).find(x => (x.block.errors as string[]).includes(err))?.block;
}
