import type { ErrCat, SessionType } from './db';

export const PLAYER = { name: 'Robert Winters', club: 'TS Frechen', league: '1. Bezirksklasse, Position 1', startTtr: 1552, goalTtr: 1870 };

export const MILESTONES = [
  { ttr: 1565, label: 'Eigener Höchstwert', pct: 'Top 10 %' },
  { ttr: 1600, label: 'Magische Marke', pct: '' },
  { ttr: 1612, label: '', pct: 'Top 7,5 %' },
  { ttr: 1650, label: 'Checkpoint', pct: '' },
  { ttr: 1670, label: '', pct: 'Top 5 %' },
  { ttr: 1700, label: 'Checkpoint', pct: 'Top 4 %' },
  { ttr: 1737, label: '', pct: 'Top 3 %' },
  { ttr: 1788, label: '', pct: 'Top 2 %' },
  { ttr: 1870, label: 'Ziel', pct: 'Top 1 %' }
];

export const PHASES = [
  { n: 1, name: 'Phase 1 (bis Mai 2027)', to: 1612, steps: '1552 → 1565 → 1600 → 1612', weight: 112,
    focus: 'RH gegen Topspin, Rückschlag, Aufschlagmuster A–C, mehr Turniere',
    checks: ['Q-TTR ≥ 1600', 'Bilanz gegen 1500–1650 ≥ 55 %', 'RH-Block gegen Topspin ≥ 10 in Folge', 'VISA-P ≥ 70', 'Gewicht ≤ 112 kg'] },
  { n: 2, name: 'Phase 2 (Saison 2027/28)', to: 1670, steps: '1612 → 1650 → 1670', weight: 103,
    focus: 'Bezirksliga, Gegentopspin, RH-Topspin, 2. Aufschlagsystem',
    checks: ['Q-TTR ≥ 1650 an zwei Stichtagen', 'Bezirksliga-Bilanz ≥ 50 %', '≥ 50 % Punktgewinn nach eigenem Aufschlag', 'VISA-P ≥ 80', '100–103 kg'] },
  { n: 3, name: 'Phase 3 (ca. 2028/29)', to: 1737, steps: '1670 → 1700 → 1737', weight: 95,
    focus: '3 Tischeinheiten, Topspin-Duelle, Plan B', checks: ['93–95 kg'] },
  { n: 4, name: 'Phase 4 (ca. 2029–2031)', to: 1788, steps: '1737 → 1788', weight: 90,
    focus: 'Landesliga, Gegner lesen, Matchpläne, 100+ Einzel', checks: ['88–90 kg'] },
  { n: 5, name: 'Phase 5 (ca. 2031–2033)', to: 1870, steps: '1788 → 1870', weight: 85,
    focus: 'Feinschliff, 4+ Aufschlagsysteme', checks: ['ca. 85 kg'] }
];

export const MIX_LABELS = ['Technik', 'Athletik', 'Aufschlag/Rückschlag', 'Spielpraxis'];
export function rhythmFor(iso: string) {
  const m = +iso.slice(5, 7), d = +iso.slice(8, 10);
  if ((m === 12 && d >= 20) || (m === 1 && d <= 6)) return { name: 'Winterpause', mix: [35, 35, 15, 15] };
  if (m === 6 || m === 7) return { name: 'Sommer (Jun–Jul)', mix: [40, 40, 10, 10] };
  if (m === 8) return { name: 'August', mix: [25, 25, 20, 30] };
  if (m >= 9) return { name: 'Vorrunde (Sep–Dez)', mix: [15, 30, 25, 30] };
  if (m <= 4) return { name: 'Rückrunde (Jan–Apr)', mix: [15, 30, 25, 30] };
  return { name: 'Mai – Turniere', mix: [10, 25, 20, 45] };
}
export const MESO = '3 Wochen Belastung + 1 Woche Entlastung; ein technisches Hauptthema pro 4-Wochen-Block.';

export type DayKind = 'club' | 'home' | 'rest';
/** Vereinstraining ist Mittwoch und Freitag. */
export const WEEK: { day: string; title: string; kind: DayKind; type: SessionType | null; minutes: number; items: string[] }[] = [
  { day: 'Montag', title: 'Heim-Kraft mit Bändern', kind: 'home', type: 'Heim-Kraft', minutes: 40, items: ['Knie: aktuelle Stufe', 'Kraftübungen mit Bändern, ca. 40 min', 'Übungsliste unter Mehr → Trainingsplan'] },
  { day: 'Dienstag', title: 'Rad/Ausdauer', kind: 'home', type: 'Ausdauer', minutes: 50, items: ['40–60 min locker', '10 min Mobilität'] },
  { day: 'Mittwoch', title: 'Vereinstraining A – Technik & System', kind: 'club', type: 'Verein A', minutes: 120, items: ['Vorher 15 min Aufschläge', '15 min Einspielen', '45 min Hauptthema', '30 min Aufschlag/Rückschlag/3. Ball', '30 min Spielformen'] },
  { day: 'Donnerstag', title: 'Heimeinheit 40 min', kind: 'home', type: 'Heim 40', minutes: 40, items: ['15 min Knie-Isometrie', '15 min Schatten-Beinarbeit', '10 min Mobilität'] },
  { day: 'Freitag', title: 'Vereinstraining B – spielnah', kind: 'club', type: 'Verein B', minutes: 120, items: ['20 min Einspielen', '40 min unregelmäßige Übungen', '60 min Matchspiel mit Aufgabe', '1× pro Woche Video für Liimba'] },
  { day: 'Samstag', title: 'Punktspiel/Turnier oder 2. Krafteinheit', kind: 'rest', type: null, minutes: 0, items: ['Spieltermine siehe Mehr → Spieltermine'] },
  { day: 'Sonntag', title: 'Erholung oder 2. Krafteinheit', kind: 'rest', type: null, minutes: 0, items: ['Locker bewegen, Mobilität'] }
];

export const HOME_STRENGTH = [
  'Knie: aktuelle Stufe', 'Rumänisches Kreuzheben mit Band 3×10–15', 'Hüftheben mit Band 3×12–15',
  'Seitliches Beinabspreizen 2×15/Seite', 'Rudern am Türanker 3×12–15', 'Liegestütz erhöht 3×8–12',
  'Pallof-Press 3×10/Seite', 'Woodchopper 3×10/Seite', 'Dead Bug 2×8/Seite', 'Ab Phase 2: Topspin-Zusatz'
];
export const BANDS = 'Widerstandsbänder 5er-Set 4,5–22,6 kg, Griffe, Fußschlaufen, Türanker (kein Gym).';

export const KNEE_STAGES = [
  { n: 1, name: 'Isometrie', how: 'Wandsitz/Spanish Squat 5×30–45 s', next: 'Weiter, wenn Schmerz ≤ 3/10 und am nächsten Morgen nicht schlechter.' },
  { n: 2, name: 'Schwer & langsam', how: 'Stuhl-Kniebeuge, Split Squat, Step-ups, Beinstrecken gegen Band; 3 s ab/3 s auf, 3–4×8–15', next: 'Weiter bei VISA-P ≥ 75–80 und Decline-Squat ≤ 3/10.' },
  { n: 3, name: 'Sprünge', how: 'Sprungprogression', next: 'Erst unter ca. 105–108 kg.' },
  { n: 4, name: 'Sportspezifisch', how: 'TT-spezifische Sprung- und Richtungswechsel', next: '' }
];
export const KNEE_MONITOR = 'Wöchentlich Single-Leg-Decline-Squat-Schmerz 0–10, alle 6–8 Wochen VISA-P.';

export const BH_STAGES = [
  'RH-Block gegen Topspin (Ziel: 20 in Folge)', 'Aktiver Block/Konter mit Platzierung (15 in Folge)',
  'Übergang RH zu VH (8/10)', 'RH-Topspin gegen Topspin (6/10)'
];

export const SERVES = [
  { id: 'A', text: 'Kurzer Seit-Unterschnitt in VH-Mitte → langer Schupf → VH-Topspin' },
  { id: 'B', text: 'Kurzer Leerball, gleiche Bewegung → Schupf zu hoch → VH-Topspin mit Tempo' },
  { id: 'C', text: 'Langer schneller Seitschnitt in RH-Ellbogen → passiver Block → VH-Topspin mit Seitspin' }
];

export const NUTRITION = [
  'Basis Keto: < 50 g KH, Protein 140–185 g', 'Vor intensiver Einheit: 25–40 g KH', 'Liga-Spieltag: 50–100 g KH',
  'Turnier: Vortag 2–3 g/kg KH, am Tag 30–60 g/h', 'Elektrolyte', 'Gewicht immer als 7-Tage-Mittel bewerten',
  'Gewichtsziele: ≤ 112 kg (Mai 2027), 100–103 (Mitte 2028), 93–95, 88–90, ca. 85 kg'
];

export const DRILLS: Record<ErrCat, string> = {
  'Aufschlag': '15 min Aufschlagserien vor jeder Vereinseinheit, Muster A–C je 20× mit Zielzonen',
  'Rückschlag': 'Verein A: 30-min-Block Rückschlag kurz/lang gegen wechselnde Aufschläge, Fokus Schnitt lesen',
  'RH': 'RH-Stufenplan: Block gegen Topspin, Serien zählen (Ziel aktuelle Stufe)',
  'VH': 'VH-Topspin gegen Unterschnitt und Block, unregelmäßig in Verein B',
  'Stellung/Laufen': 'Schatten-Beinarbeit 15 min (Do) + Side-Shuffle-Serien, Falkenberg-Übung'
};
