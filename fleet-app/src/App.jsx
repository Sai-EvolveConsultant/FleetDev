import { useAuth0 } from '@auth0/auth0-react';
import Login from './Views/Login.jsx';
import { useState, useEffect } from 'react'
import { useApi } from './hooks/useApi';
import Topbar from './Components/topbar.jsx'
import MobileNav from './Components/MobileNav.jsx'
import Dashboard from './Views/Dashboard.jsx'
import Livemap from './Views/Livemap.jsx'
import Maintenance from './Views/Maintenance.jsx'
import Reports from './Views/Reports.jsx'
import Inventory from './Views/Inventory.jsx'
import VehicleDetail from './Views/VehicleDetail.jsx'

function App() {
  // ── ALL hooks must come first ──────────────────────
  const { isAuthenticated, isLoading } = useAuth0();
  const { apiFetch } = useApi();

  const [activeView, setActiveView] = useState('dashboard')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [fleet, setFleet] = useState([])
  const [detailUnitId, setDetailUnitId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return   // wait for an Auth0 session before fetching
    apiFetch('/api/vehicles')
      .then(res => res.json())
      .then(data => setFleet(data))
      .catch(err => console.error('Failed to fetch fleet:', err))
  }, [isAuthenticated])

  // ── Conditional returns AFTER all hooks ───────────
  if (isLoading) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Barlow Condensed, sans-serif',
        color: 'var(--muted)', fontSize: '14px', letterSpacing: '0.1em'
      }}>
        LOADING...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="shell">
      <Topbar currentView={activeView} onNavigate={setActiveView} />

      <div className="view-wrapper" style={{ flex: 1 }}>
        <Dashboard
          fleet={fleet}
          selectedVehicle={selectedVehicle}
          active={activeView === 'dashboard'}
          onNavigate={setActiveView}
          onSelectVehicle={(vehicle) => {
            setDetailUnitId(vehicle.unit_id)
            setActiveView('vehicle-detail')
          }}
        />

        <Livemap
          fleet={fleet}
          active={activeView === 'map'}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={(idx) => {
            setSelectedVehicle(idx)
            setActiveView('map')
          }}
        />

        <Maintenance active={activeView === 'maintenance'} />
        <Inventory active={activeView === 'inventory'} />
        <Reports fleet={fleet} active={activeView === 'reports'} />

        {detailUnitId && (
          <div className={`view ${activeView === 'vehicle-detail' ? 'active' : ''}`}>
            <VehicleDetail
              unitId={detailUnitId}
              onBack={() => {
                setDetailUnitId(null)
                setActiveView('dashboard')
              }}
            />
          </div>
        )}
      </div>

      <MobileNav currentView={activeView} onNavigate={setActiveView} />
    </div>
  )
}

export default App