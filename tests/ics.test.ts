import { describe, expect, it } from 'vitest';
import { parseIcs, teamsOf } from '../src/ics';

const ICS = [
  'BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'UID:a1@mytt', 'DTSTART;TZID=Europe/Berlin:20261016T193000', 'SUMMARY:TS Frechen - TTC Beispiel 2', 'LOCATION:Sporthalle\\, Frechen',
  'DESCRIPTION:1. Bezirksklasse\\nSpiel 7', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:a2@mytt', 'DTSTART:20261009', 'SUMMARY:SV Gast - TS Frechen', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:a3@mytt', 'DTSTART:20261023T140000Z', 'SUMMARY:Turnier mit sehr langem', ' Titel', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:kaputt', 'SUMMARY:ohne Datum', 'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');

describe('ICS-Import', () => {
  const fx = parseIcs(ICS, 'TS Frechen');
  it('liest nur gültige Termine und sortiert nach Datum', () => {
    expect(fx.map(f => f.uid)).toEqual(['a2@mytt', 'a1@mytt', 'a3@mytt']);
  });
  it('liest Datum, Zeit, Ort und Beschreibung mit Escapes', () => {
    const f = fx.find(x => x.uid === 'a1@mytt')!;
    expect(f).toMatchObject({ date: '2026-10-16', time: '19:30', title: 'TS Frechen - TTC Beispiel 2', location: 'Sporthalle, Frechen', home: true, opponentTeam: 'TTC Beispiel 2' });
    expect(f.description).toBe('1. Bezirksklasse\nSpiel 7');
  });
  it('ganztägige Termine haben keine Uhrzeit, Heim/Gast wird erkannt', () => {
    const f = fx.find(x => x.uid === 'a2@mytt')!;
    expect(f.time).toBeUndefined(); expect(f.home).toBe(false); expect(f.opponentTeam).toBe('SV Gast');
  });
  it('fügt umgebrochene Zeilen zusammen', () => {
    expect(fx.find(x => x.uid === 'a3@mytt')!.title).toBe('Turnier mit sehr langemTitel');
  });
  it('Titel ohne eigenen Verein ergeben keine Heim/Gast-Angabe', () => {
    expect(teamsOf('A - B', 'TS Frechen')).toEqual({});
    expect(teamsOf('Nur ein Name', 'TS Frechen')).toEqual({});
  });
  it('leere oder fremde Dateien ergeben keine Termine', () => {
    expect(parseIcs('', 'TS Frechen')).toEqual([]);
    expect(parseIcs('kein kalender', 'TS Frechen')).toEqual([]);
  });
});
