import { ERR_CATS, type ErrCat, type KneeLog, type Match, type Material, type Opponent, type TtrLog, type WeightLog } from './db';
import { DRILLS, PHASES, PLAYER } from './plan';
import { fmt, prevStichtag } from './ttr';

export type Bil = { w: number; n: number };
export const pct = (b?: Bil) => (b && b.n ? Math.round((100 * b.w) / b.n) : 0);
const add = (r: Record<string, Bil>, k: string, won: boolean) => { const b = (r[k] ??= { w: 0, n: 0 }); b.n++; if (won) b.w++; };
export const todayIso = () => new Date().toLocaleDateString('sv-SE');
export const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toLocaleDateString('sv-SE');

export function band(m: Match) {
  const d = m.oppTtr - m.myTtr;
  return d < -75 ? 'schwächer (< −75)' : d > 75 ? 'stärker (> +75)' : 'Augenhöhe (±75)';
}
export function bilanz(ms: Match[], key: (m: Match) => string | undefined) {
  const r: Record<string, Bil> = {};
  for (const m of ms) { const k = key(m); if (k !== undefined) add(r, k, m.won); }
  return r;
}
export function materialOf(o?: Opponent): Material {
  return [o?.bhRubber, o?.fhRubber].find(v => v && v !== 'Noppen innen') ?? 'Noppen innen';
}
export const range1500_1650 = (m: Match) => (m.oppTtr >= 1500 && m.oppTtr <= 1650 ? '1500–1650' : undefined);
export const quarterOf = (m: Match) => `ab ${fmt(prevStichtag(m.date))}`;

export function setStats(ms: Match[]) {
  const s = { sets: 0, c8: { w: 0, n: 0 }, c9: { w: 0, n: 0 }, decider: { w: 0, n: 0 } };
  for (const m of ms) {
    for (const [a, b] of m.sets) {
      s.sets++;
      if (Math.min(a, b) >= 8) { s.c8.n++; if (a > b) s.c8.w++; }
      if (Math.min(a, b) >= 9) { s.c9.n++; if (a > b) s.c9.w++; }
    }
    if (m.sets.length === 5) { s.decider.n++; if (m.sets[4][0] > m.sets[4][1]) s.decider.w++; }
  }
  return s;
}
export function errorDist(ms: Match[]) {
  const r = Object.fromEntries(ERR_CATS.map(c => [c, 0])) as Record<ErrCat, number>;
  for (const m of ms) {
    const sum = ERR_CATS.reduce((s, c) => s + (m.errors[c] ?? 0), 0);
    if (sum) ERR_CATS.forEach(c => (r[c] += m.errors[c] ?? 0));
    else if (m.mainError) r[m.mainError] += 1;
  }
  return r;
}
export function topError(d: Record<ErrCat, number>): ErrCat | undefined {
  const [c, v] = Object.entries(d).sort((a, b) => b[1] - a[1])[0] ?? [];
  return v ? (c as ErrCat) : undefined;
}
export function serveStats(ms: Match[]) {
  const r: Record<string, Bil> = { A: { w: 0, n: 0 }, B: { w: 0, n: 0 }, C: { w: 0, n: 0 } };
  for (const m of ms) for (const p of ['A', 'B', 'C'] as const) { r[p].n += m.serve[p].used; r[p].w += m.serve[p].won; }
  return r;
}
export function weight7(ws: WeightLog[]) {
  if (!ws.length) return undefined;
  const last = [...ws].sort((a, b) => a.date.localeCompare(b.date)).pop()!.date;
  const from = new Date(Date.parse(last) - 6 * 864e5).toISOString().slice(0, 10);
  const xs = ws.filter(w => w.date >= from && w.date <= last);
  return Math.round((xs.reduce((s, w) => s + w.kg, 0) / xs.length) * 10) / 10;
}
export function weightSeries(ws: WeightLog[]) {
  const s = [...ws].sort((a, b) => a.date.localeCompare(b.date));
  return s.map((w, i) => ({ x: w.date, y: weight7(s.slice(0, i + 1))! }));
}
export const currentTtr = (t: TtrLog[]) => ([...t].sort((a, b) => a.date.localeCompare(b.date)).pop()?.value ?? PLAYER.startTtr);
export const currentPhase = (ttr: number) => PHASES.find(p => ttr < p.to) ?? PHASES[PHASES.length - 1];
export function milestoneStatus(ttr: number, logs: TtrLog[], m: number) {
  const q = logs.filter(l => l.isQ).sort((a, b) => a.date.localeCompare(b.date));
  const stable = q.some((l, i) => i > 0 && q[i - 1].value >= m && l.value >= m);
  return stable ? 'stabil' : ttr >= m ? 'erreicht' : 'offen';
}

export type Rec = { prio: number; title: string; text: string };
export function recommendations(d: { matches: Match[]; opps: Opponent[]; knee: KneeLog[]; weight: WeightLog[]; ttr: TtrLog[] }): Rec[] {
  const recs: Rec[] = [];
  const om = new Map(d.opps.map(o => [o.id!, o]));
  const last30 = d.matches.filter(m => m.date >= daysAgo(30));
  const te = topError(errorDist(last30));
  if (te) recs.push({ prio: 1, title: `Nächstes Hauptthema: ${te}`, text: `Häufigster Fehler der letzten 30 Tage. ${DRILLS[te]}.` });
  for (const [k, b] of Object.entries(bilanz(d.matches, m => materialOf(om.get(m.opponentId)))))
    if (k !== 'Noppen innen' && b.n >= 3 && pct(b) < 40)
      recs.push({ prio: 2, title: `Schwach gegen ${k} (${b.w}:${b.n - b.w})`, text: `Materialtraining: Trainingspartner mit ${k} suchen; Schnittumkehr üben, Tempo- und Längenwechsel, nicht in Serien schupfen.` });
  for (const [k, b] of Object.entries(bilanz(d.matches, m => om.get(m.opponentId)?.style)))
    if (b.n >= 3 && pct(b) < 40)
      recs.push({ prio: 3, title: `Schwach gegen Typ „${k}“ (${b.w}:${b.n - b.w})`, text: `Im Vereinstraining (Fr) Matchspiel mit Aufgabe gegen ${k}-Spieler; Matchplan vorab im Gegnerprofil notieren.` });
  const ss = setStats(d.matches);
  if (ss.c8.n >= 5 && pct(ss.c8) < 45)
    recs.push({ prio: 4, title: `Knappe Sätze nur ${pct(ss.c8)} %`, text: 'Satzende-Training: Spielformen ab 8:8, feste Aufschlagroutine, bestes Aufschlagmuster für knappe Phasen reservieren.' });
  const eq = bilanz(d.matches.filter(m => m.date >= daysAgo(120)), band)['Augenhöhe (±75)'];
  if (eq && eq.n >= 5 && pct(eq) < 50)
    recs.push({ prio: 5, title: `±75-Bilanz ${pct(eq)} % (Ziel ≥ 50 %)`, text: 'Mehr Matchpraxis gegen Gleichstarke (Turniere), Matchpläne aus den Gegnerprofilen nutzen.' });
  const sv = serveStats(d.matches);
  const valid = Object.entries(sv).filter(([, b]) => b.n >= 10);
  for (const [p, b] of valid) if (pct(b) < 45) recs.push({ prio: 6, title: `Aufschlagmuster ${p} nur ${pct(b)} %`, text: 'Variante prüfen (Platzierung, Länge, 3. Ball). Im Video (Liimba) gezielt die 3. Bälle ansehen.' });
  const best = valid.sort((a, b) => pct(b[1]) - pct(a[1]))[0];
  if (best && pct(best[1]) >= 55) recs.push({ prio: 7, title: `Muster ${best[0]} ist dein bestes (${pct(best[1])} %)`, text: 'In knappen Sätzen bewusst einsetzen.' });
  const sinceQ = d.matches.filter(m => m.date >= prevStichtag(todayIso())).length;
  if (sinceQ < 20) recs.push({ prio: 8, title: `${sinceQ} Einzel seit dem letzten Stichtag`, text: 'Ziel 20–30 Einzel pro Quartal: zusätzliche Turniere einplanen.' });
  const k = [...d.knee].sort((a, b) => a.date.localeCompare(b.date)).pop();
  const w7 = weight7(d.weight);
  if (k && k.slds > 3) recs.push({ prio: 2, title: `Knie: Decline-Squat ${k.slds}/10`, text: 'Stufe halten oder eine Stufe zurück, Isometrie vor dem Training; bei anhaltendem Schmerz Physiotherapie.' });
  else if (k && k.stage === 2 && (k.visaP ?? 0) >= 75)
    recs.push({ prio: 6, title: 'Knie: Kriterien für Stufe 3 fast erfüllt', text: w7 && w7 <= 108 ? 'Sprungprogression vorsichtig beginnen.' : 'Sprünge erst bei 7-Tage-Mittel ≤ 105–108 kg – Stufe 2 fortsetzen.' });
  const ph = currentPhase(currentTtr(d.ttr));
  if (w7 && w7 > ph.weight) recs.push({ prio: 9, title: `Gewicht ${w7} kg (Phasenziel ${ph.weight} kg)`, text: 'Keto-Basis, Protein 140–185 g, KH nur gezielt vor intensiven Einheiten und an Spieltagen.' });
  return recs.sort((a, b) => a.prio - b.prio);
}
