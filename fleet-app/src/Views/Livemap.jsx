import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MARKER_COLOR = '#00ff88';

function Livemap({ fleet = [], active = false, selectedVehicle = null, onSelectVehicle = () => {} }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);          // markers indexed to match the fleet array
  const markersAdded = useRef(false);

  // Initialise map only when tab becomes active AND container is ready
  useEffect(() => {
    if (!active) return;               // don't init while hidden
    if (map.current) {                 // already initialised — just resize
      map.current.resize();
      return;
    }
    if (!mapContainer.current) return; // container not mounted yet

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [29.9319, -27.7567],     // Newcastle, KwaZulu-Natal
      zoom: 9
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        markers.current = [];
        markersAdded.current = false;  // allow markers to re-add on remount
      }
    };
  }, [active]);

  // Add vehicle markers once map and fleet are both ready.
  // Markers are stored by fleet index so selection (an index) can map to them.
  useEffect(() => {
    if (!map.current || !Array.isArray(fleet) || fleet.length === 0 || markersAdded.current) return;

    const addMarkers = () => {
      fleet.forEach((vehicle, index) => {
        if (vehicle.longitude == null || vehicle.latitude == null) return;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <strong>${vehicle.unit_id}</strong><br/>
          ${vehicle.make} ${vehicle.model}<br/>
          Plate: ${vehicle.plate}<br/>
          Status: ${vehicle.status}
        `);

        const marker = new mapboxgl.Marker({ color: MARKER_COLOR })
          .setLngLat([vehicle.longitude, vehicle.latitude])
          .setPopup(popup)
          .addTo(map.current);

        // Clicking a marker selects that vehicle and syncs the rest of the app
        marker.getElement().addEventListener('click', () => onSelectVehicle(index));

        markers.current[index] = marker;
      });
      markersAdded.current = true;
    };

    // Wait for map style to load before adding markers.
    // Use 'idle' rather than 'load' — 'load' fires only once and may have
    // already passed if the map was created on an earlier activation.
    if (map.current.isStyleLoaded()) {
      addMarkers();
    } else {
      map.current.once('idle', addMarkers);
    }
  }, [fleet, active, onSelectVehicle]);

  // React to selection changes from anywhere: fly to the selected vehicle
  // and open only its popup.
  useEffect(() => {
    if (!map.current || !markersAdded.current || selectedVehicle == null) return;

    const vehicle = fleet[selectedVehicle];
    if (!vehicle || vehicle.longitude == null || vehicle.latitude == null) return;

    map.current.flyTo({ center: [vehicle.longitude, vehicle.latitude], zoom: 13 });

    markers.current.forEach((marker, index) => {
      if (!marker) return;
      const popup = marker.getPopup();
      if (!popup) return;
      const shouldBeOpen = index === selectedVehicle;
      if (shouldBeOpen !== popup.isOpen()) marker.togglePopup();
    });
  }, [selectedVehicle, fleet]);

  return (
    <div
      className={`view ${active ? 'active' : ''}`}
      id="view-map"
      style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '600px' }}
    >
      <div
        ref={mapContainer}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </div>
  );
}

export default Livemap;
