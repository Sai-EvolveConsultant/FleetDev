import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';



const WO_STATUSES = ['open', 'in progress', 'awaiting parts', 'completed', 'cancelled'];

const getBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'wo-done';
  if (s === 'in progress') return 'wo-prog';
  return 'wo-sched';
};

const Maintenance = ({ active = false }) => {
  const { apiFetch } = useApi();
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState([]);
  const [partsList, setPartsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingWO, setUpdatingWO] = useState(null);
  const [partsSearch, setPartsSearch] = useState('');
  const [showPartsDropdown, setShowPartsDropdown] = useState(false);

  const [form, setForm] = useState({
    unit_id: '',
    description: '',
    assigned_to: '',
    priority: 'normal',
    parts_required: '',
    estimated_cost: ''
  });

  // Fetch maintenance records
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch('/api/maintenance');
        const data = await res.json();
        setMaintenance(data);
      } catch (err) {
        console.error('Failed to fetch maintenance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch work orders
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

  // Fetch parts list for dropdown
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

  // Select a part from the dropdown — auto-fills description and cost
  const handleSelectPart = (part) => {
    setForm(prev => ({
      ...prev,
      parts_required: part.description,
      estimated_cost: part.unit_cost ? String(part.unit_cost) : prev.estimated_cost
    }));
    setPartsSearch(part.description);
    setShowPartsDropdown(false);
  };

  // Create new work order
  const handleSubmit = async () => {
    if (!form.unit_id || !form.description) {
      alert('Unit ID and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const newWO = await res.json();
      setWorkOrders(prev => [newWO, ...prev]);
      setShowModal(false);
      setForm({ unit_id: '', description: '', assigned_to: '', priority: 'normal', parts_required: '', estimated_cost: '' });
      setPartsSearch('');
    } catch (err) {
      console.error('Failed to create work order:', err);
      alert('Failed to create work order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update WO status inline
  const handleWOStatusChange = async (woId, newStatus) => {
    setUpdatingWO(woId);
    try {
      const res = await apiFetch(`/api/work-orders/${woId}/status`, {
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

  const records = Array.isArray(maintenance) ? maintenance : [];

  const getMaintenanceId = (record, index) =>
    record.id ?? record.maintenance_id ?? record.work_order_id ?? record.wo_id ?? record._id ?? `rec-${index}`;
  const getUnit = (record) => record.unit_id ?? record.unit ?? record.vehicle_id ?? 'Unknown';
  const getMakeModel = (record) => {
    const makeModel = record.make_model ?? [record.make, record.model].filter(Boolean).join(' ');
    return makeModel || 'Unknown';
  };
  const getPlate = (record) => record.plate ?? record.plate_number ?? '-';
  const getServiceType = (record) =>
    record.service_type ?? record.service ?? record.description ?? record.task ?? 'Maintenance';
  const getStatus = (record) => String(record.status ?? 'scheduled').toLowerCase();
  const getOdometer = (record) => record.odometer ?? record.km ?? record.distance ?? null;
  const getDueText = (record) => {
    if (record.due_date) return `Due ${new Date(record.due_date).toLocaleDateString()}`;
    if (record.notes) return record.notes;
    return 'Scheduled';
  };
  const getCardType = (status) => {
    if (status.includes('overdue') || status.includes('late')) return { cls: 'ov', label: '⚠ Overdue' };
    if (status.includes('progress')) return { cls: 'du', label: '→ Due This Week' };
    if (status.includes('complete') || status.includes('done') || status.includes('closed')) return { cls: 'ok', label: '✓ Scheduled' };
    return { cls: 'du', label: '→ Due This Week' };
  };

  const filteredParts = partsList.filter(p =>
    p.description.toLowerCase().includes(partsSearch.toLowerCase()) ||
    p.part_number.toLowerCase().includes(partsSearch.toLowerCase())
  );

  const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '8px', padding: '9px 12px', color: 'var(--text)',
    fontSize: '13px', outline: 'none', fontFamily: 'Barlow, sans-serif', width: '100%'
  };
  const labelStyle = {
    fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif',
    letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)'
  };

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
            <div className="panel-title">Open Work Orders</div>
            <div className="panel-action" onClick={() => setShowModal(true)}>+ New Work Order</div>
          </div>
          <table className="wo-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Description</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Est. Cost</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                    No work orders found
                  </td>
                </tr>
              ) : workOrders.map(wo => (
                <tr key={wo.id}>
                  <td><strong>{wo.unit_id}</strong></td>
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
                  <td>
                    <span className={`wo-badge ${getBadgeClass(wo.status)}`}>
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
                        fontFamily: 'Barlow, sans-serif', opacity: updatingWO === wo.id ? 0.5 : 1
                      }}
                    >
                      {WO_STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Work Order Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '28px', width: '500px', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>
              New Work Order
            </div>

            {/* Unit ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Unit ID *</label>
              <input value={form.unit_id} onChange={e => setForm(prev => ({ ...prev, unit_id: e.target.value }))} placeholder="e.g. 3105" style={inputStyle} />
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Description *</label>
              <input value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="e.g. Replace front brake pads" style={inputStyle} />
            </div>

            {/* Assigned To */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Assigned To</label>
              <input value={form.assigned_to} onChange={e => setForm(prev => ({ ...prev, assigned_to: e.target.value }))} placeholder="e.g. Workshop A" style={inputStyle} />
            </div>

            {/* Parts — searchable dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <label style={labelStyle}>Parts Required (select from inventory)</label>
              <input
                value={partsSearch}
                onChange={e => { setPartsSearch(e.target.value); setShowPartsDropdown(true); setForm(prev => ({ ...prev, parts_required: e.target.value })); }}
                onFocus={() => setShowPartsDropdown(true)}
                placeholder="Search parts or type manually..."
                style={inputStyle}
              />
              {showPartsDropdown && filteredParts.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '8px', zIndex: 100, maxHeight: '180px', overflowY: 'auto', marginTop: '2px' }}>
                  {filteredParts.map(part => (
                    <div
                      key={part.part_number}
                      onClick={() => handleSelectPart(part)}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{part.description}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{part.part_number}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                        R {Number(part.unit_cost).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated Cost */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Estimated Cost (R)</label>
              <input value={form.estimated_cost} onChange={e => setForm(prev => ({ ...prev, estimated_cost: e.target.value }))} placeholder="e.g. 2500" style={inputStyle} />
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => { setShowModal(false); setPartsSearch(''); }} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 600 }}>
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
