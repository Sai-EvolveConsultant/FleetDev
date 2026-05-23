import { STATUS_MAP, MAKE_ICONS, MAKE_BG, fmtOdo } from '../Data/Vehicles.jsx'

const Dashboard = ({ fleet = [], selectedVehicle = null, active = false, onNavigate = () => {}, onSelectVehicle = () => {} }) => {
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
              {fleet.map((v, i) => {
                const st = STATUS_MAP[v.status] || { cls: 'badge-idle', label: v.status }
                const fuelColor = v.fuel < 20 ? 'var(--red)' : v.fuel < 40 ? 'var(--amber)' : 'var(--accent)'
                return (
                  <div key={v.id} className={`fleet-row ${selectedVehicle === i ? 'sel' : ''}`} onClick={() => { onSelectVehicle(i); onNavigate && onNavigate('map') }}>
                    <div className="v-icon" style={{ background: MAKE_BG[v.make] || 'rgba(255,255,255,0.06)' }}>
                      {MAKE_ICONS[v.make] || '🚛'}
                    </div>
                    <div>
                      <div className="v-name">Unit {v.id}</div>
                      <div className="v-model">{v.make} {v.model}</div>
                    </div>
                    <div>
                      <div className={`badge ${st.cls}`}><span className="badge-dot"></span>{st.label}</div>
                    </div>
                    <div className="v-plate">{v.plate}</div>
                    <div className="odometer">{fmtOdo(v.odo)}</div>
                    <div className="fuel-cell">
                      <div className="fuel-track"><div className="fuel-fill" style={{ width: `${v.fuel}%`, background: fuelColor }}></div></div>
                      <div className="fuel-pct">{v.fuel}%</div>
                    </div>
                    <div className="v-plate">{v.year || '-'}</div>
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
            <div className="alert-row">
              <div className="alert-ic r">🔴</div>
              <div>
                <div className="alert-title">Geofence breach — Unit 3105</div>
                <div className="alert-meta">Scania F95 · NDH5855 · Left Zone A</div>
              </div>
              <div className="alert-time">2m ago</div>
            </div>
            <div className="alert-row">
              <div className="alert-ic a">⚠️</div>
              <div>
                <div className="alert-title">Service overdue — Unit 4042</div>
                <div className="alert-meta">MAN 18.232 · CF36HMZN · Oil change</div>
              </div>
              <div className="alert-time">1h ago</div>
            </div>
            <div className="alert-row">
              <div className="alert-ic a">⛽</div>
              <div>
                <div className="alert-title">Low fuel — Unit 119</div>
                <div className="alert-meta">MAN 26.35 · NDH2931 · 11% remaining</div>
              </div>
              <div className="alert-time">14m ago</div>
            </div>
            <div className="alert-row">
              <div className="alert-ic a">🔧</div>
              <div>
                <div className="alert-title">High odometer — Unit 4047</div>
                <div className="alert-meta">MAN 18.232 · CF36WVZN · 1,139,444 km</div>
              </div>
              <div className="alert-time">3h ago</div>
            </div>
            <div className="alert-row">
              <div className="alert-ic b">ℹ️</div>
              <div>
                <div className="alert-title">Licence expiry — Driver J. Dlamini</div>
                <div className="alert-meta">Unit 3101 · NDH5851 · 21 days</div>
              </div>
              <div className="alert-time">Today</div>
            </div>
            <div className="alert-row">
              <div className="alert-ic b">ℹ️</div>
              <div>
                <div className="alert-title">New vehicle enrolled — Unit 3135</div>
                <div className="alert-meta">Scania F250 · BT63SJZN · Pending assignment</div>
              </div>
              <div className="alert-time">Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
