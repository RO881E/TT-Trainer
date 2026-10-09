import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db';
import { MIX_LABELS, WEEK, rhythmFor, MESO } from '../plan';
import { currentPhase, currentTtr, recommendations, todayIso } from '../stats';
import { daysBetween, fmt, nextStichtag } from '../ttr';
import { Card } from '../ui';
import { storageInfo } from '../backup';

export default function Today() {
  const t = todayIso();
  const data = useLiveQuery(async () => ({
    matches: await db.matches.toArray(), opps: await db.opponents.toArray(), knee: await db.knee.toArray(),
    weight: await db.weight.toArray(), ttr: await db.ttr.toArray(), last: (await db.settings.get('lastBackup'))?.value as string | undefined
  }), []);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => { storageInfo().then(s => setPersisted(s.persisted)); }, []);
  if (!data) return null;
  const day = WEEK[(new Date().getDay() + 6) % 7];
  const rh = rhythmFor(t);
  const ttr = currentTtr(data.ttr);
  const ph = currentPhase(ttr);
  const st = nextStichtag(t);
  const backupAge = data.last ? daysBetween(data.last.slice(0, 10), t) : Infinity;
  return <>
    {persisted === false && <div className="warn">Speicher nicht dauerhaft geschützt: App installieren und unter „Backup“ erneut anfragen. Regelmäßig exportieren!</div>}
    {backupAge > 7 && <div className="warn">Letztes Backup: {data.last ? `vor ${backupAge} Tagen` : 'noch nie'}. <a href="#/backup">Jetzt sichern</a></div>}
    <Card title={`${day.day}: ${day.title}`}><ul>{day.items.map(i => <li key={i}>{i}</li>)}</ul></Card>
    <Card title={`TTR ${ttr} · ${ph.name}`}>
      <p>{ph.steps} – {ph.focus}</p>
      <p>Nächster Q-TTR-Stichtag: <b>{fmt(st)}</b> (in {daysBetween(t, st)} Tagen; Spiele bis zum 10. zählen)</p>
    </Card>
    <Card title={`Saisonabschnitt: ${rh.name}`}>
      <p>{rh.mix.map((v, i) => `${MIX_LABELS[i]} ${v} %`).join(' · ')}</p><p className="muted">{MESO}</p>
    </Card>
    <Card title="Empfehlungen">
      {recommendations(data).slice(0, 3).map(r => <div key={r.title} className="rec"><b>{r.title}</b><p>{r.text}</p></div>)}
      <a href="#/statistik">Alle Statistiken →</a>
    </Card>
  </>;
}
