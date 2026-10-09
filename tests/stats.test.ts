import { describe, expect, it } from 'vitest';
import type { Match, Opponent, TtrLog, WeightLog } from '../src/db';
import { band, bilanz, errorDist, materialOf, milestoneStatus, pct, serveStats, setStats, topError, weight7 } from '../src/stats';
import { parseSets } from '../src/sets';

const serve = (a = 0, aw = 0) => ({ A: { used: a, won: aw }, B: { used: 0, won: 0 }, C: { used: 0, won: 0 } });
const match = (p: Partial<Match> = {}): Match => ({ date: '2026-10-01', opponentId: 1, kind: 'Punktspiel', myTtr: 1550, oppTtr: 1550, sets: [[11, 5], [11, 6], [11, 7]], won: true, errors: {}, serve: serve(), ...p });

describe('Satz-Eingabe', () => {
  it('Kurznotation: Zahl = Punkte des Verlierers, Minus = verloren', () => {
    expect(parseSets('8 -9 7 9')).toEqual([[11, 8], [9, 11], [11, 7], [11, 9]]);
  });
  it('Verlängerung: „+12“ ist 14:12', () => { expect(parseSets('+12')).toEqual([[14, 12]]); });
  it('volle Notation und Trennzeichen', () => { expect(parseSets('11:8, 9-11;12:10')).toEqual([[11, 8], [9, 11], [12, 10]]); });
  it('ignoriert Unsinn', () => { expect(parseSets('abc')).toEqual([]); });
});

describe('Bilanzen', () => {
  it('pct rundet und behandelt leere Bilanz', () => {
    expect(pct({ w: 2, n: 3 })).toBe(67);
    expect(pct({ w: 0, n: 0 })).toBe(0);
    expect(pct(undefined)).toBe(0);
  });
  it('TTR-Band: ±75 ist Augenhöhe', () => {
    expect(band(match({ oppTtr: 1625 }))).toContain('Augenhöhe');
    expect(band(match({ oppTtr: 1626 }))).toContain('stärker');
    expect(band(match({ oppTtr: 1474 }))).toContain('schwächer');
  });
  it('bilanz gruppiert nach Schlüssel', () => {
    const r = bilanz([match(), match({ won: false }), match({ oppTtr: 1700 })], band);
    expect(r['Augenhöhe (±75)']).toEqual({ w: 1, n: 2 });
  });
  it('Material ist der erste Belag, der nicht „Noppen innen“ ist (RH vor VH)', () => {
    const o = (p: Partial<Opponent>): Opponent => ({ name: 'X', updatedAt: '', ...p });
    expect(materialOf(o({}))).toBe('Noppen innen');
    expect(materialOf(o({ fhRubber: 'Anti', bhRubber: 'Lange Noppen' }))).toBe('Lange Noppen');
    expect(materialOf(o({ fhRubber: 'Anti' }))).toBe('Anti');
  });
});

describe('Sätze, Fehler, Aufschläge', () => {
  it('knappe Sätze und Entscheidungssatz', () => {
    const s = setStats([match({ sets: [[11, 9], [9, 11], [11, 3], [8, 11], [11, 8]], won: true })]);
    expect(s.sets).toBe(5);
    expect(s.c9).toEqual({ w: 1, n: 2 });
    expect(s.c8).toEqual({ w: 2, n: 4 });
    expect(s.decider).toEqual({ w: 1, n: 1 });
  });
  it('Fehler: Zähler zählen, sonst zählt der Hauptfehler einmal', () => {
    const d = errorDist([match({ errors: { RH: 3, VH: 1 } }), match({ mainError: 'Aufschlag' })]);
    expect(d.RH).toBe(3); expect(d.VH).toBe(1); expect(d.Aufschlag).toBe(1);
    expect(topError(d)).toBe('RH');
    expect(topError(errorDist([]))).toBeUndefined();
  });
  it('Aufschlagmuster summieren', () => {
    const s = serveStats([match({ serve: serve(10, 6) }), match({ serve: serve(10, 4) })]);
    expect(s.A).toEqual({ w: 10, n: 20 });
  });
});

describe('Gewicht und Meilensteine', () => {
  const w = (date: string, kg: number): WeightLog => ({ date, kg });
  it('7-Tage-Mittel bis zur letzten Messung', () => {
    expect(weight7([w('2026-10-01', 120), w('2026-10-08', 110), w('2026-10-09', 112)])).toBe(111);
    expect(weight7([])).toBeUndefined();
  });
  it('„stabil“ braucht zwei Q-TTR-Einträge in Folge ≥ Meilenstein', () => {
    const q = (date: string, value: number): TtrLog => ({ date, value, isQ: true });
    expect(milestoneStatus(1610, [q('2026-02-11', 1580), q('2026-05-11', 1605)], 1600)).toBe('erreicht');
    expect(milestoneStatus(1610, [q('2026-02-11', 1601), q('2026-05-11', 1605)], 1600)).toBe('stabil');
    expect(milestoneStatus(1500, [], 1600)).toBe('offen');
  });
});
