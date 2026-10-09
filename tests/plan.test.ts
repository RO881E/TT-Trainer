import { describe, expect, it } from 'vitest';
import type { Fixture, Match, Opponent, Session } from '../src/db';
import { dayPlan, weekdayIndex } from '../src/day';
import { matchPlan } from '../src/matchplan';
import { matchesCsv, sessionsCsv } from '../src/csv';
import { weekView } from '../src/week';

const fx = (date: string): Fixture => ({ uid: date, date, title: 'TS Frechen - TTC X', time: '19:30', location: 'Halle' });

describe('Tagesplan', () => {
  it('Vereinstraining ist Mittwoch und Freitag', () => {
    expect(weekdayIndex('2026-10-07')).toBe(2); // Mittwoch
    expect(dayPlan('2026-10-07', []).kind).toBe('club');
    expect(dayPlan('2026-10-09', []).kind).toBe('club'); // Freitag
    expect(dayPlan('2026-10-08', []).kind).toBe('home'); // Donnerstag
    expect(dayPlan('2026-10-10', []).kind).toBe('rest');
  });
  it('Trainingstag: Kohlenhydrate vor dem Training', () => {
    expect(dayPlan('2026-10-07', []).nutrition.items.some(i => i.text.includes('25–40 g'))).toBe(true);
    expect(dayPlan('2026-10-10', []).nutrition.items.some(i => i.text.includes('25–40 g'))).toBe(false);
  });
  it('Spieltag überschreibt den Wochenplan', () => {
    const p = dayPlan('2026-10-09', [fx('2026-10-09')]);
    expect(p.kind).toBe('match');
    expect(p.nutrition.items[0].text).toContain('50–100 g');
    expect(p.training.items[0].text).toContain('19:30');
  });
  it('Checklisten-IDs sind eindeutig', () => {
    const ids = dayPlan('2026-10-07', []).training.items.concat(dayPlan('2026-10-07', []).nutrition.items).map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Wochenansicht', () => {
  const s = (date: string, minutes: number): Session => ({ date, type: 'Verein A', minutes });
  it('Woche geht von Montag bis Sonntag, Soll aus dem Plan', () => {
    const w = weekView('2026-10-09', [s('2026-10-07', 110), s('2026-10-05', 40), s('2026-09-30', 999)], [fx('2026-10-10')]);
    expect(w.days.map(d => d.date)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(w.ist).toBe(150);
    expect(w.soll).toBe(40 + 50 + 120 + 40 + 120);
    expect(w.days[4].today).toBe(true);
    expect(w.days[5].fixtures).toHaveLength(1);
  });
  it('Sonntag gehört noch zur Woche davor', () => {
    expect(weekView('2026-10-11', [], []).days[0].date).toBe('2026-10-05');
  });
});

describe('Matchplan', () => {
  const opp: Opponent = { id: 1, name: 'Uwe', ttr: 1540, style: 'Abwehr', bhRubber: 'Lange Noppen', tactics: 'Kurz aufschlagen', updatedAt: '' };
  const m = (p: Partial<Match>): Match => ({ date: '2026-09-01', opponentId: 1, kind: 'Punktspiel', myTtr: 1550, oppTtr: 1540, sets: [[11, 5], [11, 6], [11, 7]], won: true, errors: {}, serve: { A: { used: 0, won: 0 }, B: { used: 0, won: 0 }, C: { used: 0, won: 0 } }, ...p });
  it('ohne Spiele: erstes Duell, Material-Warnung, Scouting', () => {
    const items = matchPlan(opp, [], [opp], 1550);
    expect(items[0].title).toBe('Erstes Duell');
    expect(items.some(i => i.icon === 'material' && i.warn)).toBe(true);
    expect(items.find(i => i.icon === 'note')!.text).toContain('Kurz aufschlagen');
  });
  it('mit Spielen: Bilanz, letztes Duell, bestes Muster gegen ihn', () => {
    const ms = [m({ date: '2026-08-01', won: false, sets: [[8, 11], [9, 11], [11, 9], [7, 11]], serve: { A: { used: 6, won: 2 }, B: { used: 6, won: 5 }, C: { used: 0, won: 0 } } }), m({ date: '2026-09-01' })];
    const items = matchPlan(opp, ms, [opp], 1550);
    expect(items[0].title).toBe('Bilanz 1:1');
    expect(items[0].text).toContain('01.09.2026');
    expect(items.find(i => i.icon === 'serve')!.title).toContain('Aufschlag B');
  });
  it('TTR-Lage: stärker, schwächer, Augenhöhe', () => {
    const t = (ttr: number) => matchPlan({ ...opp, ttr }, [], [opp], 1550).find(i => i.icon === 'ttr')!.title;
    expect(t(1700)).toContain('stärker'); expect(t(1400)).toContain('Favorit'); expect(t(1560)).toContain('Augenhöhe');
  });
});

describe('CSV-Export', () => {
  it('maskiert Trennzeichen und Anführungszeichen und beginnt mit BOM', () => {
    const opp: Opponent = { id: 1, name: 'Müller; "Mike"', updatedAt: '' };
    const csv = matchesCsv([{ date: '2026-10-01', opponentId: 1, kind: 'Turnier', myTtr: 1550, oppTtr: 1500, sets: [[11, 8], [9, 11], [11, 7]], won: true, errors: { RH: 2 }, serve: { A: { used: 0, won: 0 }, B: { used: 0, won: 0 }, C: { used: 0, won: 0 } }, notes: 'a;b' }], [opp]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Müller; ""Mike"""');
    expect(csv).toContain('11:8 9:11 11:7;2:1;S');
    expect(csv).toContain('"a;b"');
  });
  it('Trainings-CSV hat Kopfzeile und sortiert nach Datum', () => {
    const lines = sessionsCsv([{ date: '2026-10-02', type: 'Verein B', minutes: 90 }, { date: '2026-10-01', type: 'Verein A', minutes: 120 }]).split('\r\n');
    expect(lines[0]).toContain('Datum;Art;Minuten');
    expect(lines[1]).toContain('2026-10-01');
  });
});
