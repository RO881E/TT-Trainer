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

function useRoute() {
  const get = () => location.hash.slice(1) || '/';
  const [r, setR] = useState(get);
  useEffect(() => { const f = () => { setR(get()); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
}
const MORE = [['/training', 'Training & Timer'], ['/koerper', 'Knie & Gewicht'], ['/ttr', 'TTR & Meilensteine'], ['/checks', 'Monats-/Quartalscheck'], ['/plan', 'Trainingsplan'], ['/backup', 'Backup & Speicher']];

export default function App() {
  const r = useRoute();
  const opp = r.match(/^\/gegner\/(\d+)$/);
  const page = opp ? <OpponentDetail id={+opp[1]} />
    : r === '/spiel' ? <MatchForm /> : r === '/gegner' ? <OpponentList /> : r === '/statistik' ? <Stats />
    : r === '/training' ? <Training /> : r === '/koerper' ? <Body /> : r === '/ttr' ? <Ttr />
    : r === '/checks' ? <Checks /> : r === '/plan' ? <Plan /> : r === '/backup' ? <Backup />
    : r === '/mehr' ? <nav className="more">{MORE.map(([p, l]) => <a key={p} href={`#${p}`}>{l}</a>)}</nav>
    : <Today />;
  const tab = (p: string, l: string) => <a href={`#${p}`} className={r === p || (p !== '/' && r.startsWith(p)) ? 'on' : ''}>{l}</a>;
  return <>
    <main>{page}</main>
    <nav className="tabs">{tab('/', 'Heute')}{tab('/spiel', '+ Spiel')}{tab('/gegner', 'Gegner')}{tab('/statistik', 'Statistik')}{tab('/mehr', 'Mehr')}</nav>
  </>;
}
