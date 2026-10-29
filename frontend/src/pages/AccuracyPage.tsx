import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get, mw, type AccuracyResponse } from '../api';
import { MetricCard } from '../components/MetricCard';
import { RangeControls } from '../components/Controls';

export function AccuracyPage() {
  const [start, setStart] = useState('2026-01-02'); const [end, setEnd] = useState('2026-02-01'); const [horizon, setHorizon] = useState(24);
  const [data, setData] = useState<AccuracyResponse | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); setError(null); get<AccuracyResponse>('/accuracy', { start, end, horizon_h: horizon }).then(setData).catch(e => { setData(null); setError(e.message); }).finally(() => setLoading(false)); }, [start, end, horizon]);
  const m = data?.metrics; const biasLabel = (m?.bias ?? 0) > 0 ? 'over-forecast' : 'under-forecast';
  return <section><p className="eyebrow">FORECAST PERFORMANCE</p><h2>Accuracy dashboard</h2><p className="muted">Error is forecast minus actual. Positive bias means forecasts tend to be high, which risks under-buying.</p>
    <RangeControls {...{ start, end, onStart: setStart, onEnd: setEnd, horizon, onHorizon: setHorizon }}/>{loading && <p className="muted">Calculating accuracy…</p>}{error && <p className="error">{error}</p>}
    {data && m && <><div className="cards"><MetricCard label="MAE" value={mw(m.mae)}/><MetricCard label="RMSE" value={mw(m.rmse)}/><MetricCard label={`Bias · ${biasLabel}`} value={mw(m.bias)}/><MetricCard label="WAPE" value={m.wape_pct == null ? '—' : `${m.wape_pct.toFixed(1)}%`}/><MetricCard label="P90 absolute error" value={mw(m.p90_abs)}/><MetricCard label="Correlation" value={m.corr?.toFixed(3) ?? '—'}/><MetricCard label="Hourly points" value={m.n.toLocaleString()}/></div>
      <p className="callout">At a <b>{horizon}h</b> horizon, 90% of hourly errors were below <b>{mw(m.p90_abs)}</b>.</p>
      <div className="chart-grid"><article className="chart-panel"><h3>Error vs forecast horizon</h3><ResponsiveContainer width="100%" height={300}><LineChart data={data.by_horizon}><CartesianGrid strokeDasharray="3 3" stroke="#26354a"/><XAxis dataKey="horizon_h" unit=" h"/><YAxis unit=" MW"/><Tooltip/><ReferenceArea x1={15} x2={39} fill="#f7b955" fillOpacity={0.10}/><Line dataKey="mae" name="MAE" stroke="#65a5ff" dot={false}/><Line dataKey="rmse" name="RMSE" stroke="#fa9870" dot={false}/></LineChart></ResponsiveContainer></article>
      <article className="chart-panel"><h3>Error by hour of day</h3><ResponsiveContainer width="100%" height={300}><BarChart data={data.by_hour}><CartesianGrid strokeDasharray="3 3" stroke="#26354a"/><XAxis dataKey="hour" unit=":00"/><YAxis unit=" MW"/><Tooltip/><Bar dataKey="mae" name="MAE" fill="#65a5ff" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></article>
      <article className="chart-panel full"><h3>Error distribution · forecast − actual (MW)</h3><ResponsiveContainer width="100%" height={270}><BarChart data={data.histogram}><CartesianGrid strokeDasharray="3 3" stroke="#26354a"/><XAxis dataKey="from" tickFormatter={v => Math.round(Number(v)).toLocaleString()} minTickGap={28}/><YAxis/><Tooltip labelFormatter={v => `${Math.round(Number(v)).toLocaleString()} MW`}/><Bar dataKey="count" name="Hours" fill="#40d8a0">{data.histogram.map((entry, index) => <Cell key={`${entry.from}-${index}`} fill={entry.from > 0 ? '#fa9870' : '#40d8a0'}/>)}</Bar></BarChart></ResponsiveContainer></article></div></>}
  </section>;
}
