import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;

// ── Helpers ──────────────────────────────────────────────
const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

const expiryColor = (dateStr) => {
  const days = daysUntil(dateStr);
  if (days === null) return 'var(--muted)';
  if (days < 0) return 'var(--red)';
  if (days <= 30) return 'var(--amber)';
  return 'var(--accent)';
};

const expiryLabel = (dateStr) => {
  const days = daysUntil(dateStr);
  if (days === null) return 'Not set';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days <= 30) return `Expires in ${days}d`;
  return `${days}d remaining`;
};

const WO_STATUSES = ['open', 'in progress', 'awaiting parts', 'completed', 'cancelled'];

const woBadgeStyle = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'wo-done';
  if (s === 'in progress') return 'wo-prog';
  if (s === 'awaiting parts') return 'wo-sched';
  if (s === 'cancelled') return 'wo-sched';
  return 'wo-sched';
};

// ── Fuel Trend Mini Chart ─────────────────────────────────
function FuelTrendChart({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
        No fuel log data available
      </div>
    );
  }

  const W = 560, H = 160, PAD = { top: 16, right: 16, bottom: 40, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxCost = Math.max(...logs.map(l => Number(l.cost)));
  const minOdo = Math.min(...logs.map(l => Number(l.odometer)));
  const maxOdo = Math.max(...logs.map(l => Number(l.odometer)));
  const odoRange = maxOdo - minOdo || 1;

  const xPos = (odo) => PAD.left + ((Number(odo) - minOdo) / odoRange) * chartW;
  const yPos = (cost) => PAD.top + chartH - (Number(cost) / maxCost) * chartH;

  const points = logs.map(l => `${xPos(l.odometer)},${yPos(l.cost)}`).join(' ');
  const areaPoints = [
    `${xPos(logs[0].odometer)},${PAD.top + chartH}`,
    ...logs.map(l => `${xPos(l.odometer)},${yPos(l.cost)}`),
    `${xPos(logs[logs.length - 1].odometer)},${PAD.top + chartH}`
  ].join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={PAD.top + chartH * (1 - t)}
            x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
          />
          <text
            x={PAD.left - 6} y={PAD.top + chartH * (1 - t) + 4}
            textAnchor="end" fontSize="9" fill="var(--muted)"
            fontFamily="Barlow Condensed, sans-serif"
          >
            R{Math.round(maxCost * t / 1000)}k
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} fill="rgba(0,229,160,0.06)" />

      {/* Line */}
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />

      {/* Data points */}
      {logs.map((l, i) => (
        <g key={i}>
          <circle cx={xPos(l.odometer)} cy={yPos(l.cost)} r="4"
            fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
          <text
            x={xPos(l.odometer)} y={PAD.top + chartH + 14}
            textAnchor="middle" fontSize="8" fill="var(--muted)"
            fontFamily="Barlow Condensed, sans-serif"
          >
            {(Number(l.odometer) / 1000).toFixed(0)}k
          </text>
          <text
            x={xPos(l.odometer)} y={yPos(l.cost) - 9}
            textAnchor="middle" fontSize="8" fill="var(--accent)"
            fontFamily="Barlow Condensed, sans-serif"
          >
            {Number(l.litres).toFixed(0)}L
          </text>
        </g>
      ))}

      {/* X axis label */}
      <text
        x={PAD.left + chartW / 2} y={H - 2}
        textAnchor="middle" fontSize="9" fill="var(--muted)"
        fontFamily="Barlow Condensed, sans-serif"
      >
        Odometer (km)
      </text>
    </svg>
  );
}

// ── Edit Vehicle Modal ────────────────────────────────────
function EditVehicleModal({ vehicle, onClose, onSave }) {
  const [form, setForm] = useState({
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: vehicle.year || '',
    plate: vehicle.plate || '',
    odometer: vehicle.odometer || '',
    driver_assigned: vehicle.driver_assigned || '',
    licence_expiry: vehicle.licence_expiry ? vehicle.licence_expiry.slice(0, 10) : '',
    roadworthy_expiry: vehicle.roadworthy_expiry ? vehicle.roadworthy_expiry.slice(0, 10) : '',
    insurance_expiry: vehicle.insurance_expiry ? vehicle.insurance_expiry.slice(0, 10) : '',
    next_service_date: vehicle.next_service_date ? vehicle.next_service_date.slice(0, 10) : '',
    next_service_km: vehicle.next_service_km || '',
    notes: vehicle.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '8px', padding: '9px 12px', color: 'var(--text)',
    fontSize: '13px', outline: 'none', fontFamily: 'Barlow, sans-serif', width: '100%'
  };
  const labelStyle = {
    fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif',
    letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)'
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/vehicles/${vehicle.unit_id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const updated = await res.json();
      onSave(updated);
      onClose();
    } catch (err) {
      alert('Failed to save vehicle details.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: 'Make', key: 'make', placeholder: 'e.g. MAN' },
    { label: 'Model', key: 'model', placeholder: 'e.g. 26.35' },
    { label: 'Year', key: 'year', placeholder: 'e.g. 2016' },
    { label: 'Plate', key: 'plate', placeholder: 'e.g. NDH5855' },
    { label: 'Odometer (km)', key: 'odometer', placeholder: 'e.g. 927580' },
    { label: 'Driver Assigned', key: 'driver_assigned', placeholder: 'e.g. S. Nkosi' },
    { label: 'Licence Expiry', key: 'licence_expiry', type: 'date' },
    { label: 'Roadworthy Expiry', key: 'roadworthy_expiry', type: 'date' },
    { label: 'Insurance Expiry', key: 'insurance_expiry', type: 'date' },
    { label: 'Next Service Date', key: 'next_service_date', type: 'date' },
    { label: 'Next Service (km)', key: 'next_service_km', placeholder: 'e.g. 935000' },
    { label: 'Notes', key: 'notes', placeholder: 'Any notes...' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '28px', width: '560px', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>
          Edit Vehicle — Unit {vehicle.unit_id}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {fields.map(({ label, key, placeholder, type }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>{label}</label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder || ''}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 700 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main VehicleDetail Component ──────────────────────────
function VehicleDetail({ unitId, onBack }) {
  const [vehicle, setVehicle] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [activeSection, setActiveSection] = useState('compliance');
  const [updatingWO, setUpdatingWO] = useState(null);

  useEffect(() => {
    if (!unitId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [vRes, woRes, flRes] = await Promise.all([
          fetch(`${API}/api/vehicles/${unitId}`),
          fetch(`${API}/api/vehicles/${unitId}/work-orders`),
          fetch(`${API}/api/vehicles/${unitId}/fuel-logs`)
        ]);
        setVehicle(await vRes.json());
        setWorkOrders(await woRes.json());
        setFuelLogs(await flRes.json());
      } catch (err) {
        console.error('Failed to load vehicle detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [unitId]);

  const handleWOStatusChange = async (woId, newStatus) => {
    setUpdatingWO(woId);
    try {
      const res = await fetch(`${API}/api/work-orders/${woId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setWorkOrders(prev => prev.map(wo => wo.id === woId ? updated : wo));
    } catch (err) {
      alert('Failed to update work order status.');
    } finally {
      setUpdatingWO(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '14px', letterSpacing: '0.1em' }}>
      Loading vehicle data...
    </div>
  );

  if (!vehicle) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--red)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '14px' }}>
      Vehicle not found
    </div>
  );

  const complianceItems = [
    { label: 'Licence Disc', date: vehicle.licence_expiry },
    { label: 'Roadworthy', date: vehicle.roadworthy_expiry },
    { label: 'Insurance', date: vehicle.insurance_expiry },
    { label: 'Next Service', date: vehicle.next_service_date },
  ];

  const totalFuelCost = fuelLogs.reduce((sum, l) => sum + Number(l.cost), 0);
  const totalLitres = fuelLogs.reduce((sum, l) => sum + Number(l.litres), 0);
  const activeWOs = workOrders.filter(wo => !['completed', 'cancelled'].includes((wo.status || '').toLowerCase())).length;

  const sectionTabStyle = (id) => ({
    padding: '7px 16px', borderRadius: '7px', cursor: 'pointer',
    fontFamily: 'Barlow Condensed, sans-serif', fontSize: '12px',
    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    background: activeSection === id ? 'rgba(0,229,160,0.1)' : 'transparent',
    color: activeSection === id ? 'var(--accent)' : 'var(--muted2)',
    border: `1px solid ${activeSection === id ? 'rgba(0,229,160,0.25)' : 'transparent'}`
  });

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '18px 20px', gap: '14px' }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onBack}
          style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--white)', letterSpacing: '0.04em' }}>
            Unit {vehicle.unit_id} — {vehicle.make} {vehicle.model}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            {vehicle.plate} · {vehicle.year} · {Number(vehicle.odometer).toLocaleString()} km
            {vehicle.driver_assigned ? ` · Driver: ${vehicle.driver_assigned}` : ''}
          </div>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(0,229,160,0.3)', background: 'rgba(0,229,160,0.08)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}
        >
          ✎ Edit Vehicle
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <div className="kpi blue">
          <div className="kpi-label">Active Work Orders</div>
          <div className="kpi-value">{activeWOs}</div>
          <div className="kpi-sub">Open / in progress</div>
        </div>
        <div className="kpi green">
          <div className="kpi-label">Fuel Fills Logged</div>
          <div className="kpi-value">{fuelLogs.length}</div>
          <div className="kpi-sub">{totalLitres.toFixed(0)}L total</div>
        </div>
        <div className="kpi amber">
          <div className="kpi-label">Fuel Cost (logged)</div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>R {Math.round(totalFuelCost).toLocaleString()}</div>
          <div className="kpi-sub">All recorded fills</div>
        </div>
        <div className="kpi purple">
          <div className="kpi-label">Completed WOs</div>
          <div className="kpi-value">{workOrders.filter(wo => wo.status === 'completed').length}</div>
          <div className="kpi-sub">Service history</div>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={sectionTabStyle('compliance')} onClick={() => setActiveSection('compliance')}>Compliance</div>
        <div style={sectionTabStyle('work-orders')} onClick={() => setActiveSection('work-orders')}>Work Orders</div>
        <div style={sectionTabStyle('fuel')} onClick={() => setActiveSection('fuel')}>Fuel Trend</div>
      </div>

      {/* ── Compliance Section ── */}
      {activeSection === 'compliance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {complianceItems.map(({ label, date }) => {
            const color = expiryColor(date);
            const days = daysUntil(date);
            return (
              <div key={label} className="panel" style={{ padding: '18px 20px', borderLeft: `3px solid ${color}` }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '26px', fontWeight: 800, color, lineHeight: 1 }}>
                  {fmt(date)}
                </div>
                <div style={{ fontSize: '11px', color, marginTop: '6px', fontWeight: 500 }}>
                  {expiryLabel(date)}
                </div>
                {days !== null && days < 0 && (
                  <div style={{ marginTop: '10px', padding: '6px 10px', background: 'rgba(255,64,96,0.1)', borderRadius: '6px', fontSize: '11px', color: 'var(--red)', fontWeight: 500 }}>
                    ⚠ Immediate renewal required
                  </div>
                )}
                {days !== null && days >= 0 && days <= 30 && (
                  <div style={{ marginTop: '10px', padding: '6px 10px', background: 'rgba(255,184,48,0.1)', borderRadius: '6px', fontSize: '11px', color: 'var(--amber)', fontWeight: 500 }}>
                    ⚠ Renewal due soon
                  </div>
                )}
              </div>
            );
          })}

          {/* Next service info */}
          {vehicle.next_service_km && (
            <div className="panel" style={{ padding: '18px 20px', gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
                Next Service Odometer Target
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '26px', fontWeight: 800, color: 'var(--accent2)' }}>
                  {Number(vehicle.next_service_km).toLocaleString()} km
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '6px', background: 'var(--surface3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      background: 'var(--accent2)',
                      width: `${Math.min(100, (Number(vehicle.odometer) / Number(vehicle.next_service_km)) * 100)}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '5px' }}>
                    {Number(vehicle.odometer).toLocaleString()} km current · {(Number(vehicle.next_service_km) - Number(vehicle.odometer)).toLocaleString()} km remaining
                  </div>
                </div>
              </div>
              {vehicle.notes && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '12px', color: 'var(--muted2)', borderLeft: '3px solid var(--border2)' }}>
                  {vehicle.notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Work Orders Section ── */}
      {activeSection === 'work-orders' && (
        <div className="wo-wrap">
          <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="panel-title">Work Order History — Unit {vehicle.unit_id}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{workOrders.length} total records</div>
          </div>
          <table className="wo-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Est. Cost</th>
                <th>Created</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                    No work orders for this vehicle
                  </td>
                </tr>
              ) : workOrders.map(wo => (
                <tr key={wo.id}>
                  <td>{wo.description}</td>
                  <td style={{ color: 'var(--muted2)' }}>{wo.assigned_to || '—'}</td>
                  <td>
                    <span className={`wo-badge ${wo.priority === 'urgent' ? 'wo-sched' : wo.priority === 'high' ? 'wo-prog' : 'wo-done'}`}
                      style={wo.priority === 'urgent' ? { background: 'rgba(255,64,96,0.12)', color: 'var(--red)', borderColor: 'rgba(255,64,96,0.3)' } : {}}>
                      {wo.priority || 'normal'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {wo.estimated_cost ? `R ${Number(wo.estimated_cost).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>
                    {fmt(wo.created_at)}
                  </td>
                  <td>
                    <span className={`wo-badge ${woBadgeStyle(wo.status)}`}>
                      {(wo.status || 'open').charAt(0).toUpperCase() + (wo.status || 'open').slice(1)}
                    </span>
                  </td>
                  <td>
                    <select
                      value={wo.status || 'open'}
                      disabled={updatingWO === wo.id}
                      onChange={e => handleWOStatusChange(wo.id, e.target.value)}
                      style={{
                        background: 'var(--surface2)', border: '1px solid var(--border2)',
                        borderRadius: '6px', padding: '4px 8px', color: 'var(--text)',
                        fontSize: '11px', cursor: 'pointer', outline: 'none',
                        fontFamily: 'Barlow, sans-serif'
                      }}
                    >
                      {WO_STATUSES.map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Fuel Trend Section ── */}
      {activeSection === 'fuel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Fuel Cost per Fill — Unit {vehicle.unit_id}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Avg {fuelLogs.length > 0 ? (totalLitres / fuelLogs.length).toFixed(0) : 0}L per fill · R {fuelLogs.length > 0 ? Math.round(totalFuelCost / fuelLogs.length).toLocaleString() : 0} avg cost
              </div>
            </div>
            <div style={{ padding: '16px 18px' }}>
              <FuelTrendChart logs={fuelLogs} />
            </div>
          </div>

          {/* Fuel log table */}
          <div className="wo-wrap">
            <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="panel-title">Fuel Log Detail</div>
            </div>
            <table className="wo-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Odometer (km)</th>
                  <th>Litres</th>
                  <th>Cost (R)</th>
                  <th>Cost/Litre</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                      No fuel logs recorded
                    </td>
                  </tr>
                ) : [...fuelLogs].reverse().map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>{fmt(log.logged_at)}</td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{Number(log.odometer).toLocaleString()}</td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--accent)' }}>{Number(log.litres).toFixed(0)}L</td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--accent2)' }}>R {Number(log.cost).toLocaleString()}</td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--muted2)' }}>
                      R {(Number(log.cost) / Number(log.litres)).toFixed(2)}/L
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <EditVehicleModal
          vehicle={vehicle}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => setVehicle(updated)}
        />
      )}
    </div>
  );
}

export default VehicleDetail;
