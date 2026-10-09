export const winProb = (me: number, opp: number) => 1 / (1 + Math.pow(10, (opp - me) / 150));

/** Änderungskonstante: 16 Grundwert, je +4 für <30 Einzel, >365 Tage Pause (15 Einzel lang), <21 J., <16 J. */
export function kFactor(o: { lt30: boolean; pause: boolean; u21: boolean; u16: boolean }) {
  return 16 + 4 * [o.lt30, o.pause, o.u21, o.u16].filter(Boolean).length;
}

/** Kaufmännisch runden, auch für negative Werte (−1,5 → −2) */
const roundHalfAway = (x: number) => Math.sign(x) * Math.round(Math.abs(x));

/** Abrechnung pro Veranstaltung: alle Einzel des Tages/Turniers zusammen */
export function ttrEvent(me: number, games: { opp: number; won: boolean }[], k = 16) {
  const expected = games.reduce((s, g) => s + winProb(me, g.opp), 0);
  const wins = games.filter(g => g.won).length;
  const delta = roundHalfAway((wins - expected) * k);
  return { expected, wins, delta, neu: me + delta };
}
// Kontrolle: ttrEvent(1580, [{opp:1590,won:true},{opp:1550,won:false}]).neu === 1579

const pad = (n: number) => String(n).padStart(2, '0');
export const stichtage = (y: number) => [2, 5, 8, 12].map(m => `${y}-${pad(m)}-11`);
export function nextStichtag(iso: string) { const y = +iso.slice(0, 4); return [...stichtage(y), ...stichtage(y + 1)].find(s => s >= iso)!; }
export function prevStichtag(iso: string) { const y = +iso.slice(0, 4); return [...stichtage(y - 1), ...stichtage(y)].filter(s => s <= iso).pop()!; }
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const fmt = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
