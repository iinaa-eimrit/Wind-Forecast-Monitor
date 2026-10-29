import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get, fmtTime, type SeriesResponse } from '../api';
import { RangeControls } from '../components/Controls';

export function ExplorerPage() {
  const [start, setStart] = useState('2026-01-02'); const [end, setEnd] = useState('2026-02-01'); const [horizon, setHorizon] = useState(24);
  const [data, setData] = useState<SeriesResponse | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); setError(null); get<SeriesResponse>('/series', { start, end, horizon_h: horizon }).then(setData).catch(e => { setData(null); setError(e.message); }).finally(() => setLoading(false)); }, [start, end, horizon]);
  const points = new Map<string, { t: string; actual?: number; forecast?: number }>();
  data?.actual.forEach(p => points.set(p.start_time, { t: p.start_time, actual: p.actual }));
  data?.forecast.forEach(p => points.set(p.start_time, { ...points.get(p.start_time), t: p.start_time, forecast: p.forecast }));
  const rows = [...points.values()].sort((a, b) => a.t.localeCompare(b.t));
  return <section className="view"><div className="view-heading"><div><p className="eyebrow">TIME SERIES <span>/</span> HISTORICAL WIND</p><h1>Forecast explorer</h1><p className="subhead">Compare the issued forecast with outturn at a chosen minimum lead time.</p></div><div className="replay-stamp"><span className="stamp-dot" /> BMRS SNAPSHOT</div></div>
    <RangeControls {...{ start, end, onStart: setStart, onEnd: setEnd, horizon, onHorizon: setHorizon }}/><p className="filter-summary">Showing forecasts issued <b>at least {horizon} hours</b> before each target time.</p>{loading && <p className="notice">Loading series…</p>}{error && <p className="error">{error}</p>}
    {data && <article className="panel main-chart-panel"><div className="panel-heading"><div><p className="panel-kicker">ACTUAL VS FORECAST</p><h2>National wind output</h2></div><div className="chart-unit">MW <span>·</span> hourly targets</div></div><ResponsiveContainer width="100%" height={410}><LineChart data={rows} margin={{ top: 12, right: 16, bottom: 0, left: 8 }}><CartesianGrid vertical={false} strokeDasharray="2 5" stroke="#dfe4df"/><XAxis dataKey="t" tickFormatter={t => fmtTime(t).slice(0, 6)} minTickGap={48} tickLine={false} axisLine={{ stroke: '#cbd3ce' }}/><YAxis unit=" MW" width={78} tickLine={false} axisLine={false} tickFormatter={value => `${Math.round(Number(value) / 1000)}k`}/><Tooltip labelFormatter={t => fmtTime(String(t))}/><Legend verticalAlign="top" align="right" height={32} iconType="plainline"/><Line dataKey="actual" name="Actual outturn" stroke="#d47b39" dot={false} strokeWidth={2} connectNulls/><Line dataKey="forecast" name="Forecast" stroke="#254f44" dot={false} strokeWidth={2} connectNulls/></LineChart></ResponsiveContainer></article>}
  </section>;
}
