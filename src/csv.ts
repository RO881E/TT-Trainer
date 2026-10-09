import type { Match, Opponent, Session } from './db';

const cell = (v: unknown) => { const s = v === undefined || v === null ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = (head: string[], rows: unknown[][]) => `﻿${[head, ...rows].map(r => r.map(cell).join(';')).join('\r\n')}\r\n`;

export function matchesCsv(matches: Match[], opps: Opponent[]) {
  const om = new Map(opps.map(o => [o.id, o]));
  const rows = [...matches].sort((a, b) => a.date.localeCompare(b.date)).map(m => {
    const o = om.get(m.opponentId), w = m.sets.filter(([a, b]) => a > b).length;
    return [m.date, m.kind, o?.name, o?.club, o?.style, m.myTtr, m.oppTtr, m.sets.map(([a, b]) => `${a}:${b}`).join(' '), `${w}:${m.sets.length - w}`, m.won ? 'S' : 'N',
      m.errors.Aufschlag ?? 0, m.errors['Rückschlag'] ?? 0, m.errors.RH ?? 0, m.errors.VH ?? 0, m.errors['Stellung/Laufen'] ?? 0, m.mainError, m.notes];
  });
  return toCsv(['Datum', 'Art', 'Gegner', 'Verein', 'Typ', 'Mein TTR', 'Gegner-TTR', 'Sätze', 'Satzstand', 'Ergebnis', 'Fehler Aufschlag', 'Fehler Rückschlag', 'Fehler RH', 'Fehler VH', 'Fehler Stellung', 'Hauptfehler', 'Notizen'], rows);
}
export function sessionsCsv(sessions: Session[]) {
  return toCsv(['Datum', 'Art', 'Minuten', 'RPE', 'Thema', 'Notizen'], [...sessions].sort((a, b) => a.date.localeCompare(b.date)).map(s => [s.date, s.type, s.minutes, s.rpe, s.theme, s.notes]));
}
