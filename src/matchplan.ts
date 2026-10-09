import type { Match, Material, Opponent } from './db';
import { DRILLS } from './plan';
import { type Bil, errorDist, materialOf, pct, serveStats, topError } from './stats';
import { fmt } from './ttr';

export type PlanItem = { icon: 'duel' | 'note' | 'type' | 'material' | 'serve' | 'error' | 'ttr'; title: string; text: string; warn?: boolean };

const MATERIAL_TIPS: Partial<Record<Material, string>> = {
  'Lange Noppen': 'Schnitt kommt umgekehrt zurück: Unterschnitt-Aufschlag wird zu Oberschnitt. Aktiv spielen, Tempo und Länge variieren, nicht in Schupf-Serien geraten.',
  'Anti': 'Wenig Eigenrotation, Schnitt wird nicht zurückgegeben. Mit Topspin angreifen, Platzierung variieren, Rückschläge nicht zu hoch spielen.',
  'Kurze Noppen': 'Schnelle, unregelmäßige Bälle mit wenig Schnitt. Früh kontrollieren, selbst Tempo machen und die Ellbogenlinie angreifen.',
  'Mittellange Noppen': 'Der Schnitt wird teilweise gedämpft zurückgegeben. Länge und Tempo wechseln, den Ball nicht einfach durchlaufen lassen.'
};

const bil = (ms: Match[]): Bil => ({ w: ms.filter(m => m.won).length, n: ms.length });
const fmtBil = (b: Bil) => `${b.w}:${b.n - b.w}`;

/** Matchplan für einen Gegner aus Profil und bisherigen Spielen. Reine Funktion, keine DB-Zugriffe. */
export function matchPlan(opp: Opponent, matches: Match[], opps: Opponent[], myTtr: number): PlanItem[] {
  const items: PlanItem[] = [];
  const om = new Map(opps.map(o => [o.id!, o]));
  const duels = matches.filter(m => m.opponentId === opp.id).sort((a, b) => b.date.localeCompare(a.date));

  if (duels.length) {
    const last = duels[0];
    items.push({ icon: 'duel', title: `Bilanz ${fmtBil(bil(duels))}`,
      text: `Zuletzt am ${fmt(last.date)}: ${last.won ? 'Sieg' : 'Niederlage'} (${last.sets.map(([a, b]) => `${a}:${b}`).join(' ')}).${last.notes ? ` Notiz: ${last.notes}` : ''}` });
  } else items.push({ icon: 'duel', title: 'Erstes Duell', text: 'Noch keine Spiele gegen diesen Gegner. Profil nach dem Spiel ergänzen.' });

  const notes = [
    opp.tactics && `Taktik: ${opp.tactics}`, opp.weaknesses && `Schwächen: ${opp.weaknesses}`,
    opp.strengths && `Stärken (Vorsicht): ${opp.strengths}`, opp.serves && `Seine Aufschläge: ${opp.serves}`
  ].filter(Boolean) as string[];
  if (notes.length) items.push({ icon: 'note', title: 'Dein Scouting', text: notes.join('\n') });

  const mat = materialOf(opp);
  if (mat !== 'Noppen innen') {
    const b = bil(matches.filter(m => materialOf(om.get(m.opponentId)) === mat));
    items.push({ icon: 'material', warn: true, title: `Material: ${mat}${b.n >= 2 ? ` (Bilanz ${fmtBil(b)})` : ''}`, text: MATERIAL_TIPS[mat] ?? '' });
  }

  const group = opp.style ? matches.filter(m => om.get(m.opponentId)?.style === opp.style) : [];
  if (opp.style && group.length >= 2) {
    const b = bil(group);
    items.push({ icon: 'type', warn: b.n >= 3 && pct(b) < 40, title: `Typ ${opp.style}: ${fmtBil(b)} (${pct(b)} %)`,
      text: b.n >= 3 && pct(b) < 40 ? 'Gegen diesen Typ läuft es bisher schwach. Matchplan klar festlegen und konsequent durchziehen.' : 'Bisherige Spiele gegen diesen Spielertyp. Hier läuft es ordentlich.' });
  }

  const against = duels.length >= 2 ? duels : group.length >= 3 ? group : [];
  const te = topError(errorDist(against));
  if (te) items.push({ icon: 'error', title: `Häufigster Fehler: ${te}`, text: `${duels.length >= 2 ? 'In den Duellen mit ihm' : `Gegen ${opp.style}-Spieler`} die Schwachstelle. ${DRILLS[te]}.` });

  const sv = serveStats(duels.length ? duels : []);
  const own = serveStats(matches);
  const pick = (s: Record<string, Bil>, min: number) => Object.entries(s).filter(([, b]) => b.n >= min).sort((a, b) => pct(b[1]) - pct(a[1]))[0];
  const vsHim = pick(sv, 5), overall = pick(own, 10);
  if (vsHim) items.push({ icon: 'serve', title: `Aufschlag ${vsHim[0]} gegen ihn (${pct(vsHim[1])} %)`, text: `${vsHim[1].w} von ${vsHim[1].n} Punkten gewonnen. Das ist dein bestes Muster in den Duellen mit ihm.` });
  else if (overall) items.push({ icon: 'serve', title: `Dein bestes Muster: ${overall[0]} (${pct(overall[1])} %)`, text: 'Gegen ihn gibt es noch zu wenig Daten. In knappen Phasen ab 8:8 bewusst einsetzen.' });

  const diff = (opp.ttr ?? myTtr) - myTtr;
  items.push({ icon: 'ttr', title: diff > 75 ? `Er ist stärker (+${diff} TTR)` : diff < -75 ? `Du bist Favorit (${diff} TTR)` : 'Augenhöhe (±75 TTR)',
    text: diff > 75 ? 'Nichts zu verlieren: mutig spielen, eigene Stärke früh ins Spiel bringen. Jeder Satz ist Gewinn.'
      : diff < -75 ? 'Fehler vermeiden, Risiko dosieren und kein Tempo mitgehen, das du nicht brauchst.'
      : 'Knappe Sätze entscheiden: feste Aufschlagroutine ab 8:8 und den Entscheidungssatz mental vorbereiten.' });
  return items;
}

