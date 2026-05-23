import { useState, useEffect } from 'react'
import { FLEET as INITIAL_FLEET } from './Data/Vehicles.jsx'
import Topbar from './Components/topbar.jsx'
import MobileNav from './Components/MobileNav.jsx'
import Dashboard from './Views/Dashboard.jsx'
import Livemap from './Views/Livemap.jsx'
import Maintenance from './Views/Maintenance.jsx'
import Reports from './Views/Reports.jsx'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [fleet, setFleet] = useState(() => INITIAL_FLEET.map(v => ({ ...v })))

  useEffect(() => {
    // tickFuel: decrement fuel slightly every interval and update fleet state
    const id = setInterval(() => {
      setFleet(prev => prev.map(v => {
        const decay = Math.random() * 1.2
        return { ...v, fuel: Math.max(0, Math.round(v.fuel - decay)) }
      }))
    }, 5000)
    return () => clearInterval(id)
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
          onSelectVehicle={(idx) => {
            setSelectedVehicle(idx)
            setActiveView('map')
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

        <Reports fleet={fleet} active={activeView === 'reports'} />

      </div>

      <MobileNav currentView={activeView} onNavigate={setActiveView} />
    </div>
  )
}

export default App
