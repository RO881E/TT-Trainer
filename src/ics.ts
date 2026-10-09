import type { Fixture } from './db';

type Prop = { name: string; params: Record<string, string>; value: string };

const unescapeText = (s: string) => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
const pad = (n: number) => String(n).padStart(2, '0');

function unfold(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}
function parseProp(line: string): Prop | undefined {
  const i = line.indexOf(':');
  if (i < 0) return undefined;
  const [name, ...rest] = line.slice(0, i).split(';');
  const params: Record<string, string> = {};
  for (const r of rest) { const [k, v] = r.split('='); if (k && v) params[k.toUpperCase()] = v; }
  return { name: name.toUpperCase(), params, value: line.slice(i + 1) };
}

/** Datum/Uhrzeit aus DTSTART. UTC-Zeiten (…Z) werden in lokale Zeit umgerechnet, alles andere wörtlich übernommen. */
export function parseIcsDate(p: Prop): { date: string; time?: string } | undefined {
  const m = p.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return undefined;
  const [, y, mo, d, hh, mi, , z] = m;
  if (hh === undefined) return { date: `${y}-${mo}-${d}` };
  if (z) {
    const dt = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mi));
    return { date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`, time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}` };
  }
  return { date: `${y}-${mo}-${d}`, time: `${hh}:${mi}` };
}

/** Heim/Gast und Gegner-Mannschaft aus Titeln wie „TS Frechen - TTC Beispiel“ ableiten. */
export function teamsOf(title: string, club: string): { home?: boolean; opponentTeam?: string } {
  const parts = title.split(/\s+[-–—:]\s+|\s+vs\.?\s+/i).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return {};
  const key = club.toLowerCase();
  const ours = parts.findIndex(p => p.toLowerCase().includes(key));
  if (ours < 0) return {};
  const other = parts.find((_, i) => i !== ours);
  return { home: ours === 0, opponentTeam: other };
}

export function parseIcs(text: string, club: string): Fixture[] {
  const out: Fixture[] = [];
  let cur: Prop[] | undefined;
  for (const line of unfold(text)) {
    if (line.startsWith('BEGIN:VEVENT')) cur = [];
    else if (line.startsWith('END:VEVENT')) {
      if (cur) {
        const get = (n: string) => cur!.find(p => p.name === n);
        const start = get('DTSTART') && parseIcsDate(get('DTSTART')!);
        const title = get('SUMMARY') && unescapeText(get('SUMMARY')!.value).trim();
        if (start && title) {
          const uid = get('UID')?.value ?? `${start.date}-${title}`;
          out.push({ uid, date: start.date, time: start.time, title, location: get('LOCATION') && unescapeText(get('LOCATION')!.value).trim() || undefined,
            description: get('DESCRIPTION') && unescapeText(get('DESCRIPTION')!.value).trim() || undefined, ...teamsOf(title, club) });
        }
      }
      cur = undefined;
    } else if (cur) { const p = parseProp(line); if (p) cur.push(p); }
  }
  return out.sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`));
}
