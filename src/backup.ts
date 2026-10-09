import { db } from './db';

/** Diese Einstellungen gehören zum Gerät und sind nie Teil einer Sicherung. */
const DEVICE_KEYS = ['gistToken'];

export async function ensurePersist(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
export async function storageInfo() {
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  const est = navigator.storage?.estimate ? await navigator.storage.estimate() : undefined;
  return { persisted, usage: est?.usage ?? 0, quota: est?.quota ?? 0 };
}

export async function buildBackup(): Promise<string> {
  const data: Record<string, unknown[]> = {};
  for (const t of db.tables) data[t.name] = await t.toArray();
  data.settings = (data.settings as { key: string }[]).filter(s => !DEVICE_KEYS.includes(s.key));
  return JSON.stringify({ app: 'tt-trainer', schema: 2, exportedAt: new Date().toISOString(), data });
}
export async function restoreBackup(json: string) {
  const j = JSON.parse(json);
  if (j.app !== 'tt-trainer' || !j.data) throw new Error('Keine TT-Trainer-Sicherung.');
  await db.transaction('rw', db.tables, async () => {
    const keep = (await db.settings.toArray()).filter(s => DEVICE_KEYS.includes(s.key));
    for (const t of db.tables) {
      await t.clear();
      const rows = j.data[t.name];
      if (Array.isArray(rows) && rows.length) await t.bulkAdd(rows);
    }
    if (keep.length) await db.settings.bulkPut(keep);
  });
}
export const markBackup = () => db.settings.put({ key: 'lastBackup', value: new Date().toISOString() });

/** Datei über das Teilen-Menü (Handy) oder als Download (Desktop) ausgeben. */
export async function shareFile(name: string, content: string, type: string): Promise<boolean> {
  const file = new File([content], name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; } catch { return false; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}
export async function exportJson(): Promise<boolean> {
  const ok = await shareFile(`tt-trainer-backup-${new Date().toLocaleDateString('sv-SE')}.json`, await buildBackup(), 'application/json');
  if (ok) await markBackup();
  return ok;
}
export const importJson = async (file: File) => restoreBackup(await file.text());
