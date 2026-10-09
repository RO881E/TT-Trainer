import { db } from './db';
import { buildBackup, markBackup, restoreBackup } from './backup';

const API = 'https://api.github.com';
const FILE = 'tt-trainer-backup.json';
const get = async (key: string) => (await db.settings.get(key))?.value as string | undefined;
const headers = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' });

export async function gistConfig() {
  return { token: await get('gistToken'), id: await get('gistId'), last: await get('gistLast') };
}
export const saveToken = (token: string) => db.settings.put({ key: 'gistToken', value: token.trim() });
export async function forgetGist() { await db.settings.bulkDelete(['gistToken', 'gistId', 'gistLast']); }

async function check(r: Response) {
  if (r.ok) return r;
  throw new Error(r.status === 401 ? 'Token ungültig oder abgelaufen.' : r.status === 404 ? 'Gist nicht gefunden (Token braucht das Recht „gist“).' : `GitHub-Fehler ${r.status}`);
}

/** Legt beim ersten Mal einen privaten Gist an, danach wird er aktualisiert. */
export async function gistPush(): Promise<void> {
  const { token, id } = await gistConfig();
  if (!token) throw new Error('Erst ein Token eintragen.');
  const files = { [FILE]: { content: await buildBackup() } };
  const r = await check(id
    ? await fetch(`${API}/gists/${id}`, { method: 'PATCH', headers: headers(token), body: JSON.stringify({ files }) })
    : await fetch(`${API}/gists`, { method: 'POST', headers: headers(token), body: JSON.stringify({ description: 'TT-Trainer Sicherung', public: false, files }) }));
  const j = await r.json();
  await db.settings.bulkPut([{ key: 'gistId', value: j.id }, { key: 'gistLast', value: new Date().toISOString() }]);
  await markBackup();
}

export async function gistPull(): Promise<void> {
  const { token, id } = await gistConfig();
  if (!token || !id) throw new Error('Noch keine Sicherung im Gist vorhanden.');
  const j = await (await check(await fetch(`${API}/gists/${id}`, { headers: headers(token) }))).json();
  const f = j.files?.[FILE];
  if (!f) throw new Error('Sicherungsdatei im Gist nicht gefunden.');
  const text = f.truncated ? await (await check(await fetch(f.raw_url, { headers: { Authorization: `Bearer ${token}` } }))).text() : f.content;
  await restoreBackup(text);
}

/** Beim App-Start still sichern, wenn die letzte Gist-Sicherung älter als 24 h ist. Fehler (z. B. offline) werden ignoriert. */
export async function autoGist() {
  const { token, last } = await gistConfig();
  if (!token || (last && Date.now() - Date.parse(last) < 864e5)) return;
  try { await gistPush(); } catch { /* offline oder Token ungültig: Hinweis erscheint unter Backup */ }
}
