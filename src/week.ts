import type { Fixture, KneeLog, Match, Session, SessionType, WeightLog } from './db';
import { MIX_LABELS, rhythmFor, WEEK } from './plan';
import { weekdayIndex } from './day';

export type WeekDay = { date: string; day: string; title: string; soll: number; ist: number; fixtures: Fixture[]; today: boolean; past: boolean };

/** Montag bis Sonntag der Woche, in der `today` liegt: Soll aus dem Plan, Ist aus den protokollierten Einheiten. */
export function weekView(today: string, sessions: Session[], fixtures: Fixture[]) {
  const monday = addDays(today, -weekdayIndex(today));
  const days: WeekDay[] = WEEK.map((w, i) => {
    const date = addDays(monday, i);
    return { date, day: w.day.slice(0, 2), title: w.title, soll: w.minutes, ist: sessions.filter(s => s.date === date).reduce((a, s) => a + s.minutes, 0),
      fixtures: fixtures.filter(f => f.date === date), today: date === today, past: date < today };
  });
  return { days, soll: days.reduce((a, d) => a + d.soll, 0), ist: days.reduce((a, d) => a + d.ist, 0) };
}

/* ---------- Ausführliche Wochenauswertung ---------- */
/** Verteilung der Einheiten auf die vier Bereiche des Jahresrhythmus (Technik, Athletik, Aufschlag/Rückschlag, Spielpraxis). */
export const AREA_SPLIT: Record<SessionType, [number, number, number, number]> = {
  'Verein A': [0.5, 0, 0.3, 0.2], 'Verein B': [0.15, 0, 0.1, 0.75], 'Heim-Kraft': [0, 1, 0, 0],
  'Ausdauer': [0, 1, 0, 0], 'Heim 40': [0.4, 0.6, 0, 0], 'Turnier': [0, 0, 0.1, 0.9]
};

export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const mondayOf = (iso: string) => addDays(iso, -weekdayIndex(iso));
/** ISO-Kalenderwoche */
export function isoWeek(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - first.getTime()) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}
/** Belastung in „Einheiten“: Minuten × Anstrengung (RPE, Standard 5). */
export const loadOf = (s: Session) => s.minutes * (s.rpe ?? 5);

export type ReportDay = {
  date: string; dow: string; plan: (typeof WEEK)[number]; today: boolean; past: boolean; future: boolean;
  sessions: Session[]; fixtures: Fixture[]; matches: Match[]; knee?: KneeLog; weight?: WeightLog;
  soll: number; ist: number; load: number;
};
export type WeekData = { sessions: Session[]; fixtures: Fixture[]; matches: Match[]; knee: KneeLog[]; weight: WeightLog[] };

export function weekReport(anchor: string, today: string, d: WeekData) {
  const monday = mondayOf(anchor);
  const days: ReportDay[] = WEEK.map((plan, i) => {
    const date = addDays(monday, i);
    const sessions = d.sessions.filter(s => s.date === date);
    return { date, dow: plan.day.slice(0, 2), plan, today: date === today, past: date < today, future: date > today, sessions,
      fixtures: d.fixtures.filter(f => f.date === date), matches: d.matches.filter(m => m.date === date),
      knee: d.knee.filter(k => k.date === date).pop(), weight: d.weight.filter(w => w.date === date).pop(),
      soll: plan.minutes, ist: sessions.reduce((a, s) => a + s.minutes, 0), load: sessions.reduce((a, s) => a + loadOf(s), 0) };
  });
  const ms = days.flatMap(x => x.matches);
  const areas = [0, 0, 0, 0];
  for (const s of days.flatMap(x => x.sessions)) AREA_SPLIT[s.type].forEach((f, i) => { areas[i] += f * s.minutes; });
  const areaTotal = areas.reduce((a, b) => a + b, 0);
  const goal = rhythmFor(monday);
  const week = isoWeek(monday);
  return {
    monday, sunday: addDays(monday, 6), week, days,
    soll: days.reduce((a, x) => a + x.soll, 0), ist: days.reduce((a, x) => a + x.ist, 0), load: days.reduce((a, x) => a + x.load, 0),
    sessions: days.reduce((a, x) => a + x.sessions.length, 0), wins: ms.filter(m => m.won).length, losses: ms.filter(m => !m.won).length,
    areas: MIX_LABELS.map((label, i) => ({ label, minutes: Math.round(areas[i]), pct: areaTotal ? Math.round((100 * areas[i]) / areaTotal) : 0, goal: goal.mix[i] })),
    rhythm: goal.name,
    /** Dritte Woche nach drei Belastungswochen: Entlastung vorschlagen (Rhythmus 3+1, gezählt nach Kalenderwoche). */
    deload: week % 4 === 0
  };
}

/** Wochen-Minuten der letzten `n` Wochen bis einschließlich der Woche von `anchor` (älteste zuerst). */
export function weekTrend(anchor: string, n: number, sessions: Session[]) {
  const monday = mondayOf(anchor);
  return Array.from({ length: n }, (_, k) => {
    const from = addDays(monday, -7 * (n - 1 - k)), to = addDays(from, 6);
    const ss = sessions.filter(s => s.date >= from && s.date <= to);
    return { monday: from, week: isoWeek(from), minutes: ss.reduce((a, s) => a + s.minutes, 0), load: ss.reduce((a, s) => a + loadOf(s), 0) };
  });
}
