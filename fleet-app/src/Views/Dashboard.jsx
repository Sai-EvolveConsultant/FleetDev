import { useState, useEffect } from 'react';
import { STATUS_MAP, MAKE_ICONS, MAKE_BG, fmtOdo } from '../Data/Vehicles.jsx';
import { useApi } from '../hooks/useApi';

const Dashboard = ({ selectedVehicle = null, active = false, onNavigate = () => {}, onSelectVehicle = () => {} }) => {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { apiFetch } = useApi();

  const getVehicleId = (vehicle) => vehicle.id ?? vehicle.unit_id ?? vehicle.vehicle_id ?? 'Unknown';
  const getVehicleMake = (vehicle) => String(vehicle.make || vehicle.brand || '').toUpperCase();
  const getVehicleStatus = (vehicle) => String(vehicle.status || vehicle.state || 'idle').toLowerCase();
  const getVehicleFuel = (vehicle) => vehicle.fuel ?? vehicle.fuel_pct ?? 0;
  const getVehicleOdo = (vehicle) => vehicle.odo ?? vehicle.odometer ?? 0;
  const getVehiclePlate = (vehicle) => vehicle.plate ?? vehicle.plate_number ?? '-';
  const getVehicleModel = (vehicle) => vehicle.model ?? vehicle.model_name ?? '';
  const getVehicleYear = (vehicle) => vehicle.year ?? vehicle.model_year ?? '-';

  useEffect(() => {
  const fetchData = async () => {
    try {
      const [vehiclesRes, alertsRes] = await Promise.all([
        apiFetch('/api/vehicles'),
        apiFetch('/api/alerts')
      ]);
      const vehiclesData = await vehiclesRes.json();
      const alertsData = await alertsRes.json();
      setVehicles(vehiclesData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
  if (loading) {
    return <div className="loading">Loading fleet data...</div>;
  }

  return (
    <div id="view-dashboard" className={`view ${active ? 'active' : ''}`}>

      <div className="kpi-row">
        <div className="kpi green">
          <div className="kpi-label">Fleet Size</div>
          <div className="kpi-value">86</div>
          <div className="kpi-sub">MAN · SCANIA · M BENZ</div>
        </div>
        <div className="kpi blue">
          <div className="kpi-label">On Route</div>
          <div className="kpi-value" id="kpi-onroute">34</div>
          <div className="kpi-sub">Active dispatches</div>
        </div>
        <div className="kpi amber">
          <div className="kpi-label">Avg Odometer</div>
          <div className="kpi-value">612K</div>
          <div className="kpi-sub">km across fleet</div>
        </div>
        <div className="kpi red">
          <div className="kpi-label">Service Due</div>
          <div className="kpi-value">7</div>
          <div className="kpi-sub">3 overdue</div>
        </div>
        <div className="kpi purple">
          <div className="kpi-label">Fleet Uptime</div>
          <div className="kpi-value">89%</div>
          <div className="kpi-sub">↑ 2% this week</div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Fleet table */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Fleet Status — Active Vehicles</div>
            <div className="panel-action" onClick={() => onNavigate('map')}>View on map →</div>
          </div>
          <div className="fleet-wrap">
            <div className="fleet-row hdr">
              <div></div>
              <div>Vehicle</div>
              <div>Status</div>
              <div>Plate</div>
              <div>Odometer</div>
              <div>Fuel</div>
              <div>Year</div>
            </div>
            {/* fleet rows rendered from data */}
            <div>
              {vehicles.map((v, i) => {
                const vehicleId = getVehicleId(v)
                const vehicleMake = getVehicleMake(v)
                const statusKey = getVehicleStatus(v)
                const st = STATUS_MAP[statusKey] || { cls: 'badge-idle', label: statusKey }
                const fuel = getVehicleFuel(v)
                const fuelColor = fuel < 20 ? 'var(--red)' : fuel < 40 ? 'var(--amber)' : 'var(--accent)'
                return (
                  <div key={`${vehicleId}-${i}`} className={`fleet-row ${selectedVehicle === i ? 'sel' : ''}`} onClick={() => onSelectVehicle(v)}>
                    <div className="v-icon" style={{ background: MAKE_BG[vehicleMake] || 'rgba(255,255,255,0.06)' }}>
                      {MAKE_ICONS[vehicleMake] || '🚛'}
                    </div>
                    <div>
                      <div className="v-name">Unit {vehicleId}</div>
                      <div className="v-model">{vehicleMake} {getVehicleModel(v)}</div>
                    </div>
                    <div>
                      <div className={`badge ${st.cls}`}><span className="badge-dot"></span>{st.label}</div>
                    </div>
                    <div className="v-plate">{getVehiclePlate(v)}</div>
                    <div className="odometer">{fmtOdo(getVehicleOdo(v))}</div>
                    <div className="fuel-cell">
                      <div className="fuel-track"><div className="fuel-fill" style={{ width: `${fuel}%`, background: fuelColor }}></div></div>
                      <div className="fuel-pct">{fuel}%</div>
                    </div>
                    <div className="v-plate">{getVehicleYear(v)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Active Alerts</div>
            <div className="panel-action">View all</div>
          </div>
          <div className="alerts-scroll">
            {alerts.length === 0 ? (
              <div className="alert-row">
                <div className="alert-ic b">ℹ️</div>
                <div>
                  <div className="alert-title">No active alerts</div>
                  <div className="alert-meta">Fleet is currently clear</div>
                </div>
                <div className="alert-time">Now</div>
              </div>
            ) : alerts.map((alert, index) => {
              const alertId = alert.id ?? alert.alert_id ?? alert._id ?? index
              const severity = String(alert.severity || alert.level || 'info').toLowerCase()
              const iconClass = severity === 'critical' ? 'r' : severity === 'warning' ? 'a' : 'b'
              const icon = severity === 'critical' ? '🔴' : severity === 'warning' ? '⚠️' : 'ℹ️'
              const title = alert.title ?? alert.message ?? alert.summary ?? alert.alert_type ?? `Alert ${alertId}`
              const details = [
                alert.vehicle ?? alert.unit_id ?? alert.vehicle_id,
                alert.description ?? alert.details ?? alert.reason
              ].filter(Boolean).join(' · ')
              const meta = details || 'No further details'
              const time = alert.created_at ? new Date(alert.created_at).toLocaleString() : (alert.time ?? 'Recently')

              return (
                <div key={`${alertId}-${index}`} className="alert-row">
                  <div className={`alert-ic ${iconClass}`}>{icon}</div>
                  <div>
                    <div className="alert-title">{title}</div>
                    <div className="alert-meta">{meta}</div>
                  </div>
                  <div className="alert-time">{time}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
