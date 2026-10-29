export function MetricCard({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: string; tone?: 'default' | 'emphasis' }) {
  return <article className={`metric-card ${tone}`} title={hint}>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
    {hint && <div className="metric-hint">{hint}</div>}
  </article>;
}
