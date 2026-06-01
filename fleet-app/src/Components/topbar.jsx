import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react'

const Topbar = ({ currentView = 'dashboard', onNavigate = () => {} }) => {
  const [time, setTime] = useState('—')
  const { logout } = useAuth0();

  useEffect(() => {
    const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setTime(fmt(new Date()))
    const id = setInterval(() => setTime(fmt(new Date())), 1000)
    return () => clearInterval(id)
  }, [])
  const tabs = [
   { id: 'dashboard', icon: '◈', label: 'Dashboard' },
   { id: 'map', icon: '◉', label: 'Live Map' },
   { id: 'maintenance', icon: '◧', label: 'Maintenance' },
   { id: 'reports', icon: '▦', label: 'Reports' },
   { id: 'inventory', icon: '◫', label: 'Inventory' },
 ];

  const handleSwitch = (view) => () => onNavigate(view);

  return (
    <div className="topbar">
      <div className="logo-block">
        <div className="logo-hex">⬡</div>
        <div>
          <div className="logo-name">FleetCommand</div>
          <div className="logo-tag">Operations Centre</div>
        </div>
      </div>

      <div className="nav-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`nav-tab ${currentView === tab.id ? 'active' : ''}`}
            onClick={handleSwitch(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span> {tab.label}
          </div>
        ))}
      </div>

      <div className="topbar-right">
        <div
       onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
       style={{
       cursor: 'pointer',
       fontFamily: 'Barlow Condensed, sans-serif',
       fontSize: '11px', color: 'var(--muted)',
       letterSpacing: '0.1em', padding: '4px 10px',
       borderRadius: '6px', border: '1px solid var(--border)'
        }}
       >
       Sign Out
       </div>
        <div className="alert-pill">⚠ 4 Active Alerts</div>
        <div className="live-badge">
          <div className="live-dot" />LIVE
        </div>
        <div className="time-display" id="clock">{time}</div>
      </div>
    </div>
  );
};

export default Topbar;
