import { Dexie, type EntityTable } from 'dexie';

export type ErrCat = 'Aufschlag' | 'Rückschlag' | 'RH' | 'VH' | 'Stellung/Laufen';
export const ERR_CATS: ErrCat[] = ['Aufschlag', 'Rückschlag', 'RH', 'VH', 'Stellung/Laufen'];
export type Style = 'Angriff' | 'Allround' | 'Abwehr' | 'Blocker' | 'Konter/Schuss' | 'Material-Störer';
export const STYLES: Style[] = ['Angriff', 'Allround', 'Abwehr', 'Blocker', 'Konter/Schuss', 'Material-Störer'];
export type Material = 'Noppen innen' | 'Kurze Noppen' | 'Mittellange Noppen' | 'Lange Noppen' | 'Anti';
export const MATERIALS: Material[] = ['Noppen innen', 'Kurze Noppen', 'Mittellange Noppen', 'Lange Noppen', 'Anti'];
export type Pattern = 'A' | 'B' | 'C';
export type MatchKind = 'Punktspiel' | 'Turnier' | 'Pokal';
export type SessionType = 'Verein A' | 'Verein B' | 'Heim-Kraft' | 'Ausdauer' | 'Heim 40' | 'Turnier';

export interface Opponent {
  id?: number; name: string; club?: string; ttr?: number; style?: Style; hand?: 'rechts' | 'links';
  fhRubber?: Material; bhRubber?: Material; equipment?: string; serves?: string;
  strengths?: string; weaknesses?: string; tactics?: string; updatedAt: string;
}
export interface TTEvent { id?: number; date: string; kind: MatchKind; name?: string }
export interface Match {
  id?: number; date: string; opponentId: number; eventId?: number; kind: MatchKind;
  myTtr: number; oppTtr: number; sets: [number, number][]; won: boolean;
  errors: Partial<Record<ErrCat, number>>; mainError?: ErrCat;
  serve: Record<Pattern, { used: number; won: number }>; notes?: string;
}
export interface Session { id?: number; date: string; type: SessionType; minutes: number; rpe?: number; theme?: string; notes?: string }
export interface KneeLog { id?: number; date: string; slds: number; visaP?: number; stage: number; morningWorse?: boolean }
export interface WeightLog { id?: number; date: string; kg: number; waist?: number }
export interface TtrLog { id?: number; date: string; value: number; isQ: boolean }
export interface Check { id?: number; date: string; kind: 'Monat' | 'Quartal'; data: Record<string, string | number | boolean | undefined> }
export interface Setting { key: string; value: unknown }

export const db = new Dexie('tt-trainer') as Dexie & {
  opponents: EntityTable<Opponent, 'id'>; events: EntityTable<TTEvent, 'id'>; matches: EntityTable<Match, 'id'>;
  sessions: EntityTable<Session, 'id'>; knee: EntityTable<KneeLog, 'id'>; weight: EntityTable<WeightLog, 'id'>;
  ttr: EntityTable<TtrLog, 'id'>; checks: EntityTable<Check, 'id'>; settings: EntityTable<Setting, 'key'>;
};

db.version(1).stores({
  opponents: '++id, name, club, style',
  events: '++id, date, kind',
  matches: '++id, date, opponentId, eventId',
  sessions: '++id, date, type',
  knee: '++id, date',
  weight: '++id, date',
  ttr: '++id, date',
  checks: '++id, date, kind',
  settings: 'key'
});
// Spätere Schemaänderungen: db.version(2).stores({...}).upgrade(tx => ...) – nie Version 1 ändern.

export const emptyServe = (): Match['serve'] => ({ A: { used: 0, won: 0 }, B: { used: 0, won: 0 }, C: { used: 0, won: 0 } });
