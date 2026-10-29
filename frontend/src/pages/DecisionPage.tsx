import { useEffect, useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtTime, get, mw, type DecisionResponse } from '../api';
import { MetricCard } from '../components/MetricCard';

const gwh = (mwh: number) => `${(mwh / 1000).toFixed(1)} GWh`;

export function DecisionPage() {
  const [day, setDay] = useState('2026-01-15');
  const [cutoff, setCutoff] = useState('09:20');
  const [showActual, setShowActual] = useState(true);
  const [data, setData] = useState<DecisionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    get<DecisionResponse>('/decision', { delivery_date: day, cutoff }).then(setData).catch(e => { setData(null); setError(e.message); }).finally(() => setLoading(false));
  }, [day, cutoff]);

  const rows = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { t: string; forecast?: number; band?: [number, number]; actual?: number }>();
    data.forecast.forEach(point => map.set(point.start_time, { t: point.start_time, forecast: point.forecast, band: [Math.max(0, point.low ?? 0), point.high ?? 0] }));
    data.actual.forEach(point => map.set(point.start_time, { ...map.get(point.start_time), t: point.start_time, actual: point.actual }));
    return [...map.values()].sort((a, b) => a.t.localeCompare(b.t));
  }, [data]);

  const headingDate = new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const avgForecast = data ? data.summary.forecast_energy_mwh / 24 : null;

  return <section className="view">
    <div className="view-heading">
      <div><p className="eyebrow">DECISION REPLAY <span>/</span> {headingDate.toUpperCase()}</p><h1>Day-ahead position</h1><p className="subhead">The forecast available to the desk before the delivery day. Default cutoff assumes the EPEX GB hourly auction.</p></div>
      <div className="replay-stamp"><span className="stamp-dot" /> HISTORICAL REPLAY</div>
    </div>

    <div className="decision-toolbar">
      <label className="field-label">DELIVERY DAY<input type="date" min="2026-01-02" max="2026-02-01" value={day} onChange={event => setDay(event.target.value)} /></label>
      <label className="field-label">BID CUTOFF · UK TIME<input type="time" value={cutoff} onChange={event => setCutoff(event.target.value)} /></label>
      <label className="toggle-control"><input type="checkbox" checked={showActual} onChange={event => setShowActual(event.target.checked)} /><span className="toggle-ui" /><span>Show outturn</span></label>
      {data && <div className="issued-at"><span>FORECAST ISSUED</span><b>{fmtTime(data.forecast_publish_time)}</b></div>}
    </div>

    {loading && <p className="notice">Loading replay…</p>}
    {error && <p className="error">{error}</p>}

    {data && <>
      <div className="metric-grid decision-metrics">
        <MetricCard label="Day-ahead forecast" value={gwh(data.summary.forecast_energy_mwh)} hint={`${mw(avgForecast)} average across 24 delivery hours`} />
        <MetricCard label="Dependable wind · P90" value={gwh(data.summary.dependable_energy_mwh_p90)} hint="Conservative energy estimate from observed forecast errors" tone="emphasis" />
        <MetricCard label="Forecast bias" value={mw(data.summary.metrics_hindsight.bias)} hint="Positive means wind was over-forecast" />
        <MetricCard label="Hindsight MAE" value={mw(data.summary.metrics_hindsight.mae)} hint={`${data.summary.metrics_hindsight.n} hourly forecast points`} />
      </div>

      <article className="panel main-chart-panel">
        <div className="panel-heading"><div><p className="panel-kicker">DELIVERY PROFILE</p><h2>Wind generation</h2></div><div className="chart-unit">MW <span>·</span> hourly targets</div></div>
        <div className="chart-caption"><span>Forecast at {cutoff} cutoff, UK time</span><span className="caption-note">Shaded range shows empirical P10–P90 uncertainty</span></div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={rows} margin={{ top: 12, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="2 5" stroke="#dfe4df" />
            <XAxis dataKey="t" tickFormatter={value => fmtTime(value).slice(-5)} minTickGap={28} tickLine={false} axisLine={{ stroke: '#cbd3ce' }} />
            <YAxis unit=" MW" width={78} tickLine={false} axisLine={false} tickFormatter={value => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip labelFormatter={value => fmtTime(String(value))} formatter={(value, name) => [Array.isArray(value) ? `${mw(Number(value[0]))} – ${mw(Number(value[1]))}` : mw(Number(value)), name]} />
            <Legend verticalAlign="top" align="right" height={32} iconType="plainline" />
            <Area dataKey="band" name="P10–P90 range" fill="#aac5bb" stroke="none" fillOpacity={0.48} connectNulls />
            <Line dataKey="forecast" name="Forecast at cutoff" stroke="#254f44" dot={false} strokeWidth={2.5} connectNulls activeDot={{ r: 4 }} />
            {showActual && <Line dataKey="actual" name="Actual outturn" stroke="#d47b39" dot={false} strokeWidth={2} connectNulls activeDot={{ r: 4 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </article>

      <div className="decision-note"><span className="note-rule" /><p><b>Position note</b> At the {cutoff} cutoff, the forecast implies <strong>{gwh(data.summary.forecast_energy_mwh)}</strong> of wind for delivery. The P90 dependable estimate is <strong>{gwh(data.summary.dependable_energy_mwh_p90)}</strong>; the difference is the uncertainty to manage in procurement.</p></div>
    </>}
  </section>;
}
