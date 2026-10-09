import type { Fixture, Session } from './db';
import { WEEK } from './plan';
import { weekdayIndex } from './day';

export type WeekDay = { date: string; day: string; title: string; soll: number; ist: number; fixtures: Fixture[]; today: boolean; past: boolean };
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

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
