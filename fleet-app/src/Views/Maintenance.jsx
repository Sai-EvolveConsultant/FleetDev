import { useState, useEffect } from 'react';

const Maintenance = ({ active = false }) => {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState([]);
 const [showModal, setShowModal] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [form, setForm] = useState({
  unit_id: '',
  description: '',
  assigned_to: '',
  priority: 'normal',
  parts_required: '',
  estimated_cost: ''
 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/maintenance`);
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
  
  useEffect(() => {
  const fetchWorkOrders = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/work-orders`);
      const data = await res.json();
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
    }
  };
  fetchWorkOrders();
 }, []);

   const handleSubmit = async () => {
   if (!form.unit_id || !form.description) {
    alert('Unit ID and description are required.');
    return;
   }
   setSubmitting(true);
   try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/work-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
     });
     const newWO = await res.json();
     setWorkOrders(prev => [newWO, ...prev]);
     setShowModal(false);
     setForm({ unit_id: '', description: '', assigned_to: '', priority: 'normal', parts_required: '', estimated_cost: '' });
     } catch (err) {
     console.error('Failed to create work order:', err);
     alert('Failed to create work order. Please try again.');
     } finally {
     setSubmitting(false);
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
  const getTechnician = (record) =>
    record.technician ?? record.assigned_to ?? record.tech ?? record.worker ?? 'TBD';
  const getEstimatedHours = (record) =>
    record.estimated_hours ?? record.est_hours ?? record.hours ?? record.duration ?? '-';
  const getStatus = (record) => String(record.status ?? 'scheduled').toLowerCase();
  const getOdometer = (record) => record.odometer ?? record.km ?? record.distance ?? null;
  const getDueText = (record) => {
    if (record.due_date) {
      return `Due ${new Date(record.due_date).toLocaleDateString()}`;
    }
    if (record.notes) {
      return record.notes;
    }
    return 'Scheduled';
  };

  const getCardType = (status) => {
    if (status.includes('overdue') || status.includes('late') || status.includes('past')) {
      return { cls: 'ov', label: '⚠ Overdue' };
    }
    if (status.includes('progress') || status.includes('in progress')) {
      return { cls: 'du', label: '→ Due This Week' };
    }
    if (status.includes('complete') || status.includes('done') || status.includes('closed')) {
      return { cls: 'ok', label: '✓ Scheduled' };
    }
    return { cls: 'du', label: '→ Due This Week' };
  };

  const getBadgeClass = (status) => {
    if (status.includes('complete') || status.includes('done') || status.includes('closed')) {
      return 'wo-done';
    }
    if (status.includes('progress') || status.includes('in progress')) {
      return 'wo-prog';
    }
    return 'wo-sched';
  };

  if (loading) {
    return <div className="loading">Loading maintenance records...</div>;
  }

  return (
    <div id="view-maintenance" className={`view ${active ? 'active' : ''}`}>
      <div className="maint-kpis">
        <div className="kpi red">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value">{records.filter((record) => getStatus(record).includes('overdue')).length}</div>
          <div className="kpi-sub">Immediate action</div>
        </div>
        <div className="kpi amber">
          <div className="kpi-label">Due This Week</div>
          <div className="kpi-value">{records.filter((record) => getStatus(record).includes('due') || getStatus(record).includes('scheduled') || getStatus(record).includes('progress')).length}</div>
          <div className="kpi-sub">Schedule now</div>
        </div>
        <div className="kpi blue">
          <div className="kpi-label">In Workshop</div>
          <div className="kpi-value">{records.filter((record) => getStatus(record).includes('progress')).length}</div>
          <div className="kpi-sub">Active work orders</div>
        </div>
        <div className="kpi green">
          <div className="kpi-label">Completed MTD</div>
          <div className="kpi-value">{records.filter((record) => getStatus(record).includes('complete') || getStatus(record).includes('done') || getStatus(record).includes('closed')).length}</div>
          <div className="kpi-sub">This month</div>
        </div>
      </div>

      <div className="maint-cards">
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
       </tr>
      </thead>
    <tbody>
      {workOrders.length === 0 ? (
        <tr>
          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
            No work orders found
          </td>
        </tr>
      ) : (
        workOrders.map((wo) => (
          <tr key={wo.id}>
            <td><strong>{wo.unit_id}</strong></td>
            <td>{wo.description}</td>
            <td>{wo.assigned_to || '—'}</td>
            <td>
              <span className={`wo-badge ${
                wo.priority === 'urgent' ? 'wo-sched' :
                wo.priority === 'high' ? 'wo-prog' : 'wo-done'
              }`}>
                {wo.priority || 'normal'}
              </span>
            </td>
            <td>{wo.estimated_cost ? `R ${Number(wo.estimated_cost).toLocaleString()}` : '—'}</td>
            <td>
              <span className={`wo-badge ${getBadgeClass(wo.status || 'open')}`}>
                {(wo.status || 'open').charAt(0).toUpperCase() + (wo.status || 'open').slice(1)}
              </span>
            </td>
          </tr>
        ))
      )}
     </tbody>
     </table>
     </div>
    {showModal && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border2)',
      borderRadius: '14px', padding: '28px', width: '480px',
      display: 'flex', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>
        New Work Order
      </div>

      {[
        { label: 'Unit ID *', key: 'unit_id', placeholder: 'e.g. 3105' },
        { label: 'Description *', key: 'description', placeholder: 'e.g. Replace front brake pads' },
        { label: 'Assigned To', key: 'assigned_to', placeholder: 'e.g. Workshop A' },
        { label: 'Parts Required', key: 'parts_required', placeholder: 'e.g. Brake pads x4, caliper bolts' },
        { label: 'Estimated Cost (R)', key: 'estimated_cost', placeholder: 'e.g. 2500' },
      ].map(({ label, key, placeholder }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {label}
          </label>
          <input
            value={form[key]}
            onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              borderRadius: '8px', padding: '9px 12px',
              color: 'var(--text)', fontSize: '13px', outline: 'none',
              fontFamily: 'Barlow, sans-serif'
            }}
          />
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Priority
        </label>
        <select
          value={form.priority}
          onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: '8px', padding: '9px 12px',
            color: 'var(--text)', fontSize: '13px', outline: 'none',
            fontFamily: 'Barlow, sans-serif'
          }}
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          onClick={() => setShowModal(false)}
          style={{
            padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border2)',
            background: 'transparent', color: 'var(--muted2)', cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 600
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '9px 20px', borderRadius: '8px', border: 'none',
            background: 'var(--accent)', color: '#000', cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 700,
            opacity: submitting ? 0.6 : 1
          }}
        >
          {submitting ? 'Creating...' : 'Create Work Order'}
        </button>
      </div>
    </div>
  </div>
)}
     </div>
  );
};

export default Maintenance
