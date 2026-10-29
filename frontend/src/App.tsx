import { useState } from 'react';
import { DecisionPage } from './pages/DecisionPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { AccuracyPage } from './pages/AccuracyPage';

type Tab = 'Decision' | 'Explorer' | 'Accuracy';
const tabs: Tab[] = ['Decision', 'Explorer', 'Accuracy'];
export default function App() {
  const [tab, setTab] = useState<Tab>('Decision');
  return <div className="app-shell"><header className="topbar"><a className="brand" href="#"><span className="brand-mark">W</span><span>WindSight</span></a><span className="pilot-tag">JAN 2026 PILOT</span></header><main><div className="hero"><div><p className="eyebrow">GB WIND FORECAST MONITOR</p><h1>Make tomorrow’s wind forecast actionable.</h1><p className="muted">A decision view and a measured risk buffer for day-ahead power procurement.</p></div><div className="hero-stat"><span>DATA WINDOW</span><b>02 Jan — 01 Feb 2026</b><small>Elexon BMRS · National wind</small></div></div><nav className="tabs" aria-label="Pages">{tabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav><div className="content">{tab === 'Decision' ? <DecisionPage/> : tab === 'Explorer' ? <ExplorerPage/> : <AccuracyPage/>}</div></main><footer>WindSight <span>·</span> Historical pilot data from Elexon BMRS</footer></div>;
}
