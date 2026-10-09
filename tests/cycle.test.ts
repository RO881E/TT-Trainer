import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../src/cyclePlan';
import { blockForError, endBlockThisWeek, focusFor, initialCycle, locate, move, pullAfter, schedule, setResult, setWeeks, stufeOf, withNewBlocks } from '../src/cycle';
import { dayPlan } from '../src/day';

const s0 = { ...initialCycle('2026-10-09') }; // Freitag → Start Montag 12.10.2026

describe('Plan-Inhalt', () => {
  it('Schlüssel sind eindeutig, jeder Block hat Test, Ziel und Übungen', () => {
    expect(new Set(BLOCKS.map(b => b.key)).size).toBe(BLOCKS.length);
    for (const b of BLOCKS) {
      expect(b.test.label && b.test.target && b.goal).toBeTruthy();
      for (const k of ['einfuehren', 'festigen', 'variation'] as const) expect(b.drills[k].length, `${b.key} ${k}`).toBeGreaterThan(0);
      expect(b.spielnah.length).toBeGreaterThan(0); expect(b.home.length).toBeGreaterThan(0);
      expect(b.weeks).toBeGreaterThanOrEqual(4);
    }
  });
  it('drei Jahre à 52 Wochen', () => {
    for (const y of [1, 2, 3]) expect(BLOCKS.filter(b => b.year === y).reduce((a, b) => a + b.weeks, 0)).toBe(52);
  });
  it('beginnt mit RH-Topspin gegen Unterschnitt (Ausgangsstand des Spielers)', () => { expect(BLOCKS[0].key).toBe('y1-rh-unterschnitt'); });
});

describe('Zeitplan', () => {
  it('Start am nächsten Montag, Blöcke direkt hintereinander', () => {
    expect(s0.start).toBe('2026-10-12');
    const sl = schedule(s0);
    expect(sl[0]).toMatchObject({ start: '2026-10-12', end: '2026-11-08', weeks: 4 });
    expect(sl[1].start).toBe('2026-11-09');
    expect(sl.length).toBe(BLOCKS.length);
  });
  it('Start am Montag selbst bleibt heute', () => { expect(initialCycle('2026-10-12').start).toBe('2026-10-12'); });
  it('Verlängern verschiebt alle Folgeblöcke', () => {
    const s = setWeeks(s0, 'y1-rh-unterschnitt', 5);
    expect(schedule(s)[1].start).toBe('2026-11-16');
    expect(schedule(s)[0].weeks).toBe(5);
  });
  it('Dauer bleibt zwischen 1 und 12 Wochen', () => {
    expect(schedule(setWeeks(s0, 'y1-rh-unterschnitt', 0))[0].weeks).toBe(1);
    expect(schedule(setWeeks(s0, 'y1-rh-unterschnitt', 99))[0].weeks).toBe(12);
  });
  it('Reihenfolge ändern und Block vorziehen', () => {
    const m = move(s0, 'y1-rh-unterschnitt', 1);
    expect(m.order[0]).toBe('y1-rh-block-passiv'); expect(m.order[1]).toBe('y1-rh-unterschnitt');
    expect(move(s0, 'y1-rh-unterschnitt', -1)).toBe(s0);
    const p = pullAfter(s0, 'y1-rh-eroeffnung', 'y1-rh-unterschnitt');
    expect(p.order.slice(0, 3)).toEqual(['y1-rh-unterschnitt', 'y1-rh-eroeffnung', 'y1-rh-block-passiv']);
  });
  it('neue Blöcke aus App-Updates werden angehängt', () => {
    const old = { ...s0, order: s0.order.slice(0, 5) };
    expect(withNewBlocks(old).order.length).toBe(BLOCKS.length);
  });
});

describe('Position im Plan', () => {
  it('vor dem Start: kommender Block', () => {
    expect(locate(s0, '2026-10-09')).toMatchObject({ startsInDays: 3 });
  });
  it('Woche und Stufe eines 4-Wochen-Blocks', () => {
    const at = (d: string) => { const p = locate(s0, d); return 'slot' in p ? [p.week, p.stufe] : p; };
    expect(at('2026-10-12')).toEqual([1, 'einfuehren']);
    expect(at('2026-10-21')).toEqual([2, 'festigen']);
    expect(at('2026-10-28')).toEqual([3, 'variation']);
    expect(at('2026-11-08')).toEqual([4, 'test']);
    expect(at('2026-11-09')).toEqual([1, 'einfuehren']); // nächster Block
  });
  it('Stufen bei 5 Wochen und sehr kurzen Blöcken', () => {
    expect([0, 1, 2, 3, 4].map(i => stufeOf(i, 5))).toEqual(['einfuehren', 'festigen', 'variation', 'variation', 'test']);
    expect(stufeOf(0, 1)).toBe('festigen'); expect([0, 1].map(i => stufeOf(i, 2))).toEqual(['einfuehren', 'test']);
  });
  it('Block früher beenden verkürzt auf die laufende Woche', () => {
    const s = endBlockThisWeek(s0, 'y1-rh-unterschnitt', '2026-10-21');
    expect(schedule(s)[0].weeks).toBe(2);
    expect(schedule(s)[1].start).toBe('2026-10-26');
    expect(endBlockThisWeek(s0, 'y1-rh-unterschnitt', '2026-10-01')).toBe(s0);
  });
  it('Plan abgeschlossen nach dem letzten Block', () => { expect(locate(s0, '2035-01-01')).toEqual({ done: true }); });
  it('Testergebnis wird gespeichert', () => {
    const s = setResult(s0, 'y1-rh-unterschnitt', { date: '2026-11-05', value: '21 in Folge', passed: true });
    expect(s.results['y1-rh-unterschnitt'].passed).toBe(true);
  });
  it('Statistik-Fehler passenden Block finden', () => {
    expect(blockForError(s0, 'Aufschlag', 'y1-rh-unterschnitt')?.key).toBe('y1-rh-eroeffnung');
    expect(blockForError(s0, 'Aufschlag', 'y3-lueck')).toBeUndefined();
  });
});

describe('Tagesplan mit Block-Thema', () => {
  const focus = focusFor(locate(s0, '2026-10-14'));
  it('Mittwoch: Hauptthema aus dem Block statt Platzhalter', () => {
    const items = dayPlan('2026-10-14', [], focus).training.items.map(i => i.text);
    expect(items.some(t => t.startsWith('Hauptthema (45 min):'))).toBe(true);
    expect(items.some(t => t.startsWith('45 min Hauptthema'))).toBe(false);
  });
  it('Freitag: Matchaufgabe aus dem Block, Donnerstag: Technik zuhause', () => {
    expect(dayPlan('2026-10-16', [], focus).training.items.some(i => i.text.startsWith('60 min Matchspiel mit Aufgabe: '))).toBe(true);
    expect(dayPlan('2026-10-15', [], focus).training.items.some(i => i.text.startsWith('Technik zuhause:'))).toBe(true);
  });
  it('ohne Plan bleibt der Wochenplan unverändert', () => {
    expect(dayPlan('2026-10-14', []).training.items.some(i => i.text.startsWith('45 min Hauptthema'))).toBe(true);
  });
  it('Testwoche nennt den Test', () => {
    const f = focusFor(locate(s0, '2026-11-04'));
    expect(f?.stufe).toBe('test'); expect(f?.drills[0]).toContain('Test heute oder diese Woche');
  });
});
