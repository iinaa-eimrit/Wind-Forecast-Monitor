import { useEffect, useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get, fmtTime, mw, type DecisionResponse } from '../api';
import { MetricCard } from '../components/MetricCard';

export function DecisionPage() {
  const [day, setDay] = useState('2026-01-15'); const [cutoff, setCutoff] = useState('09:00'); const [showActual, setShowActual] = useState(true);
  const [data, setData] = useState<DecisionResponse | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); setError(null); get<DecisionResponse>('/decision', { delivery_date: day, cutoff }).then(setData).catch(e => { setData(null); setError(e.message); }).finally(() => setLoading(false)); }, [day, cutoff]);
  const rows = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { t: string; forecast?: number; band?: [number, number]; actual?: number }>();
    data.forecast.forEach(f => map.set(f.start_time, { t: f.start_time, forecast: f.forecast, band: [Math.max(0, f.low ?? 0), f.high ?? 0] }));
    data.actual.forEach(a => map.set(a.start_time, { ...map.get(a.start_time), t: a.start_time, actual: a.actual }));
    return [...map.values()].sort((a, b) => a.t.localeCompare(b.t));
  }, [data]);
  return <section><div className="section-title"><div><p className="eyebrow">TRADING DESK</p><h2>Day-ahead decision</h2><p className="muted">The latest forecast available before your bid cutoff, with an empirical uncertainty range.</p></div></div>
    <div className="controls"><label>Delivery day <input type="date" min="2026-01-02" max="2026-02-01" value={day} onChange={e => setDay(e.target.value)} /></label><label>Bid cutoff (UK time) <input type="time" value={cutoff} onChange={e => setCutoff(e.target.value)} /></label><label className="check"><input type="checkbox" checked={showActual} onChange={e => setShowActual(e.target.checked)} /> Show actual hindsight</label></div>
    {loading && <p className="muted">Loading decision view…</p>}{error && <p className="error">{error}</p>}
    {data && <><p className="muted">Forecast published <b>{fmtTime(data.forecast_publish_time)}</b> · cutoff {fmtTime(data.cutoff_utc)}</p><div className="cards"><MetricCard label="Forecast energy" value={`${Math.round(data.summary.forecast_energy_mwh).toLocaleString()} MWh`} /><MetricCard label="Dependable wind (P90)" value={`${Math.round(data.summary.dependable_energy_mwh_p90).toLocaleString()} MWh`} hint="Energy available with 90% confidence based on historical forecast errors." />{showActual && <MetricCard label="Hindsight MAE" value={mw(data.summary.metrics_hindsight.mae)} />}</div>
      <div className="chart-panel"><ResponsiveContainer width="100%" height={380}><ComposedChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#26354a"/><XAxis dataKey="t" tickFormatter={t => fmtTime(t).slice(-5)} minTickGap={30}/><YAxis unit=" MW" width={78}/><Tooltip labelFormatter={t => fmtTime(String(t))}/><Legend/><Area dataKey="band" name="P10–P90 range" fill="#5c9eff" stroke="none" fillOpacity={0.22} connectNulls/><Line dataKey="forecast" name="Forecast at cutoff" stroke="#65a5ff" dot={false} strokeWidth={2} connectNulls/><Line dataKey={showActual ? 'actual' : 'hidden'} name="Actual" stroke="#40d8a0" dot={false} strokeWidth={2} connectNulls/></ComposedChart></ResponsiveContainer></div></>}
  </section>;
}
