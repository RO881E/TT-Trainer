import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import Today from './pages/Today';
import MatchForm from './pages/Match';
import { OpponentList, OpponentDetail } from './pages/Opponents';
import Stats from './pages/Stats';
import Training from './pages/Training';
import Body from './pages/Body';
import Ttr from './pages/Ttr';
import Checks from './pages/Checks';
import Plan from './pages/Plan';
import Backup from './pages/Backup';
import { db } from './db';
import { currentTtr } from './stats';
import { Icon, type IconName } from './ui';

function useRoute() {
  const get = () => location.hash.slice(1) || '/';
  const [r, setR] = useState(get);
  useEffect(() => { const f = () => { setR(get()); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
}

const MORE: { path: string; label: string; text: string; icon: IconName }[] = [
  { path: '/training', label: 'Training & Timer', text: 'Einheiten protokollieren, Intervall-Timer', icon: 'timer' },
  { path: '/koerper', label: 'Knie & Gewicht', text: 'SLDS, VISA-P und Gewichtsverlauf', icon: 'heart' },
  { path: '/ttr', label: 'TTR & Meilensteine', text: 'Verlauf, Ziele und TTR-Rechner', icon: 'target' },
  { path: '/checks', label: 'Monats- & Quartalscheck', text: 'Kennzahlen und Fortschritt prüfen', icon: 'check' },
  { path: '/plan', label: 'Trainingsplan', text: 'Phasen, Wochenstruktur, Übungen', icon: 'plan' },
  { path: '/backup', label: 'Backup & Speicher', text: 'Export, Import, dauerhafter Speicher', icon: 'save' }
];
const TITLES: Record<string, string> = { '/': 'Heute', '/spiel': 'Spiel erfassen', '/gegner': 'Gegner', '/statistik': 'Statistik', '/mehr': 'Mehr' };
for (const m of MORE) TITLES[m.path] = m.label;

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Heute', icon: 'home' }, { path: '/gegner', label: 'Gegner', icon: 'users' },
  { path: '/spiel', label: 'Spiel', icon: 'plus' }, { path: '/statistik', label: 'Statistik', icon: 'chart' }, { path: '/mehr', label: 'Mehr', icon: 'menu' }
];

export default function App() {
  const r = useRoute();
  const ttr = currentTtr(useLiveQuery(() => db.ttr.toArray(), []) ?? []);
  const opp = r.match(/^\/gegner\/(\d+)$/);
  const edit = r.match(/^\/spiel\/(\d+)$/);
  const preset = r.match(/^\/spiel\/gegner\/(\d+)$/);
  const page = opp ? <OpponentDetail id={+opp[1]} />
    : edit ? <MatchForm key={edit[1]} editId={+edit[1]} /> : preset ? <MatchForm key={`p${preset[1]}`} presetOpp={+preset[1]} />
    : r === '/spiel' ? <MatchForm /> : r === '/gegner' ? <OpponentList /> : r === '/statistik' ? <Stats />
    : r === '/training' ? <Training /> : r === '/koerper' ? <Body /> : r === '/ttr' ? <Ttr />
    : r === '/checks' ? <Checks /> : r === '/plan' ? <Plan /> : r === '/backup' ? <Backup />
    : r === '/mehr' ? <nav className="menu">{MORE.map(m => <a key={m.path} href={`#${m.path}`}>
        <span className="menu-icon"><Icon name={m.icon} /></span><span><b>{m.label}</b><small>{m.text}</small></span></a>)}</nav>
    : <Today />;
  const parent = opp ? '/gegner' : edit ? '/gegner' : MORE.some(m => m.path === r) ? '/mehr' : undefined;
  const title = opp ? 'Gegnerprofil' : edit ? 'Spiel bearbeiten' : preset ? 'Spiel erfassen' : TITLES[r] ?? 'TT-Trainer';
  const section = opp || edit ? '/gegner' : preset ? '/spiel' : parent ?? r;
  const active = (p: string) => p === section;
  return <>
    <header className="top">
      {parent ? <a className="back" href={`#${parent}`} aria-label="Zurück"><Icon name="back" /></a> : <span className="logo" aria-hidden="true" />}
      <h1>{title}</h1>
      <a className="ttr-pill" href="#/ttr">TTR {ttr}</a>
    </header>
    <main>{page}</main>
    <nav className="tabs">{TABS.map(t => <a key={t.path} href={`#${t.path}`} className={`${active(t.path) ? 'on' : ''} ${t.path === '/spiel' ? 'fab' : ''}`}>
      <Icon name={t.icon} size={t.path === '/spiel' ? 26 : 22} /><span>{t.label}</span></a>)}</nav>
  </>;
}
