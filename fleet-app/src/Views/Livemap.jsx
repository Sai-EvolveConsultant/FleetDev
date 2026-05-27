import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Livemap({ fleet, active = false, selectedVehicle, onSelectVehicle }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersAdded = useRef(false);
  const [vehicles, setVehicles] = useState([]);

  // Fetch vehicles from API once
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/vehicles`)
      .then(res => res.json())
      .then(setVehicles)
      .catch(err => console.error('Failed to fetch vehicles:', err));
  }, []);

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
  }, [active]);

  // Add vehicle markers once map and vehicles are both ready
  useEffect(() => {
    if (!map.current || vehicles.length === 0 || markersAdded.current) return;

    const addMarkers = () => {
      vehicles.forEach(vehicle => {
        if (!vehicle.longitude || !vehicle.latitude) return;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <strong>${vehicle.unit_id}</strong><br/>
          ${vehicle.make} ${vehicle.model}<br/>
          Plate: ${vehicle.plate}<br/>
          Status: ${vehicle.status}
        `);

        new mapboxgl.Marker({ color: '#00ff88' })
          .setLngLat([vehicle.longitude, vehicle.latitude])
          .setPopup(popup)
          .addTo(map.current);
      });
      markersAdded.current = true;
    };

    // Wait for map style to load before adding markers
    if (map.current.isStyleLoaded()) {
      addMarkers();
    } else {
      map.current.once('load', addMarkers);
    }
  }, [vehicles, active]);

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