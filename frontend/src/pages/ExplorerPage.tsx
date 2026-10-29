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
  return <section><p className="eyebrow">FORECAST EXPLORER</p><h2>Explore forecasts by lead time</h2><p className="muted">Compare actual output with the latest forecast issued at least the selected number of hours before delivery.</p>
    <RangeControls {...{ start, end, onStart: setStart, onEnd: setEnd, horizon, onHorizon: setHorizon }}/><p className="callout">Forecast issued ≥ <b>{horizon} h</b> before target</p>{loading && <p className="muted">Loading series…</p>}{error && <p className="error">{error}</p>}
    {data && <div className="chart-panel"><ResponsiveContainer width="100%" height={410}><LineChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#26354a"/><XAxis dataKey="t" tickFormatter={t => fmtTime(t).slice(0, 6)} minTickGap={48}/><YAxis unit=" MW" width={78}/><Tooltip labelFormatter={t => fmtTime(String(t))}/><Legend/><Line dataKey="actual" name="Actual" stroke="#40d8a0" dot={false} connectNulls/><Line dataKey="forecast" name="Forecast" stroke="#65a5ff" dot={false} connectNulls/></LineChart></ResponsiveContainer></div>}
  </section>;
}
