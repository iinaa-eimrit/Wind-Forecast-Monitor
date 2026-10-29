export function RangeControls({ start, end, onStart, onEnd, horizon, onHorizon }: { start: string; end: string; onStart: (value: string) => void; onEnd: (value: string) => void; horizon: number; onHorizon: (value: number) => void }) {
  return <div className="range-toolbar">
    <label className="field-label">FROM<input type="date" min="2026-01-02" max="2026-02-01" value={start} onChange={event => onStart(event.target.value)} /></label>
    <span className="range-arrow" aria-hidden="true">→</span>
    <label className="field-label">TO<input type="date" min="2026-01-02" max="2026-02-01" value={end} onChange={event => onEnd(event.target.value)} /></label>
    <div className="horizon-control"><div><span className="field-label">MINIMUM FORECAST LEAD</span><b>{horizon}<small> h</small></b></div><input aria-label="Minimum forecast horizon in hours" type="range" min="0" max="48" step="1" value={horizon} onChange={event => onHorizon(Number(event.target.value))} /></div>
  </div>;
}
