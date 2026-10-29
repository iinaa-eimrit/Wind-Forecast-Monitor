export async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '') as [string, string][]);
  const response = await fetch(`/api${path}?${query}`);
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail ?? `HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
export interface Metrics { n: number; mae: number | null; rmse: number | null; bias: number | null; wape_pct: number | null; p50_abs: number | null; p90_abs: number | null; p99_abs: number | null; err_p10: number | null; err_p90: number | null; corr: number | null; mean_actual: number | null }
export interface Point { start_time: string; actual?: number; forecast?: number; publish_time?: string; lead_h?: number; low?: number; high?: number }
export interface DecisionResponse { cutoff_utc: string; forecast_publish_time: string; forecast: Point[]; actual: Point[]; summary: { forecast_energy_mwh: number; dependable_energy_mwh_p90: number; metrics_hindsight: Metrics } }
export interface SeriesResponse { actual: Point[]; forecast: Point[] }
export interface AccuracyResponse { horizon_h: number; metrics: Metrics; by_horizon: ({ horizon_h: number } & Metrics)[]; by_hour: { hour: number; mae: number; bias: number; n: number }[]; histogram: { from: number; to: number; count: number }[] }
export const fmtTime = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const mw = (value: number | null | undefined) => value == null ? '—' : `${Math.round(value).toLocaleString('en-GB')} MW`;
