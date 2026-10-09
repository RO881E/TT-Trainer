import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db, type SessionType } from '../db';
import { todayIso } from '../stats';
import { fmt } from '../ttr';
import { addDays, weekReport, weekTrend, type ReportDay } from '../week';
import { Card, Fold, Icon, Tiles, go } from '../ui';

const TYPES: SessionType[] = ['Verein A', 'Verein B', 'Heim-Kraft', 'Ausdauer', 'Heim 40', 'Turnier'];
const short = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

function QuickAdd({ day }: { day: ReportDay }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ type: (day.plan.type ?? 'Verein A') as SessionType, minutes: day.plan.minutes || 60, rpe: 6 });
  const add = (s = f) => db.sessions.add({ date: day.date, ...s });
  return <div className="quick">
    {day.plan.type && !day.sessions.length && <button className="primary inline" onClick={() => add({ type: day.plan.type!, minutes: day.plan.minutes, rpe: 6 })}>
      <Icon name="check" size={18} /> Wie geplant erledigt</button>}
    <button onClick={() => setOpen(!open)}>{open ? 'Abbrechen' : '+ Einheit'}</button>
    {open && <div className="quick-form">
      <div className="row"><label>Art<select value={f.type} onChange={e => setF({ ...f, type: e.target.value as SessionType })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        <label>Minuten<input type="number" inputMode="numeric" value={f.minutes} onChange={e => setF({ ...f, minutes: +e.target.value })} /></label>
        <label>RPE 1–10<input type="number" inputMode="numeric" min={1} max={10} value={f.rpe} onChange={e => setF({ ...f, rpe: +e.target.value })} /></label></div>
      <button className="primary" onClick={async () => { await add(); setOpen(false); }}>Einheit speichern</button></div>}
  </div>;
}

function DayCard({ day, opps }: { day: ReportDay; opps: Map<number, string> }) {
  const status = day.future || !day.soll ? '' : day.ist >= day.soll * 0.75 ? 'ok' : day.past ? 'miss' : '';
  return <section className={`day ${day.today ? 'today' : ''} ${status}`}>
    <header><div className="dow"><b>{day.dow}</b><small>{short(day.date)}</small></div>
      <div className="grow"><b>{day.plan.title}</b>
        <small>{day.soll ? `Soll ${day.soll} min` : 'frei'}{!day.future && day.ist > 0 && ` · Ist ${day.ist} min`}</small></div>
      {day.today && <span className="badge home">Heute</span>}
      {status === 'ok' && <span className="mark good"><Icon name="check" size={20} /></span>}
    </header>
    {day.fixtures.map(f => <p key={f.id} className="line"><Icon name="calendar" size={16} /> <b>{f.title}</b>{f.time && ` · ${f.time} Uhr`}{f.location && ` · ${f.location}`}</p>)}
    {day.sessions.map(s => <p key={s.id} className="line"><Icon name="timer" size={16} /> {s.type} · {s.minutes} min{s.rpe ? ` · RPE ${s.rpe}` : ''}{s.theme && ` · ${s.theme}`}
      <button className="icon-btn danger" aria-label="Einheit löschen" onClick={() => confirm('Einheit löschen?') && db.sessions.delete(s.id!)}><Icon name="x" size={16} /></button></p>)}
    {day.matches.map(m => <p key={m.id} className="line" onClick={() => go(`/gegner/${m.opponentId}`)}><Icon name="duel" size={16} />
      <b className={m.won ? 'good' : 'bad'}>{m.won ? 'Sieg' : 'Niederlage'}</b> gegen {opps.get(m.opponentId) ?? '?'} · {m.sets.map(([a, b]) => `${a}:${b}`).join(' ')}</p>)}
    {(day.knee || day.weight) && <p className="line muted"><Icon name="heart" size={16} /> {[day.knee && `Knie ${day.knee.slds}/10`, day.weight && `${day.weight.kg} kg`].filter(Boolean).join(' · ')}</p>}
    {!day.future && <QuickAdd day={day} />}
  </section>;
}

export default function Week({ anchor }: { anchor?: string }) {
  const today = todayIso();
  const d = useLiveQuery(async () => ({ sessions: await db.sessions.toArray(), fixtures: await db.fixtures.toArray(), matches: await db.matches.toArray(),
    knee: await db.knee.toArray(), weight: await db.weight.toArray(), opps: await db.opponents.toArray() }), []);
  if (!d) return null;
  const r = weekReport(anchor ?? today, today, d), prev = weekReport(addDays(r.monday, -7), today, d);
  const opps = new Map(d.opps.map(o => [o.id!, o.name]));
  const trend = weekTrend(r.monday, 8, d.sessions), top = Math.max(1, ...trend.map(t => t.minutes), r.soll);
  const delta = (a: number, b: number) => (b ? `${a >= b ? '+' : '−'}${Math.abs(Math.round((100 * (a - b)) / b))} % zur Vorwoche` : '');
  const current = r.monday <= today && today <= r.sunday;
  return <>
    <div className="weeknav">
      <button className="icon-btn" aria-label="Vorwoche" onClick={() => go(`/woche/${addDays(r.monday, -7)}`)}><Icon name="back" /></button>
      <div><b>KW {r.week}</b><small>{short(r.monday)} – {fmt(r.sunday).slice(0, 6)}{r.sunday.slice(0, 4)}</small></div>
      <button className="icon-btn next" aria-label="Folgewoche" onClick={() => go(`/woche/${addDays(r.monday, 7)}`)}><Icon name="back" /></button>
    </div>
    {!current && <button className="primary inline" style={{ marginBottom: 12 }} onClick={() => go('/woche')}>Zur aktuellen Woche</button>}
    {r.deload && <div className="warn">KW {r.week} wäre nach dem 3+1-Rhythmus eine Entlastungswoche: Umfang und Intensität etwa um ein Drittel senken, besonders bei Kniebeschwerden.</div>}
    <Tiles items={[{ label: `Minuten (Soll ${r.soll})`, value: r.ist, tone: r.ist >= r.soll * 0.75 ? 'good' : undefined }, { label: 'Belastung (min × RPE)', value: r.load }, { label: 'Spiele', value: r.wins + r.losses ? `${r.wins}:${r.losses}` : '–' }]} />
    {(prev.ist > 0 || prev.load > 0) && <p className="muted center">Belastung {delta(r.load, prev.load) || 'keine Vorwoche'} · {r.sessions} Einheiten</p>}
    {r.days.map(day => <DayCard key={day.date} day={day} opps={opps} />)}
    <Card title="Verteilung nach Bereich" aside={<small>{r.rhythm}</small>}>
      {r.ist === 0 ? <p className="muted">Noch keine Einheiten in dieser Woche.</p> : r.areas.map(a => <div key={a.label} className="area">
        <span>{a.label}</span><div className="track"><i style={{ width: `${a.pct}%` }} /><u style={{ left: `${a.goal}%` }} title={`Ziel ${a.goal} %`} /></div><b>{a.pct} %</b></div>)}
      <p className="muted">Der Strich zeigt den Zielanteil des Jahresrhythmus. Die Zuordnung der Einheiten zu den Bereichen ist eine Näherung.</p>
    </Card>
    <Fold title="Letzte 8 Wochen" hint="Trainingsminuten" open>
      <div className="trend">{trend.map(t => <div key={t.monday} className={t.monday === r.monday ? 'now' : ''} onClick={() => go(`/woche/${t.monday}`)}>
        <i style={{ height: `${Math.round((100 * t.minutes) / top)}%` }} /><b>{t.minutes || ''}</b><small>{t.week}</small></div>)}</div>
      <p className="muted">Balken = Minuten pro Kalenderwoche, Tippen öffnet die Woche.</p>
    </Fold>
  </>;
}
