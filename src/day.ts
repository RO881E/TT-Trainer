import type { Fixture } from './db';
import type { Focus } from './cycle';
import { WEEK, type DayKind } from './plan';

export type DayItem = { id: string; text: string };
export type DayPlan = {
  kind: DayKind | 'match'; fixtures: Fixture[];
  training: { title: string; items: DayItem[] }; nutrition: { title: string; items: DayItem[] };
};
const items = (prefix: string, texts: string[]): DayItem[] => texts.map(text => ({ id: `${prefix}:${text}`, text }));
export const weekdayIndex = (iso: string) => (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;

const KETO = ['Keto-Basis: unter 50 g Kohlenhydrate', 'Protein 140–185 g, auf alle Mahlzeiten verteilt', 'Elektrolyte und ausreichend Wasser'];

/** Training und Ernährung für einen Tag: Spieltag überschreibt den Wochenplan. */
export function dayPlan(iso: string, fixtures: Fixture[], focus?: Focus): DayPlan {
  const w = WEEK[weekdayIndex(iso)];
  const today = fixtures.filter(f => f.date === iso);
  if (today.length) {
    const f = today[0];
    const when = [f.time, f.location].filter(Boolean).join(' · ');
    return { kind: 'match', fixtures: today,
      training: { title: `Spieltag: ${f.title}`, items: items('t', [when && `Beginn/Ort: ${when}`, 'Aufschläge und Rückschläge einspielen', 'Matchplan der Gegner im Profil ansehen', 'Nach dem Spiel Ergebnisse erfassen'].filter(Boolean) as string[]) },
      nutrition: { title: 'Ernährung: Spieltag', items: items('n', ['50–100 g Kohlenhydrate über den Spieltag verteilt', 'Leichte Mahlzeit 2–3 h vor Spielbeginn', 'Snack zwischen den Spielen (Banane, Reiskuchen)', 'Protein 140–185 g insgesamt', 'Elektrolyte und ausreichend Wasser']) } };
  }
  const extra = w.kind === 'club' ? ['25–40 g Kohlenhydrate etwa 60 min vor dem Training', 'Nach dem Training eine proteinreiche Mahlzeit']
    : w.type === 'Heim-Kraft' ? ['Vor der Einheit bei Bedarf 25–40 g Kohlenhydrate', 'Nach dem Krafttraining Protein'] : [];
  return { kind: w.kind, fixtures: [],
    training: { title: `${w.day}: ${w.title}`, items: items('t', focus ? withFocus(w.items, w.type, focus) : w.items) },
    nutrition: { title: w.kind === 'club' ? 'Ernährung: Trainingstag' : w.kind === 'home' ? 'Ernährung: Heimtraining' : 'Ernährung: Ruhetag', items: items('n', [...KETO, ...extra]) } };
}

/** Allgemeine Platzhalter des Wochenplans durch die Aufgaben des aktuellen Zyklus-Blocks ersetzen. */
function withFocus(base: string[], type: string | null, f: Focus): string[] {
  if (type === 'Verein A') return base.flatMap(t => t.startsWith('45 min Hauptthema') ? f.drills.map(d => `Hauptthema (45 min): ${d}`) : [t]);
  if (type === 'Verein B') return base.flatMap(t => t.startsWith('60 min Matchspiel') ? [`60 min Matchspiel mit Aufgabe: ${f.spielnah[f.spielnah.length - 1]}`] : t.startsWith('40 min unregelm') ? [`40 min unregelmäßige Übungen: ${f.spielnah[0]}`] : [t]);
  if (type === 'Heim 40') return [...base, `Technik zuhause: ${f.home[0]}`];
  return base;
}
