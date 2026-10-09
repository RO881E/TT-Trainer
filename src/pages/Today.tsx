import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db';
import { MIX_LABELS, WEEK, rhythmFor, MESO } from '../plan';
import { currentPhase, currentTtr, recommendations, todayIso } from '../stats';
import { daysBetween, fmt, nextStichtag, prevStichtag } from '../ttr';
import { PLAYER } from '../plan';
import { Card, Tiles } from '../ui';
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
  const progress = Math.max(0, Math.min(100, ((ttr - PLAYER.startTtr) / (PLAYER.goalTtr - PLAYER.startTtr)) * 100));
  const wins = data.matches.filter(m => m.date >= prevStichtag(t));
  const w = wins.filter(m => m.won).length;
  return <>
    {persisted === false && <div className="warn">Speicher nicht dauerhaft geschützt: App installieren und unter „Backup“ erneut anfragen. Regelmäßig exportieren!</div>}
    {backupAge > 7 && <div className="warn">Letztes Backup: {data.last ? `vor ${backupAge} Tagen` : 'noch nie'}. <a href="#/backup">Jetzt sichern</a></div>}
    <section className="hero">
      <small>{ph.name}</small>
      <div className="hero-ttr"><b>{ttr}</b><span>Ziel {PLAYER.goalTtr}</span></div>
      <div className="progress" aria-label={`${Math.round(progress)} % des Weges`}><i style={{ width: `${progress}%` }} /></div>
      <p>{ph.steps}</p>
      <p className="muted">Nächster Q-TTR-Stichtag {fmt(st)} · in {daysBetween(t, st)} Tagen</p>
    </section>
    <Tiles items={[{ label: 'Einzel seit Stichtag', value: wins.length }, { label: 'Bilanz', value: wins.length ? `${w}:${wins.length - w}` : '–' }, { label: 'Tage bis Q-TTR', value: daysBetween(t, st) }]} />
    <Card title={`${day.day}: ${day.title}`}><ul className="check-list">{day.items.map(i => <li key={i}>{i}</li>)}</ul></Card>
    <Card title="Empfehlungen" aside={<a href="#/statistik">Alle</a>}>
      {recommendations(data).slice(0, 3).map(r => <div key={r.title} className="rec"><b>{r.title}</b><p>{r.text}</p></div>)}
      {!recommendations(data).length && <p className="muted">Noch keine Empfehlungen. Sie erscheinen, sobald genug Spiele erfasst sind.</p>}
    </Card>
    <Card title={`Saisonabschnitt: ${rh.name}`}>
      <div className="mix">{rh.mix.map((v, i) => <div key={i} style={{ flex: v }} title={`${MIX_LABELS[i]} ${v} %`}><span>{v}%</span><small>{MIX_LABELS[i]}</small></div>)}</div>
      <p className="muted">{MESO}</p>
    </Card>
  </>;
}
