import { useState } from 'react';
import { AccuracyPage } from './pages/AccuracyPage';
import { DecisionPage } from './pages/DecisionPage';
import { ExplorerPage } from './pages/ExplorerPage';

type View = 'Decision' | 'Explorer' | 'Accuracy';

const navigation: { name: View; index: string; description: string }[] = [
  { name: 'Decision', index: '01', description: 'Bid cutoff replay' },
  { name: 'Explorer', index: '02', description: 'Forecast history' },
  { name: 'Accuracy', index: '03', description: 'Error analysis' },
];

export default function App() {
  const [view, setView] = useState<View>('Decision');

  return (
    <div className="product-layout">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="WindSight home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-name">WindSight<span>GB POWER DESK</span></span>
        </a>

        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Workspace">
          {navigation.map(item => (
            <button key={item.name} className={`nav-item ${view === item.name ? 'active' : ''}`} onClick={() => setView(item.name)}>
              <span className="nav-index">{item.index}</span>
              <span className="nav-copy"><b>{item.name}</b><small>{item.description}</small></span>
              {view === item.name && <span className="nav-marker" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-label">DATA SOURCE</div>
          <div className="source-lockup"><span className="source-dot" /><span><b>Elexon Insights</b><small>National wind · BMRS</small></span></div>
          <div className="sidebar-period">HISTORICAL REPLAY <b>JAN 2026</b></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="utility-bar">
          <div className="breadcrumb"><span>GB</span><i>/</i><span>WIND POWER</span><i>/</i><b>MARKET MONITOR</b></div>
          <div className="snapshot-status"><span className="status-dot" /> SNAPSHOT LOADED <span className="status-sep">·</span> 31 DAYS</div>
        </header>
        <main className="workspace-main">
          <div className="pilot-ribbon"><span>RESEARCH PILOT</span><span>02 JAN — 01 FEB 2026</span></div>
          <div className="content">{view === 'Decision' ? <DecisionPage /> : view === 'Explorer' ? <ExplorerPage /> : <AccuracyPage />}</div>
          <footer className="page-footer"><span>WindSight <i>·</i> GB day-ahead wind</span><span>Source: Elexon BMRS <i>·</i> UTC data, UK display time</span></footer>
        </main>
      </div>
    </div>
  );
}
