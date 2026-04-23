import { useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';

function FitToRoute({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, {
        padding: [48, 48],
      });
    }
  }, [map, positions]);

  return null;
}

function RouteLayer({ route }) {
  if (!route || route.length < 2) {
    return null;
  }

  const positions = route.map((point) => [point.lat, point.lng]);

  return (
    <>
      <Polyline positions={positions} pathOptions={{ color: '#0f766e', weight: 6, opacity: 0.85 }} />
      <FitToRoute positions={positions} />
    </>
  );
}

export default RouteLayer;
