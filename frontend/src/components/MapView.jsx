import { icon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import RouteLayer from './RouteLayer';

const WARSAW_CENTER = [52.2297, 21.0122];
const DEFAULT_ZOOM = 13;

const startIcon = icon({
  iconUrl: '/pin_start.png',
  iconSize: [52, 52],
  iconAnchor: [26, 52],
  popupAnchor: [0, -52],
});

const endIcon = icon({
  iconUrl: '/pin_end.png',
  iconSize: [52, 52],
  iconAnchor: [26, 52],
  popupAnchor: [0, -52],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng);
    },
  });

  return null;
}

function MapView({ startPoint, endPoint, route, onMapClick }) {
  return (
    <div className="map-container">
      <MapContainer
        center={WARSAW_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onMapClick={onMapClick} />
        <RouteLayer route={route} />

        {startPoint ? (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
            <Popup>Start point</Popup>
          </Marker>
        ) : null}

        {endPoint ? (
          <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
            <Popup>End point</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}

export default MapView;
