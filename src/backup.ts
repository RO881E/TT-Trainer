import { db } from './db';

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
export async function exportJson(): Promise<boolean> {
  const data: Record<string, unknown[]> = {};
  for (const t of db.tables) data[t.name] = await t.toArray();
  const json = JSON.stringify({ app: 'tt-trainer', schema: 1, exportedAt: new Date().toISOString(), data });
  const name = `tt-trainer-backup-${new Date().toLocaleDateString('sv-SE')}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); } catch { return false; }
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  await db.settings.put({ key: 'lastBackup', value: new Date().toISOString() });
  return true;
}
export async function importJson(file: File) {
  const j = JSON.parse(await file.text());
  if (j.app !== 'tt-trainer' || !j.data) throw new Error('Keine TT-Trainer-Sicherung.');
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) {
      await t.clear();
      const rows = j.data[t.name];
      if (Array.isArray(rows) && rows.length) await t.bulkAdd(rows);
    }
  });
}
