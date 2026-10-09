import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db';
import { dayPlan, type DayItem } from '../day';
import { MIX_LABELS, MESO, PLAYER, rhythmFor } from '../plan';
import { currentPhase, currentTtr, daysAgo, recommendations, todayIso, weight7 } from '../stats';
import { daysBetween, fmt, nextStichtag, prevStichtag } from '../ttr';
import { Card, Tiles } from '../ui';
import { storageInfo } from '../backup';
import { focusFor, locate } from '../cycle';
import { STUFEN } from '../cyclePlan';
import { useCycle } from '../useCycle';
import { FixtureRow } from './Termine';

/** Abhakbare Liste, der Stand wird je Tag lokal gespeichert. */
function Checklist({ title, items, done, toggle }: { title: string; items: DayItem[]; done: string[]; toggle: (id: string) => void }) {
  const n = items.filter(i => done.includes(i.id)).length;
  return <div className="todo"><h3>{title}<span>{n}/{items.length}</span></h3>
    <ul className="check-list">{items.map(i => <li key={i.id} className={done.includes(i.id) ? 'done' : ''}>
      <label className="check"><input type="checkbox" checked={done.includes(i.id)} onChange={() => toggle(i.id)} />{i.text}</label></li>)}</ul></div>;
}

export default function Today() {
  const t = todayIso();
  const data = useLiveQuery(async () => ({
    matches: await db.matches.toArray(), opps: await db.opponents.toArray(), knee: await db.knee.toArray(),
    weight: await db.weight.toArray(), ttr: await db.ttr.toArray(), fixtures: await db.fixtures.orderBy('date').toArray(),
    last: (await db.settings.get('lastBackup'))?.value as string | undefined
  }), []);
  const { state: cycle } = useCycle();
  const done = (useLiveQuery(async () => (await db.settings.get(`done:${t}`))?.value as string[] | undefined, [t]) ?? []);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => { storageInfo().then(s => setPersisted(s.persisted)); }, []);
  useEffect(() => { // alte Tages-Häkchen nach zwei Wochen aufräumen
    void db.settings.where('key').between('done:', 'done:￿').filter(s => s.key < `done:${daysAgo(14)}`).primaryKeys().then(k => db.settings.bulkDelete(k));
  }, []);
  if (!data) return null;
  const toggle = (id: string) => db.settings.put({ key: `done:${t}`, value: done.includes(id) ? done.filter(x => x !== id) : [...done, id] });
  const pos = cycle ? locate(cycle, t) : undefined;
  const focus = pos && focusFor(pos);
  const plan = dayPlan(t, data.fixtures, focus);
  const rh = rhythmFor(t);
  const ttr = currentTtr(data.ttr);
  const ph = currentPhase(ttr);
  const st = nextStichtag(t);
  const backupAge = data.last ? daysBetween(data.last.slice(0, 10), t) : Infinity;
  const progress = Math.max(0, Math.min(100, ((ttr - PLAYER.startTtr) / (PLAYER.goalTtr - PLAYER.startTtr)) * 100));
  const sinceQ = data.matches.filter(m => m.date >= prevStichtag(t));
  const w = sinceQ.filter(m => m.won).length;
  const w7 = weight7(data.weight);
  const upcoming = data.fixtures.filter(f => f.date > t).slice(0, 3);
  const recs = recommendations(data);
  return <>
    {persisted === false && <div className="warn">Speicher nicht dauerhaft geschützt: App installieren und unter „Backup“ erneut anfragen. Regelmäßig sichern!</div>}
    {backupAge > 7 && <div className="warn">Letzte Sicherung: {data.last ? `vor ${backupAge} Tagen` : 'noch nie'}. <a href="#/backup">Jetzt sichern</a></div>}
    <section className="hero">
      <small>{ph.name}</small>
      <div className="hero-ttr"><b>{ttr}</b><span>Ziel {PLAYER.goalTtr}</span></div>
      <div className="progress" aria-label={`${Math.round(progress)} % des Weges`}><i style={{ width: `${progress}%` }} /></div>
      <p>{ph.steps}</p>
      <p className="muted">Nächster Q-TTR-Stichtag {fmt(st)} · in {daysBetween(t, st)} Tagen</p>
    </section>
    {focus && <a className="focus" href="#/zyklen"><small>Hauptthema · Woche {focus.week}/{focus.weeks} · {STUFEN[focus.stufe].label}</small><b>{focus.title}</b></a>}
    {pos && 'upcoming' in pos && <a className="focus" href="#/zyklen"><small>Trainingsplan startet in {pos.startsInDays} Tagen</small><b>{pos.upcoming.block.title}</b></a>}
    <Card title="Heute" aside={plan.kind === 'match' ? <span className="badge home">Spieltag</span> : undefined}>
      <Checklist title={plan.training.title} items={plan.training.items} done={done} toggle={toggle} />
      <Checklist title={plan.nutrition.title} items={plan.nutrition.items} done={done} toggle={toggle} />
      {w7 && <p className="muted">Gewicht 7-Tage-Mittel {w7} kg · Phasenziel {ph.weight} kg</p>}
      {plan.kind === 'match' ? <a href={`#/spiel/termin/${plan.fixtures[0].id}`}>Spiel erfassen →</a> : plan.kind === 'club' && <a href="#/training">Einheit protokollieren →</a>}
    </Card>
    <Tiles items={[{ label: 'Einzel seit Stichtag', value: sinceQ.length }, { label: 'Bilanz', value: sinceQ.length ? `${w}:${sinceQ.length - w}` : '–' }, { label: 'Tage bis Q-TTR', value: daysBetween(t, st) }]} />
    {upcoming.length > 0 && <Card title="Nächste Spiele" aside={<a href="#/termine">Alle</a>}><ul className="list">{upcoming.map(f => <FixtureRow key={f.id} f={f} />)}</ul></Card>}
    <Card title="Empfehlungen" aside={<a href="#/statistik">Alle</a>}>
      {recs.slice(0, 3).map(r => <div key={r.title} className="rec"><b>{r.title}</b><p>{r.text}</p></div>)}
      {!recs.length && <p className="muted">Noch keine Empfehlungen. Sie erscheinen, sobald genug Spiele erfasst sind.</p>}
    </Card>
    <Card title={`Saisonabschnitt: ${rh.name}`}>
      <div className="mix">{rh.mix.map((v, i) => <div key={i} style={{ flex: v }}><span>{v}%</span><small>{MIX_LABELS[i]}</small></div>)}</div>
      <p className="muted">{MESO}</p>
    </Card>
  </>;
}
