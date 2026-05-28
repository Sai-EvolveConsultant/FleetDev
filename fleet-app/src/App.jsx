import { useState, useEffect } from 'react'

import Topbar from './Components/topbar.jsx'
import MobileNav from './Components/MobileNav.jsx'
import Dashboard from './Views/Dashboard.jsx'
import Livemap from './Views/Livemap.jsx'
import Maintenance from './Views/Maintenance.jsx'
import Reports from './Views/Reports.jsx'
import Inventory from './Views/Inventory.jsx'
import VehicleDetail from './Views/VehicleDetail.jsx'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [fleet, setFleet] = useState([])
  const [detailUnitId, setDetailUnitId] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/vehicles`)
      .then(res => res.json())
      .then(data => setFleet(data))
      .catch(err => console.error('Failed to fetch fleet:', err))
  }, [])

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
