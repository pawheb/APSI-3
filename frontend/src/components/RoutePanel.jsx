function formatPoint(point) {
  if (!point) {
    return 'Not selected';
  }

  return `${point.lat}, ${point.lng}`;
}

function RoutePanel({
  startPoint,
  endPoint,
  isLoading,
  error,
  greeneryPreference,
  lightAvoidance,
  onGreeneryPreferenceChange,
  onLightAvoidanceChange,
  onReset,
  onCalculateRoute,
}) {
  const canCalculate = Boolean(startPoint && endPoint && !isLoading);

  return (
    <section className="panel">
      <div className="panel__block">
        <h2>How it works</h2>
        <ol className="steps">
          <li>Click once on the map to choose the start point.</li>
          <li>Click again to choose the destination.</li>
          <li>Adjust your route preferences and calculate the route.</li>
        </ol>
      </div>

      <div className="panel__block">
        <h2>Selected points</h2>
        <dl className="point-list">
          <div className="point-card point-card--start">
            <dt>Start</dt>
            <dd>{formatPoint(startPoint)}</dd>
          </div>
          <div className="point-card point-card--end">
            <dt>End</dt>
            <dd>{formatPoint(endPoint)}</dd>
          </div>
        </dl>
      </div>

      <div className="panel__block">
        <h2>Route preferences</h2>
        <div className="slider-group">
          <label className="slider-field" htmlFor="greeneryPreference">
            <span className="slider-field__top">
              <span>Prefer greener areas</span>
              <strong>{greeneryPreference}%</strong>
            </span>
            <input
              id="greeneryPreference"
              type="range"
              min="0"
              max="100"
              step="10"
              value={greeneryPreference}
              onChange={(event) => onGreeneryPreferenceChange(Number(event.target.value))}
            />
          </label>

          <label className="slider-field" htmlFor="lightAvoidance">
            <span className="slider-field__top">
              <span>Avoid bright areas</span>
              <strong>{lightAvoidance}%</strong>
            </span>
            <input
              id="lightAvoidance"
              type="range"
              min="0"
              max="100"
              step="10"
              value={lightAvoidance}
              onChange={(event) => onLightAvoidanceChange(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="panel__actions">
        <button type="button" className="button button--ghost" onClick={onReset}>
          Reset
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onCalculateRoute}
          disabled={!canCalculate}
        >
          {isLoading ? 'Calculating...' : 'Calculate route'}
        </button>
      </div>

      {error ? <p className="status status--error">{error}</p> : null}
    </section>
  );
}

export default RoutePanel;
