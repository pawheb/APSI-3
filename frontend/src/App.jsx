import { startTransition, useState } from 'react';
import MapView from './components/MapView';
import RoutePanel from './components/RoutePanel';

function App() {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [greeneryPreference, setGreeneryPreference] = useState(70);
  const [lightAvoidance, setLightAvoidance] = useState(55);

  function handleMapClick(latlng) {
    const nextPoint = {
      lat: Number(latlng.lat.toFixed(6)),
      lng: Number(latlng.lng.toFixed(6)),
    };

    setError(null);

    if (!startPoint) {
      setStartPoint(nextPoint);
      setRoute(null);
      return;
    }

    if (!endPoint) {
      setEndPoint(nextPoint);
      setRoute(null);
      return;
    }

    setError('Two points are already selected. Reset the selection to choose new ones.');
  }

  function resetSelection() {
    setStartPoint(null);
    setEndPoint(null);
    setRoute(null);
    setError(null);
    setIsLoading(false);
  }

  async function calculateRoute() {
    if (!startPoint || !endPoint) {
      setError('Select both a start point and an end point first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestPayload = {
        start: startPoint,
        end: endPoint,
        weights: {
          greenery: greeneryPreference / 100,
          light: lightAvoidance / 100,
          noise: 0.4,
        },
      };

      await new Promise((resolve) => window.setTimeout(resolve, 350));

      // Replace the mock route with a real backend request later.
      void requestPayload;
      startTransition(() => {
        setRoute([startPoint, endPoint]);
      });
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : 'Unable to calculate the route.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <h1>Warsaw Walking Route Planner</h1>
          <p className="lead">
            Choose your start and destination, then tailor the route toward greener streets and
            lower light exposure across Warsaw.
          </p>
        </div>

        <RoutePanel
          startPoint={startPoint}
          endPoint={endPoint}
          isLoading={isLoading}
          error={error}
          greeneryPreference={greeneryPreference}
          lightAvoidance={lightAvoidance}
          onGreeneryPreferenceChange={setGreeneryPreference}
          onLightAvoidanceChange={setLightAvoidance}
          onReset={resetSelection}
          onCalculateRoute={calculateRoute}
        />
      </aside>

      <main className="map-stage">
        <MapView
          startPoint={startPoint}
          endPoint={endPoint}
          route={route}
          onMapClick={handleMapClick}
        />
      </main>
    </div>
  );
}

export default App;
