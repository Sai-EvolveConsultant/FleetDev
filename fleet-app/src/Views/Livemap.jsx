import { STATUS_MAP, MAKE_ICONS, MAKE_BG, fmtOdo } from '../Data/Vehicles.jsx'
import { useEffect } from 'react'

const Livemap = ({ fleet = [], active = false, selectedVehicle = null, onSelectVehicle = () => {} }) => {
  useEffect(() => {
    if (selectedVehicle == null) return
    const el = document.querySelector('.msv-item.sel')
    el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedVehicle])
  return (
    <div id="view-map" className={`view ${active ? 'active' : ''}`}>
      <div className="map-canvas">
        <svg className="map-bg" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="900" height="600" fill="#0d1520"/>
          <rect x="600" y="0" width="300" height="220" fill="#111e30" opacity="0.8"/>
          <rect x="0" y="400" width="250" height="200" fill="#111e30" opacity="0.8"/>
          <rect x="650" y="380" width="250" height="220" fill="#0d1e14" opacity="0.9"/>
          <rect x="100" y="50" width="180" height="140" fill="#0d1e14" opacity="0.9"/>
          <rect x="280" y="100" width="55" height="40" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="350" y="100" width="80" height="40" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="450" y="100" width="55" height="40" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="280" y="160" width="80" height="55" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="380" y="160" width="60" height="55" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="460" y="160" width="80" height="55" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="280" y="240" width="55" height="55" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="355" y="240" width="80" height="55" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="455" y="240" width="60" height="55" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="280" y="315" width="80" height="45" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="455" y="315" width="60" height="45" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="530" y="315" width="80" height="45" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="330" y="390" width="80" height="60" rx="2" fill="#13213a" opacity="0.9"/>
          <rect x="430" y="390" width="55" height="60" rx="2" fill="#13213a" opacity="0.9"/>
          <line x1="0" y1="290" x2="900" y2="290" stroke="#1e3050" strokeWidth="12"/>
          <line x1="0" y1="290" x2="900" y2="290" stroke="#253d60" strokeWidth="4" opacity="0.6"/>
          <line x1="415" y1="0" x2="415" y2="600" stroke="#1e3050" strokeWidth="12"/>
          <line x1="415" y1="0" x2="415" y2="600" stroke="#253d60" strokeWidth="4" opacity="0.6"/>
          <line x1="220" y1="0" x2="220" y2="600" stroke="#162540" strokeWidth="7"/>
          <line x1="600" y1="0" x2="600" y2="600" stroke="#162540" strokeWidth="7"/>
          <line x1="0" y1="155" x2="900" y2="155" stroke="#162540" strokeWidth="7"/>
          <line x1="0" y1="460" x2="900" y2="460" stroke="#162540" strokeWidth="7"/>
          <line x1="0" y1="600" x2="500" y2="0" stroke="#162540" strokeWidth="5" opacity="0.5"/>
          <text x="450" y="282" fontSize="9" fill="#2a4060" textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" letterSpacing="2">N2 HIGHWAY</text>
          <text x="880" y="285" fontSize="9" fill="#2a4060" textAnchor="end" fontFamily="Barlow Condensed, sans-serif" letterSpacing="2">N2</text>
        </svg>

        <div className="geofence" style={{ left: '28%', top: '22%', width: '220px', height: '220px' }}>
          <div className="geofence-label">ZONE A — DURBAN PORT</div>
        </div>
        <div className="geofence" style={{ right: '12%', top: '50%', width: '160px', height: '160px', borderColor: 'rgba(0,229,160,0.35)', background: 'rgba(0,229,160,0.03)' }}>
          <div className="geofence-label" style={{ color: 'var(--accent)' }}>DEPOT NORTH</div>
        </div>

        <div className={`vpin ${selectedVehicle === 0 ? 'sel' : ''}`} style={{ left: '38%', top: '36%' }} onClick={() => onSelectVehicle(0)}>
          <div className="vpin-body" style={{ background: 'rgba(0,229,160,0.2)', transform: selectedVehicle === 0 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 0 ? '0 10px 30px rgba(0,229,160,0.12)' : undefined, zIndex: selectedVehicle === 0 ? 50 : undefined }}>🚛</div>
          <div className="vpin-id">{fleet[0]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[0]?.id ?? '—'} · {fleet[0]?.make} {fleet[0]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[0]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Year</span><span className="tip-val">{fleet[0]?.year ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[0] ? fmtOdo(fleet[0].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Status</span><span className="tip-val" style={{ color: 'var(--accent)' }}>{STATUS_MAP[fleet[0]?.status]?.label ?? '—'}</span></div>
          </div>
        </div>

        <div className={`vpin ${selectedVehicle === 1 ? 'sel' : ''}`} style={{ left: '57%', top: '22%' }} onClick={() => onSelectVehicle(1)}>
          <div className="vpin-body" style={{ background: 'rgba(61,158,255,0.2)', transform: selectedVehicle === 1 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 1 ? '0 10px 30px rgba(61,158,255,0.12)' : undefined, zIndex: selectedVehicle === 1 ? 50 : undefined }}>🚛</div>
          <div className="vpin-id">{fleet[1]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[1]?.id ?? '—'} · {fleet[1]?.make} {fleet[1]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[1]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Year</span><span className="tip-val">{fleet[1]?.year ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[1] ? fmtOdo(fleet[1].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Status</span><span className="tip-val" style={{ color: 'var(--accent)' }}>{STATUS_MAP[fleet[1]?.status]?.label ?? '—'}</span></div>
          </div>
        </div>

        <div className={`vpin ${selectedVehicle === 2 ? 'sel' : ''}`} style={{ left: '18%', top: '54%' }} onClick={() => onSelectVehicle(2)}>
          <div className="vpin-body" style={{ background: 'rgba(255,64,96,0.2)', transform: selectedVehicle === 2 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 2 ? '0 10px 30px rgba(255,64,96,0.12)' : undefined, zIndex: selectedVehicle === 2 ? 50 : undefined }}>🚛</div>
          <div className="vpin-id">{fleet[2]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[2]?.id ?? '—'} · {fleet[2]?.make} {fleet[2]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[2]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Year</span><span className="tip-val">{fleet[2]?.year ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[2] ? fmtOdo(fleet[2].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Alert</span><span className="tip-val" style={{ color: 'var(--red)' }}>Geofence!</span></div>
          </div>
        </div>

        <div className={`vpin ${selectedVehicle === 3 ? 'sel' : ''}`} style={{ left: '66%', top: '57%' }} onClick={() => onSelectVehicle(3)}>
          <div className="vpin-body" style={{ background: 'rgba(255,184,48,0.2)', transform: selectedVehicle === 3 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 3 ? '0 10px 30px rgba(255,184,48,0.12)' : undefined, zIndex: selectedVehicle === 3 ? 50 : undefined }}>🚛</div>
          <div className="vpin-id">{fleet[3]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[3]?.id ?? '—'} · {fleet[3]?.make} {fleet[3]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[3]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Year</span><span className="tip-val">{fleet[3]?.year ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[3] ? fmtOdo(fleet[3].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Fuel</span><span className="tip-val" style={{ color: 'var(--red)' }}>{fleet[3]?.fuel != null ? fleet[3].fuel + '% LOW' : '—'}</span></div>
          </div>
        </div>

        <div className={`vpin ${selectedVehicle === 4 ? 'sel' : ''}`} style={{ left: '46%', top: '66%' }} onClick={() => onSelectVehicle(4)}>
          <div className="vpin-body" style={{ background: 'rgba(167,139,250,0.2)', transform: selectedVehicle === 4 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 4 ? '0 10px 30px rgba(167,139,250,0.12)' : undefined, zIndex: selectedVehicle === 4 ? 50 : undefined }}>🚛</div>
          <div className="vpin-id">{fleet[4]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[4]?.id ?? '—'} · {fleet[4]?.make} {fleet[4]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[4]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Year</span><span className="tip-val">{fleet[4]?.year ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[4] ? fmtOdo(fleet[4].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Status</span><span className="tip-val" style={{ color: 'var(--purple)' }}>{STATUS_MAP[fleet[4]?.status]?.label ?? '—'}</span></div>
          </div>
        </div>

        <div className={`vpin ${selectedVehicle === 5 ? 'sel' : ''}`} style={{ left: '76%', top: '38%' }} onClick={() => onSelectVehicle(5)}>
          <div className="vpin-body" style={{ background: 'rgba(0,229,160,0.2)', transform: selectedVehicle === 5 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 5 ? '0 10px 30px rgba(0,229,160,0.12)' : undefined, zIndex: selectedVehicle === 5 ? 50 : undefined }}>🚛</div>
          <div className="vpin-id">{fleet[5]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[5]?.id ?? '—'} · {fleet[5]?.make} {fleet[5]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[5]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Year</span><span className="tip-val">{fleet[5]?.year ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[5] ? fmtOdo(fleet[5].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Status</span><span className="tip-val" style={{ color: 'var(--accent)' }}>{STATUS_MAP[fleet[5]?.status]?.label ?? '—'}</span></div>
          </div>
        </div>

        <div className={`vpin ${selectedVehicle === 6 ? 'sel' : ''}`} style={{ left: '30%', top: '20%' }} onClick={() => onSelectVehicle(6)}>
          <div className="vpin-body" style={{ background: 'rgba(0,229,160,0.2)', transform: selectedVehicle === 6 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 6 ? '0 10px 30px rgba(0,229,160,0.12)' : undefined, zIndex: selectedVehicle === 6 ? 50 : undefined }}>🚌</div>
          <div className="vpin-id">{fleet[6]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[6]?.id ?? '—'} · {fleet[6]?.make} {fleet[6]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[6]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[6] ? fmtOdo(fleet[6].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Status</span><span className="tip-val" style={{ color: 'var(--accent)' }}>{STATUS_MAP[fleet[6]?.status]?.label ?? '—'}</span></div>
          </div>
        </div>

        <div className={`vpin ${selectedVehicle === 7 ? 'sel' : ''}`} style={{ left: '53%', top: '44%' }} onClick={() => onSelectVehicle(7)}>
          <div className="vpin-body" style={{ background: 'rgba(255,184,48,0.2)', transform: selectedVehicle === 7 ? 'scale(1.18)' : undefined, boxShadow: selectedVehicle === 7 ? '0 10px 30px rgba(255,184,48,0.12)' : undefined, zIndex: selectedVehicle === 7 ? 50 : undefined }}>🚛</div>
          <div className="vpin-id">{fleet[7]?.id ?? '—'}</div>
          <div className="vpin-tip">
            <div className="tip-name">Unit {fleet[7]?.id ?? '—'} · {fleet[7]?.make} {fleet[7]?.model}</div>
            <div className="tip-row"><span>Plate</span><span className="tip-val">{fleet[7]?.plate ?? '—'}</span></div>
            <div className="tip-row"><span>Year</span><span className="tip-val">{fleet[7]?.year ?? '—'}</span></div>
            <div className="tip-row"><span>Odometer</span><span className="tip-val">{fleet[7] ? fmtOdo(fleet[7].odo) + ' km' : '—'}</span></div>
            <div className="tip-row"><span>Status</span><span className="tip-val" style={{ color: 'var(--amber)' }}>{STATUS_MAP[fleet[7]?.status]?.label ?? '—'}</span></div>
          </div>
        </div>

        <div className="map-overlay">
          <div className="map-search">🔍 Search vehicles, plates, drivers…</div>
          <div className="map-zoom">
            <div className="map-zoom-btn">+</div>
            <div className="map-zoom-btn">−</div>
            <div className="map-zoom-btn">⊙</div>
          </div>
          {selectedVehicle != null && fleet[selectedVehicle] && (
            <div className="map-selected-card">
              <div className="map-selected-title">Selected vehicle</div>
              <div className="map-selected-meta">Unit {fleet[selectedVehicle].id} · {fleet[selectedVehicle].make} {fleet[selectedVehicle].model}</div>
              <div className="map-selected-row"><span>Plate</span><strong>{fleet[selectedVehicle].plate}</strong></div>
              <div className="map-selected-row"><span>Status</span><strong>{STATUS_MAP[fleet[selectedVehicle].status]?.label ?? fleet[selectedVehicle].status}</strong></div>
              <div className="map-selected-row"><span>Fuel</span><strong>{fleet[selectedVehicle].fuel}%</strong></div>
            </div>
          )}
        </div>

        <div className="map-legend">
          <div className="legend-hd">Status</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent)' }}></div>On Route (34)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--amber)' }}></div>Idle (18)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--red)' }}></div>Alert (4)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--purple)' }}></div>Parked (30)</div>
        </div>
      </div>

      <div className="map-side">
        <div className="map-side-head">
          <div className="map-side-title">Fleet Vehicles</div>
          <div className="map-side-sub">{fleet.length} total</div>
        </div>
        <div className="map-side-list">
          {fleet.map((v, i) => {
            const st = STATUS_MAP[v.status] || { cls: 'badge-idle', label: v.status }
            return (
              <div key={v.id} className={`msv-item ${selectedVehicle === i ? 'sel' : ''}`} onClick={() => onSelectVehicle(i)}>
                <div className="msv-icon" style={{ background: MAKE_BG[v.make] || 'rgba(255,255,255,0.06)' }}>{MAKE_ICONS[v.make] || '🚛'}</div>
                <div>
                  <div className="msv-name">Unit {v.id}</div>
                  <div className="msv-model">{v.make} {v.model}</div>
                  <div className="msv-km">{fmtOdo(v.odo)} km</div>
                </div>
                <div className="msv-status"><div className={`badge ${st.cls}`}>{st.label}</div></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Livemap
