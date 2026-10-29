export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="card" title={hint}><div className="label">{label}</div><div className="value">{value}</div>{hint && <div className="hint">{hint}</div>}</div>;
}
