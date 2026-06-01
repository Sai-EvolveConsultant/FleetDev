import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';



// PO workflow: each status maps to the next action
const PO_WORKFLOW = {
  draft:     { next: 'approved',  label: 'Approve',       color: 'var(--accent2)' },
  approved:  { next: 'purchased', label: 'Mark Purchased', color: 'var(--amber)'  },
  purchased: { next: 'received',  label: 'Mark Received',  color: 'var(--accent)' },
  received:  { next: null,        label: 'Received',       color: 'var(--muted)'  },
};

const poBadgeClass = (status) => {
  if (status === 'received') return 'wo-done';
  if (status === 'purchased') return 'wo-prog';
  if (status === 'approved') return 'wo-sched';
  return 'wo-sched';
};

function Inventory({ active = false }) {
  const { apiFetch } = useApi();
  const [items, setItems] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [partsList, setPartsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingPO, setUpdatingPO] = useState(null);

  const [lineSearches, setLineSearches] = useState(['']);
  const [lineDropdownOpen, setLineDropdownOpen] = useState(null);

  const [itemForm, setItemForm] = useState({
    part_number: '', description: '', category: '',
    quantity_on_hand: '', reorder_level: '', unit_cost: '', supplier: ''
  });

  const [poForm, setPoForm] = useState({
    supplier: '', approved_by: '', notes: '',
    items: [{ part_number: '', description: '', quantity: 1, unit_cost: '' }]
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [invRes, poRes, partsRes] = await Promise.all([
          apiFetch('/api/inventory'),
          apiFetch('/api/purchase-orders'),
          apiFetch('/api/parts-list')
        ]);
        setItems(await invRes.json());
        setPurchaseOrders(await poRes.json());
        setPartsList(await partsRes.json());
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const lowStock = items.filter(i => i.quantity_on_hand <= i.reorder_level);
  const outOfStock = items.filter(i => i.quantity_on_hand === 0);
  const totalValue = items.reduce((sum, i) => sum + (Number(i.quantity_on_hand) * Number(i.unit_cost)), 0);

  const handleSelectPOPart = (index, part) => {
    updatePOLine(index, 'part_number', part.part_number);
    updatePOLine(index, 'description', part.description);
    updatePOLine(index, 'unit_cost', part.unit_cost);
    const newSearches = [...lineSearches];
    newSearches[index] = part.description;
    setLineSearches(newSearches);
    setLineDropdownOpen(null);
  };

  const addPOLine = () => {
    setPoForm(prev => ({ ...prev, items: [...prev.items, { part_number: '', description: '', quantity: 1, unit_cost: '' }] }));
    setLineSearches(prev => [...prev, '']);
  };

  const updatePOLine = (index, field, value) => setPoForm(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
  }));

  const removePOLine = (index) => {
    setPoForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    setLineSearches(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = async () => {
    if (!itemForm.part_number || !itemForm.description) { alert('Part number and description are required.'); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemForm) });
      const newItem = await res.json();
      setItems(prev => { const exists = prev.find(i => i.part_number === newItem.part_number); return exists ? prev.map(i => i.part_number === newItem.part_number ? newItem : i) : [newItem, ...prev]; });
      setShowItemModal(false);
      setItemForm({ part_number: '', description: '', category: '', quantity_on_hand: '', reorder_level: '', unit_cost: '', supplier: '' });
    } catch (err) { alert('Failed to save item.'); } finally { setSubmitting(false); }
  };

  const handleCreatePO = async () => {
    if (!poForm.supplier || poForm.items.some(i => !i.description || !i.quantity)) { alert('Supplier and all line items are required.'); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/purchase-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(poForm) });
      const newPO = await res.json();
      setPurchaseOrders(prev => [newPO, ...prev]);
      setShowPOModal(false);
      setPoForm({ supplier: '', approved_by: '', notes: '', items: [{ part_number: '', description: '', quantity: 1, unit_cost: '' }] });
      setLineSearches(['']);
    } catch (err) { alert('Failed to create purchase order.'); } finally { setSubmitting(false); }
  };

  const handleAdvancePO = async (po) => {
    const workflow = PO_WORKFLOW[po.status];
    if (!workflow || !workflow.next) return;
    setUpdatingPO(po.id);
    try {
      const res = await apiFetch(`/api/purchase-orders/${po.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: workflow.next }) });
      const updated = await res.json();
      setPurchaseOrders(prev => prev.map(p => p.id === po.id ? updated : p));
    } catch (err) { alert('Failed to update purchase order status.'); } finally { setUpdatingPO(null); }
  };

  const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: 'Barlow, sans-serif', width: '100%' };
  const labelStyle = { fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' };

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div className={`view ${active ? 'active' : ''}`} id="view-inventory" style={{ overflowY: 'auto', display: active ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <div className="kpi blue"><div className="kpi-label">Total Parts</div><div className="kpi-value">{items.length}</div><div className="kpi-sub">SKUs tracked</div></div>
          <div className="kpi red"><div className="kpi-label">Out of Stock</div><div className="kpi-value">{outOfStock.length}</div><div className="kpi-sub">Immediate order needed</div></div>
          <div className="kpi amber"><div className="kpi-label">Low Stock</div><div className="kpi-value">{lowStock.length}</div><div className="kpi-sub">Below reorder level</div></div>
          <div className="kpi green"><div className="kpi-label">Stock Value</div><div className="kpi-value" style={{ fontSize: '22px' }}>R {Math.round(totalValue).toLocaleString()}</div><div className="kpi-sub">Total inventory value</div></div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['stock', 'purchase-orders'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: activeTab === tab ? 'rgba(0,229,160,0.1)' : 'transparent', color: activeTab === tab ? 'var(--accent)' : 'var(--muted2)', border: `1px solid ${activeTab === tab ? 'rgba(0,229,160,0.25)' : 'transparent'}` }}>
              {tab === 'stock' ? 'Stock on Hand' : 'Purchase Orders'}
            </div>
          ))}
        </div>

        {/* Stock on Hand */}
        {activeTab === 'stock' && (
          <div className="wo-wrap">
            <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="panel-title">Parts Inventory</div>
              <div className="panel-action" onClick={() => setShowItemModal(true)}>+ Add Part</div>
            </div>
            <table className="wo-table">
              <thead><tr><th>Part Number</th><th>Description</th><th>Category</th><th>Qty on Hand</th><th>Reorder Level</th><th>Unit Cost</th><th>Supplier</th><th>Status</th></tr></thead>
              <tbody>
                {items.map(item => {
                  const isOut = item.quantity_on_hand === 0;
                  const isLow = !isOut && item.quantity_on_hand <= item.reorder_level;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>{item.part_number}</td>
                      <td><strong>{item.description}</strong></td>
                      <td style={{ color: 'var(--muted2)' }}>{item.category}</td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: isOut ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--accent)' }}>{item.quantity_on_hand}</td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--muted)' }}>{item.reorder_level}</td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>R {Number(item.unit_cost).toLocaleString()}</td>
                      <td style={{ color: 'var(--muted2)', fontSize: '11px' }}>{item.supplier}</td>
                      <td><span className={`wo-badge ${isOut ? 'wo-sched' : isLow ? 'wo-prog' : 'wo-done'}`} style={isOut ? { background: 'rgba(255,64,96,0.12)', color: 'var(--red)', borderColor: 'rgba(255,64,96,0.3)' } : {}}>{isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Purchase Orders */}
        {activeTab === 'purchase-orders' && (
          <div className="wo-wrap">
            <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="panel-title">Purchase Orders</div>
              <div className="panel-action" onClick={() => setShowPOModal(true)}>+ New Purchase Order</div>
            </div>
            <table className="wo-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Total Cost</th><th>Approved By</th><th>Created</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>No purchase orders yet</td></tr>
                ) : purchaseOrders.map(po => {
                  const workflow = PO_WORKFLOW[po.status] || PO_WORKFLOW.draft;
                  return (
                    <tr key={po.id}>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>{po.po_number}</td>
                      <td><strong>{po.supplier}</strong></td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--accent)' }}>R {Number(po.total_cost || 0).toLocaleString()}</td>
                      <td style={{ color: 'var(--muted2)' }}>{po.approved_by || '—'}</td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>{new Date(po.created_at).toLocaleDateString()}</td>
                      <td><span className={`wo-badge ${poBadgeClass(po.status)}`}>{(po.status || 'draft').charAt(0).toUpperCase() + (po.status || 'draft').slice(1)}</span></td>
                      <td>
                        {workflow.next ? (
                          <button onClick={() => handleAdvancePO(po)} disabled={updatingPO === po.id} style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${workflow.color}`, background: 'transparent', color: workflow.color, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', opacity: updatingPO === po.id ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                            {updatingPO === po.id ? '...' : workflow.label}
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif' }}>Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Part Modal */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '28px', width: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>Add / Update Part</div>
            {[
              { label: 'Part Number *', key: 'part_number', placeholder: 'e.g. BRK-002' },
              { label: 'Description *', key: 'description', placeholder: 'e.g. Rear Brake Pads' },
              { label: 'Category', key: 'category', placeholder: 'e.g. Brakes' },
              { label: 'Quantity on Hand', key: 'quantity_on_hand', placeholder: 'e.g. 10' },
              { label: 'Reorder Level', key: 'reorder_level', placeholder: 'e.g. 5' },
              { label: 'Unit Cost (R)', key: 'unit_cost', placeholder: 'e.g. 850' },
              { label: 'Supplier', key: 'supplier', placeholder: 'e.g. SA Parts Direct' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>{label}</label>
                <input value={itemForm[key]} onChange={e => setItemForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button onClick={() => setShowItemModal(false)} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleAddItem} disabled={submitting} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 700 }}>{submitting ? 'Saving...' : 'Save Part'}</button>
            </div>
          </div>
        </div>
      )}

      {/* New PO Modal */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '28px', width: '640px', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>New Purchase Order</div>
            {[
              { label: 'Supplier *', key: 'supplier', placeholder: 'e.g. SA Parts Direct' },
              { label: 'Approved By', key: 'approved_by', placeholder: 'e.g. Fleet Manager' },
              { label: 'Notes', key: 'notes', placeholder: 'Any additional notes...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>{label}</label>
                <input value={poForm[key]} onChange={e => setPoForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <div style={{ ...labelStyle, marginBottom: '10px' }}>Line Items</div>
              {poForm.items.map((item, index) => {
                const search = lineSearches[index] || '';
                const filtered = partsList.filter(p => p.description.toLowerCase().includes(search.toLowerCase()) || p.part_number.toLowerCase().includes(search.toLowerCase()));
                return (
                  <div key={index} style={{ marginBottom: '10px', padding: '10px', background: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <label style={{ ...labelStyle, marginBottom: '4px', display: 'block' }}>Part (search inventory)</label>
                      <input
                        value={search}
                        onChange={e => { const s = [...lineSearches]; s[index] = e.target.value; setLineSearches(s); updatePOLine(index, 'description', e.target.value); setLineDropdownOpen(index); }}
                        onFocus={() => setLineDropdownOpen(index)}
                        placeholder="Search or type part description..."
                        style={inputStyle}
                      />
                      {lineDropdownOpen === index && filtered.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '8px', zIndex: 200, maxHeight: '150px', overflowY: 'auto', marginTop: '2px' }}>
                          {filtered.map(part => (
                            <div key={part.part_number} onClick={() => handleSelectPOPart(index, part)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <div>
                                <div style={{ fontSize: '12px', color: 'var(--text)' }}>{part.description}</div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif' }}>{part.part_number}</div>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>R {Number(part.unit_cost).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: '8px', alignItems: 'center' }}>
                      <div><label style={{ ...labelStyle, marginBottom: '4px', display: 'block' }}>Quantity</label><input value={item.quantity} onChange={e => updatePOLine(index, 'quantity', e.target.value)} type="number" placeholder="Qty" style={inputStyle} /></div>
                      <div><label style={{ ...labelStyle, marginBottom: '4px', display: 'block' }}>Unit Cost (R)</label><input value={item.unit_cost} onChange={e => updatePOLine(index, 'unit_cost', e.target.value)} type="number" placeholder="Unit Cost" style={inputStyle} /></div>
                      <div onClick={() => removePOLine(index)} style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '20px', textAlign: 'center', paddingTop: '18px' }}>×</div>
                    </div>
                    {item.quantity && item.unit_cost && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', textAlign: 'right' }}>
                        Line total: R {(Number(item.quantity) * Number(item.unit_cost)).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
              <div onClick={addPOLine} style={{ color: 'var(--accent2)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, marginTop: '4px' }}>+ Add Line Item</div>
              {poForm.items.some(i => i.quantity && i.unit_cost) && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0,229,160,0.08)', borderRadius: '8px', border: '1px solid rgba(0,229,160,0.2)', textAlign: 'right', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                  PO Total: R {poForm.items.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.unit_cost || 0)), 0).toLocaleString()}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button onClick={() => { setShowPOModal(false); setLineSearches(['']); }} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleCreatePO} disabled={submitting} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 700 }}>{submitting ? 'Creating...' : 'Create PO'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
