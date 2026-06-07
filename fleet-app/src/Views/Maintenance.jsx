import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';

const WO_WORKFLOW = {
  'open':           [{ next: 'in progress',    label: 'Start Work',      color: 'var(--accent2)' }],
  'in progress':    [{ next: 'awaiting parts', label: 'Awaiting Parts',  color: 'var(--amber)'   },
                     { next: 'completed',      label: 'Mark Complete',   color: 'var(--accent)'  }],
  'awaiting parts': [{ next: 'in progress',    label: 'Parts Received',  color: 'var(--accent2)' }],
  'completed':      [],
  'cancelled':      [],
};

const getBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed')      return 'wo-done';
  if (s === 'in progress')    return 'wo-prog';
  if (s === 'awaiting parts') return 'wo-approved';
  if (s === 'cancelled')      return 'wo-draft';
  return 'wo-sched';
};

const EMPTY_PART_LINE = { part_number: '', description: '', quantity: 1, unit_cost: '' };

const Maintenance = ({ active = false }) => {
  const { apiFetch } = useApi();
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState([]);
  const [partsList, setPartsList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingWO, setUpdatingWO] = useState(null);
  const [errors, setErrors] = useState({});

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Unit ID dropdown state
  const [unitSearch, setUnitSearch] = useState('');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitRef = useRef(null);

  // Parts line items
  const [partLines, setPartLines] = useState([{ ...EMPTY_PART_LINE }]);
  const [lineSearches, setLineSearches] = useState(['']);
  const [lineDropdownOpen, setLineDropdownOpen] = useState(null);

  const [form, setForm] = useState({
    unit_id: '',
    description: '',
    assigned_to: '',
    priority: 'normal',
    estimated_cost: '',
    due_date: '',
    actual_cost: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch('/api/maintenance');
        setMaintenance(await res.json());
      } catch (err) {
        console.error('Failed to fetch maintenance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const res = await apiFetch('/api/work-orders');
        const data = await res.json();
        setWorkOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch work orders:', err);
      }
    };
    fetchWorkOrders();
  }, []);

  useEffect(() => {
    const fetchPartsList = async () => {
      try {
        const res = await apiFetch('/api/parts-list');
        const data = await res.json();
        setPartsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch parts list:', err);
      }
    };
    fetchPartsList();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await apiFetch('/api/vehicles');
        const data = await res.json();
        setVehicles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      }
    };
    fetchVehicles();
  }, []);

  // Close unit dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) {
        setShowUnitDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Part line item helpers ──────────────────────────────
  const updatePartLine = (index, field, value) => {
    setPartLines(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const addPartLine = () => {
    setPartLines(prev => [...prev, { ...EMPTY_PART_LINE }]);
    setLineSearches(prev => [...prev, '']);
  };

  const removePartLine = (index) => {
    setPartLines(prev => prev.filter((_, i) => i !== index));
    setLineSearches(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectPart = (index, part) => {
    updatePartLine(index, 'part_number', part.part_number);
    updatePartLine(index, 'description', part.description);
    updatePartLine(index, 'unit_cost', part.unit_cost);
    const s = [...lineSearches];
    s[index] = part.description;
    setLineSearches(s);
    setLineDropdownOpen(null);
  };

  // ── Validation ─────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.unit_id) e.unit_id = 'Select a unit from the list.';
    if (!form.description.trim()) e.description = 'Description is required.';
    const hasBlankPart = partLines.some(l => !l.part_number && lineSearches[partLines.indexOf(l)]?.trim());
    if (hasBlankPart) e.parts = 'Select each part from the dropdown — no free-text entries.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const validParts = partLines.filter(l => l.part_number);
    const parts_required = validParts.map(l => `${l.part_number} x${l.quantity}`).join(', ');
    const estimated_cost = form.estimated_cost ||
      (validParts.reduce((s, l) => s + (Number(l.unit_cost) * Number(l.quantity || 1)), 0) || '');
    try {
      const res = await apiFetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parts_required, estimated_cost }),
      });
      const newWO = await res.json();
      setWorkOrders(prev => [newWO, ...prev]);
      setShowModal(false);
      resetModal();
    } catch (err) {
      console.error('Failed to create work order:', err);
      setErrors(prev => ({ ...prev, submit: 'Failed to create work order. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setForm({ unit_id: '', description: '', assigned_to: '', priority: 'normal', estimated_cost: '', due_date: '', actual_cost: '' });
    setUnitSearch('');
    setPartLines([{ ...EMPTY_PART_LINE }]);
    setLineSearches(['']);
    setLineDropdownOpen(null);
    setErrors({});
  };

  // ── WO status advance ──────────────────────────────────
  const handleWOStatusChange = async (woId, newStatus) => {
    setUpdatingWO(`${woId}-${newStatus}`);
    try {
      const res = await apiFetch(`/api/work-orders/${woId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setWorkOrders(prev => prev.map(wo => wo.id === woId ? updated : wo));
    } catch (err) {
      alert('Failed to update work order status.');
    } finally {
      setUpdatingWO(null);
    }
  };

  // ── Maintenance card helpers ───────────────────────────
  const records = Array.isArray(maintenance) ? maintenance : [];
  const getMaintenanceId = (r, i) => r.id ?? r.maintenance_id ?? r.work_order_id ?? r.wo_id ?? r._id ?? `rec-${i}`;
  const getUnit        = (r) => r.unit_id ?? r.unit ?? r.vehicle_id ?? 'Unknown';
  const getMakeModel   = (r) => (r.make_model ?? [r.make, r.model].filter(Boolean).join(' ')) || 'Unknown';
  const getPlate       = (r) => r.plate ?? r.plate_number ?? '-';
  const getServiceType = (r) => r.service_type ?? r.service ?? r.description ?? r.task ?? 'Maintenance';
  const getStatus      = (r) => String(r.status ?? 'scheduled').toLowerCase();
  const getOdometer    = (r) => r.odometer ?? r.km ?? r.distance ?? null;
  const getDueText     = (r) => {
    if (r.due_date) return `Due ${new Date(r.due_date).toLocaleDateString()}`;
    if (r.notes) return r.notes;
    return 'Scheduled';
  };
  const getCardType = (status) => {
    if (status.includes('overdue') || status.includes('late'))                                        return { cls: 'ov', label: '⚠ Overdue' };
    if (status.includes('progress'))                                                                   return { cls: 'du', label: '→ Due This Week' };
    if (status.includes('complete') || status.includes('done') || status.includes('closed'))          return { cls: 'ok', label: '✓ Scheduled' };
    return { cls: 'du', label: '→ Due This Week' };
  };

  // ── Filtered WO list ───────────────────────────────────
  const filteredWOs = workOrders.filter(wo => {
    const statusMatch = filterStatus === 'all' || (wo.status || 'open').toLowerCase() === filterStatus;
    const priorityMatch = filterPriority === 'all' || (wo.priority || 'normal').toLowerCase() === filterPriority;
    return statusMatch && priorityMatch;
  });

  // ── Styles ─────────────────────────────────────────────
  const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '8px', padding: '9px 12px', color: 'var(--text)',
    fontSize: '13px', outline: 'none', fontFamily: 'Barlow, sans-serif', width: '100%',
  };
  const labelStyle = {
    fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif',
    letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)',
  };
  const errorStyle = { fontSize: '11px', color: 'var(--red)', fontFamily: 'Barlow, sans-serif', marginTop: '2px' };
  const advanceBtnStyle = (color) => ({
    padding: '4px 10px', borderRadius: '6px', border: `1px solid ${color}`,
    background: 'transparent', color, cursor: 'pointer',
    fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', fontWeight: 700,
    letterSpacing: '0.06em', whiteSpace: 'nowrap',
  });

  const filteredVehicles = vehicles.filter(v => {
    const q = unitSearch.toLowerCase();
    return (
      String(v.unit_id || '').toLowerCase().includes(q) ||
      (v.make || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="loading">Loading maintenance records...</div>;

  return (
    <div
      id="view-maintenance"
      className={`view ${active ? 'active' : ''}`}
      style={{ overflowY: 'auto', display: active ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}
    >
      {/* KPI Cards */}
      <div className="maint-kpis" style={{ padding: '18px 20px 0' }}>
        <div className="kpi red">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value">{records.filter(r => getStatus(r).includes('overdue')).length}</div>
          <div className="kpi-sub">Immediate action</div>
        </div>
        <div className="kpi amber">
          <div className="kpi-label">Due This Week</div>
          <div className="kpi-value">{records.filter(r => getStatus(r).includes('due') || getStatus(r).includes('scheduled') || getStatus(r).includes('progress')).length}</div>
          <div className="kpi-sub">Schedule now</div>
        </div>
        <div className="kpi blue">
          <div className="kpi-label">In Workshop</div>
          <div className="kpi-value">{records.filter(r => getStatus(r).includes('progress')).length}</div>
          <div className="kpi-sub">Active work orders</div>
        </div>
        <div className="kpi green">
          <div className="kpi-label">Completed MTD</div>
          <div className="kpi-value">{records.filter(r => getStatus(r).includes('complete') || getStatus(r).includes('done') || getStatus(r).includes('closed')).length}</div>
          <div className="kpi-sub">This month</div>
        </div>
      </div>

      {/* Maintenance Cards */}
      <div className="maint-cards" style={{ padding: '14px 20px 0' }}>
        {records.map((record, index) => {
          const status = getStatus(record);
          const cardType = getCardType(status);
          const odometer = getOdometer(record);
          const meta = [getPlate(record), odometer ? `${odometer} km` : null].filter(Boolean).join(' · ');
          return (
            <div key={getMaintenanceId(record, index)} className={`mc ${cardType.cls}`}>
              <div className="mc-type">{cardType.label}</div>
              <div className="mc-vehicle">Unit {getUnit(record)} · {getMakeModel(record)}</div>
              <div className="mc-plate">{meta}</div>
              <div className="mc-service">{getServiceType(record)}</div>
              <div className="mc-due">{getDueText(record)}</div>
            </div>
          );
        })}
      </div>

      {/* Work Orders Table */}
      <div style={{ padding: '14px 20px 20px' }}>
        <div className="wo-wrap">
          <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="panel-title">Work Orders</div>
            <div className="panel-action" onClick={() => { resetModal(); setShowModal(true); }}>+ New Work Order</div>
          </div>

          {/* Filter bar */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ ...labelStyle, marginRight: '4px' }}>Status</span>
              {['all', 'open', 'in progress', 'awaiting parts', 'completed', 'cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '3px 10px', borderRadius: '5px', border: '1px solid',
                    borderColor: filterStatus === s ? 'rgba(0,229,160,0.4)' : 'var(--border2)',
                    background: filterStatus === s ? 'rgba(0,229,160,0.1)' : 'transparent',
                    color: filterStatus === s ? 'var(--accent)' : 'var(--muted2)',
                    cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                  }}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ ...labelStyle, marginRight: '4px' }}>Priority</span>
              {['all', 'normal', 'high', 'urgent'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  style={{
                    padding: '3px 10px', borderRadius: '5px', border: '1px solid',
                    borderColor: filterPriority === p ? 'rgba(0,229,160,0.4)' : 'var(--border2)',
                    background: filterPriority === p ? 'rgba(0,229,160,0.1)' : 'transparent',
                    color: filterPriority === p ? 'var(--accent)' : 'var(--muted2)',
                    cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '11px', fontWeight: 600,
                  }}
                >
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <table className="wo-table">
            <thead>
              <tr>
                <th>WO #</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Est. Cost</th>
                <th>Actual Cost</th>
                <th>Date Created</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWOs.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                    No work orders found
                  </td>
                </tr>
              ) : filteredWOs.map(wo => {
                const status = (wo.status || 'open').toLowerCase();
                const actions = WO_WORKFLOW[status] || [];
                const isTerminal = status === 'completed' || status === 'cancelled';
                return (
                  <tr key={wo.id}>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>{wo.wo_number || '—'}</td>
                    <td><strong>{wo.unit_id}</strong></td>
                    <td>{wo.description}</td>
                    <td style={{ color: 'var(--muted2)' }}>{wo.assigned_to || '—'}</td>
                    <td>
                      <span
                        className={`wo-badge ${wo.priority === 'urgent' ? 'wo-sched' : wo.priority === 'high' ? 'wo-prog' : 'wo-done'}`}
                        style={wo.priority === 'urgent' ? { background: 'rgba(255,64,96,0.12)', color: 'var(--red)', borderColor: 'rgba(255,64,96,0.3)' } : {}}
                      >
                        {wo.priority || 'normal'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {wo.estimated_cost ? `R ${Number(wo.estimated_cost).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {wo.actual_cost ? `R ${Number(wo.actual_cost).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>
                      {wo.created_at ? new Date(wo.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>
                      {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span className={`wo-badge ${getBadgeClass(wo.status)}`}>
                        {(wo.status || 'open').charAt(0).toUpperCase() + (wo.status || 'open').slice(1)}
                      </span>
                    </td>
                    <td>
                      {isTerminal ? (
                        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {status === 'completed' ? 'Complete' : 'Cancelled'}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {actions.map(({ next, label, color }) => (
                            <button
                              key={next}
                              onClick={() => handleWOStatusChange(wo.id, next)}
                              disabled={updatingWO !== null}
                              style={{ ...advanceBtnStyle(color), opacity: updatingWO === `${wo.id}-${next}` ? 0.5 : 1 }}
                            >
                              {updatingWO === `${wo.id}-${next}` ? '...' : label}
                            </button>
                          ))}
                          <button
                            onClick={() => handleWOStatusChange(wo.id, 'cancelled')}
                            disabled={updatingWO !== null}
                            style={advanceBtnStyle('rgba(255,64,96,0.7)')}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Work Order Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '28px', width: '540px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>
              New Work Order
            </div>

            {/* Unit ID — vehicle dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }} ref={unitRef}>
              <label style={labelStyle}>Unit ID *</label>
              <input
                value={unitSearch}
                onChange={e => { setUnitSearch(e.target.value); setForm(prev => ({ ...prev, unit_id: '' })); setShowUnitDropdown(true); }}
                onFocus={() => setShowUnitDropdown(true)}
                placeholder="Search by unit ID, make or model…"
                style={{ ...inputStyle, borderColor: errors.unit_id ? 'var(--red)' : 'var(--border2)' }}
              />
              {errors.unit_id && <span style={errorStyle}>{errors.unit_id}</span>}
              {showUnitDropdown && (
                <div style={{ position: 'absolute', top: errors.unit_id ? 'calc(100% - 18px)' : '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '8px', zIndex: 200, maxHeight: '160px', overflowY: 'auto', marginTop: '2px' }}>
                  {filteredVehicles.length > 0 ? filteredVehicles.map(v => (
                    <div
                      key={v.id || v.unit_id}
                      onClick={() => { setForm(prev => ({ ...prev, unit_id: String(v.unit_id) })); setUnitSearch(`${v.unit_id} — ${v.make || ''} ${v.model || ''}`.trim()); setShowUnitDropdown(false); setErrors(prev => ({ ...prev, unit_id: undefined })); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600, fontFamily: 'Barlow Condensed, sans-serif' }}>Unit {v.unit_id}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>{[v.make, v.model].filter(Boolean).join(' ')}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--muted)' }}>No vehicles found</div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Description *</label>
              <input
                value={form.description}
                onChange={e => { setForm(prev => ({ ...prev, description: e.target.value })); setErrors(prev => ({ ...prev, description: undefined })); }}
                placeholder="e.g. Replace front brake pads"
                style={{ ...inputStyle, borderColor: errors.description ? 'var(--red)' : 'var(--border2)' }}
              />
              {errors.description && <span style={errorStyle}>{errors.description}</span>}
            </div>

            {/* Assigned To */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Assigned To</label>
              <input value={form.assigned_to} onChange={e => setForm(prev => ({ ...prev, assigned_to: e.target.value }))} placeholder="e.g. Workshop A" style={inputStyle} />
            </div>

            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))} style={inputStyle}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Due Date + Estimated Cost */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Estimated Cost (R)</label>
                <input value={form.estimated_cost} onChange={e => setForm(prev => ({ ...prev, estimated_cost: e.target.value }))} placeholder="e.g. 2500" style={inputStyle} />
              </div>
            </div>

            {/* Actual Cost */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Actual Cost (R)</label>
              <input value={form.actual_cost} onChange={e => setForm(prev => ({ ...prev, actual_cost: e.target.value }))} placeholder="e.g. 2200" style={inputStyle} />
            </div>

            {/* Parts line items */}
            <div>
              <label style={{ ...labelStyle, display: 'block', marginBottom: '8px' }}>Parts Required (select from inventory)</label>
              {errors.parts && <span style={{ ...errorStyle, display: 'block', marginBottom: '6px' }}>{errors.parts}</span>}
              {partLines.map((line, index) => {
                const search = lineSearches[index] || '';
                const filtered = partsList.filter(p =>
                  p.description.toLowerCase().includes(search.toLowerCase()) ||
                  p.part_number.toLowerCase().includes(search.toLowerCase())
                );
                return (
                  <div key={index} style={{ marginBottom: '8px', padding: '10px', background: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <input
                        value={search}
                        onChange={e => {
                          const s = [...lineSearches]; s[index] = e.target.value;
                          setLineSearches(s);
                          updatePartLine(index, 'part_number', '');
                          updatePartLine(index, 'description', '');
                          setLineDropdownOpen(index);
                        }}
                        onFocus={() => setLineDropdownOpen(index)}
                        placeholder="Search part description or number…"
                        style={inputStyle}
                      />
                      {lineDropdownOpen === index && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '8px', zIndex: 200, maxHeight: '160px', overflowY: 'auto', marginTop: '2px' }}>
                          {filtered.length > 0 ? filtered.map(part => (
                            <div
                              key={part.part_number}
                              onClick={() => handleSelectPart(index, part)}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div>
                                <div style={{ fontSize: '12px', color: 'var(--text)' }}>{part.description}</div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif' }}>{part.part_number}</div>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>R {Number(part.unit_cost).toLocaleString()}</div>
                            </div>
                          )) : (
                            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--muted)' }}>No matching parts found</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <label style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>Quantity</label>
                        <input value={line.quantity} onChange={e => updatePartLine(index, 'quantity', e.target.value)} type="number" min="1" placeholder="Qty" style={inputStyle} />
                      </div>
                      <div onClick={() => removePartLine(index)} style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '20px', textAlign: 'center', paddingTop: '18px' }}>×</div>
                    </div>
                    {line.part_number && line.unit_cost && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', textAlign: 'right' }}>
                        Line total: R {(Number(line.unit_cost) * Number(line.quantity || 1)).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
              <div onClick={addPartLine} style={{ color: 'var(--accent2)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, marginTop: '4px' }}>+ Add Part</div>
            </div>

            {errors.submit && <span style={errorStyle}>{errors.submit}</span>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => { setShowModal(false); resetModal(); }} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 700, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Creating...' : 'Create Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
