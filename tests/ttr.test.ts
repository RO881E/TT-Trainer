import { describe, expect, it } from 'vitest';
import { daysBetween, fmt, kFactor, nextStichtag, prevStichtag, ttrEvent, winProb } from '../src/ttr';

describe('TTR-Formel', () => {
  it('reproduziert das Beispiel der Vereinsseite: 1580 gegen 1590 (S) und 1550 (N) ergibt 1579', () => {
    const r = ttrEvent(1580, [{ opp: 1590, won: true }, { opp: 1550, won: false }]);
    expect(r.neu).toBe(1579);
  });
  it('Gewinnwahrscheinlichkeit ist 50 % bei gleichem TTR und fällt mit der Differenz', () => {
    expect(winProb(1500, 1500)).toBeCloseTo(0.5);
    expect(winProb(1500, 1650)).toBeCloseTo(1 / 11, 5);
  });
  it('Änderungskonstante liegt zwischen 16 und 32', () => {
    expect(kFactor({ lt30: false, pause: false, u21: false, u16: false })).toBe(16);
    expect(kFactor({ lt30: true, pause: true, u21: true, u16: true })).toBe(32);
    expect(kFactor({ lt30: true, pause: false, u21: false, u16: false })).toBe(20);
  });
  it('rundet negative Änderungen kaufmännisch weg von null', () => {
    // erwartet 0,5 Siege bei 0 Siegen und k = 16 → −8 exakt; mit k = 19 → −9,5 → −10
    expect(ttrEvent(1500, [{ opp: 1500, won: false }], 19).delta).toBe(-10);
  });
});

describe('Q-TTR-Stichtage', () => {
  it('liefert den nächsten und letzten Stichtag', () => {
    expect(nextStichtag('2026-10-09')).toBe('2026-12-11');
    expect(nextStichtag('2026-12-12')).toBe('2027-02-11');
    expect(prevStichtag('2026-10-09')).toBe('2026-08-11');
    expect(prevStichtag('2026-01-05')).toBe('2025-12-11');
  });
  it('ein Stichtag selbst gilt noch als „nächster“', () => {
    expect(nextStichtag('2026-05-11')).toBe('2026-05-11');
  });
  it('Datumshilfen', () => {
    expect(daysBetween('2026-10-09', '2026-12-11')).toBe(63);
    expect(fmt('2026-10-09')).toBe('09.10.2026');
  });
});
