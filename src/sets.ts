/** "11:8 9:11" oder Kurznotation "8 -9 +12" (positiv = gewonnen, Zahl = Punkte des Verlierers) */
export function parseSets(s: string): [number, number][] {
  return s.trim().split(/[\s,;]+/).filter(Boolean).flatMap((tok): [number, number][] => {
    const m = tok.match(/^(\d+)[:\-](\d+)$/);
    if (m) return [[+m[1], +m[2]]];
    if (/^[+-]?\d+$/.test(tok)) {
      const n = Math.abs(+tok), win = !tok.startsWith('-'), hi = Math.max(11, n + 2);
      return [win ? [hi, n] : [n, hi]];
    }
    return [];
  });
}
