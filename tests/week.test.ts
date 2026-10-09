import { describe, expect, it } from 'vitest';
import type { Fixture, Match, Session } from '../src/db';
import { addDays, isoWeek, loadOf, mondayOf, weekReport, weekTrend } from '../src/week';

const s = (date: string, type: Session['type'], minutes: number, rpe?: number): Session => ({ date, type, minutes, rpe });
const m = (date: string, won: boolean): Match => ({ date, opponentId: 1, kind: 'Punktspiel', myTtr: 1550, oppTtr: 1550, sets: [[11, 5]], won, errors: {}, serve: { A: { used: 0, won: 0 }, B: { used: 0, won: 0 }, C: { used: 0, won: 0 } } });
const none = { sessions: [], fixtures: [] as Fixture[], matches: [], knee: [], weight: [] };

describe('Kalenderwochen', () => {
  it('ISO-Wochennummern inkl. Jahreswechsel', () => {
    expect(isoWeek('2026-10-05')).toBe(41);
    expect(isoWeek('2026-01-01')).toBe(1);
    expect(isoWeek('2025-12-29')).toBe(1);
    expect(isoWeek('2021-01-03')).toBe(53);
    expect(isoWeek('2026-12-31')).toBe(53);
  });
  it('Montag der Woche und Tage addieren', () => {
    expect(mondayOf('2026-10-11')).toBe('2026-10-05');
    expect(mondayOf('2026-10-05')).toBe('2026-10-05');
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
  });
});

describe('Wochenauswertung', () => {
  const data = { ...none,
    sessions: [s('2026-10-07', 'Verein A', 120, 7), s('2026-10-09', 'Verein B', 100), s('2026-10-04', 'Verein A', 500)],
    matches: [m('2026-10-09', true), m('2026-10-10', false), m('2026-10-12', true)] };
  const r = weekReport('2026-10-08', '2026-10-09', data);
  it('summiert nur Einheiten der Woche (Mo–So)', () => {
    expect(r.monday).toBe('2026-10-05'); expect(r.sunday).toBe('2026-10-11'); expect(r.week).toBe(41);
    expect(r.ist).toBe(220); expect(r.sessions).toBe(2); expect(r.soll).toBe(370);
  });
  it('Belastung = Minuten × RPE, ohne Angabe RPE 5', () => {
    expect(loadOf(s('2026-10-07', 'Verein A', 120, 7))).toBe(840);
    expect(r.load).toBe(840 + 500);
  });
  it('Spiele der Woche', () => { expect([r.wins, r.losses]).toEqual([1, 1]); });
  it('markiert heute/vergangen/zukünftig', () => {
    expect(r.days.map(d => [d.past, d.today, d.future])[3]).toEqual([true, false, false]); // Donnerstag
    expect(r.days[4].today).toBe(true);
    expect(r.days[5].future).toBe(true);
  });
  it('Bereichsverteilung ergibt rund 100 % und nutzt den Zielmix', () => {
    expect(r.areas.reduce((a, x) => a + x.pct, 0)).toBeGreaterThanOrEqual(99);
    expect(r.areas.reduce((a, x) => a + x.pct, 0)).toBeLessThanOrEqual(101);
    expect(r.areas[3].goal).toBe(30); // Vorrunde: 15/30/25/30
    expect(r.areas[3].pct).toBeGreaterThan(r.areas[1].pct);
  });
  it('leere Woche hat keine Prozentwerte', () => {
    expect(weekReport('2026-10-08', '2026-10-09', none).areas.every(a => a.pct === 0)).toBe(true);
  });
  it('Entlastungswoche jede vierte Kalenderwoche', () => {
    expect(weekReport('2026-10-19', '2026-10-09', none).deload).toBe(false); // KW 43
    expect(weekReport('2026-10-05', '2026-10-09', none).deload).toBe(false); // KW 41
    expect(weekReport('2026-10-26', '2026-10-09', none).deload).toBe(true); // KW 44, 44 % 4 = 0
  });
});

describe('Trend', () => {
  it('liefert die letzten n Wochen, älteste zuerst', () => {
    const t = weekTrend('2026-10-09', 3, [s('2026-10-07', 'Verein A', 100), s('2026-09-30', 'Verein A', 60), s('2026-09-20', 'Verein A', 5)]);
    expect(t.map(x => x.monday)).toEqual(['2026-09-21', '2026-09-28', '2026-10-05']);
    expect(t.map(x => x.minutes)).toEqual([0, 60, 100]);
  });
});
