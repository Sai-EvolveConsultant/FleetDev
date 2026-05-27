import { useState, useEffect } from 'react';

function Inventory({ active = false }) {
  const [items, setItems] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        const [invRes, poRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/inventory`),
          fetch(`${import.meta.env.VITE_API_URL}/api/purchase-orders`)
        ]);
        setItems(await invRes.json());
        setPurchaseOrders(await poRes.json());
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

  const handleAddItem = async () => {
    if (!itemForm.part_number || !itemForm.description) {
      alert('Part number and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm)
      });
      const newItem = await res.json();
      setItems(prev => {
        const exists = prev.find(i => i.part_number === newItem.part_number);
        return exists ? prev.map(i => i.part_number === newItem.part_number ? newItem : i) : [newItem, ...prev];
      });
      setShowItemModal(false);
      setItemForm({ part_number: '', description: '', category: '', quantity_on_hand: '', reorder_level: '', unit_cost: '', supplier: '' });
    } catch (err) {
      alert('Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePO = async () => {
    if (!poForm.supplier || poForm.items.some(i => !i.description || !i.quantity)) {
      alert('Supplier and all line items are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poForm)
      });
      const newPO = await res.json();
      setPurchaseOrders(prev => [newPO, ...prev]);
      setShowPOModal(false);
      setPoForm({ supplier: '', approved_by: '', notes: '', items: [{ part_number: '', description: '', quantity: 1, unit_cost: '' }] });
    } catch (err) {
      alert('Failed to create purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  const addPOLine = () => setPoForm(prev => ({
    ...prev,
    items: [...prev.items, { part_number: '', description: '', quantity: 1, unit_cost: '' }]
  }));

  const updatePOLine = (index, field, value) => setPoForm(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
  }));

  const removePOLine = (index) => setPoForm(prev => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== index)
  }));

  const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '8px', padding: '9px 12px', color: 'var(--text)',
    fontSize: '13px', outline: 'none', fontFamily: 'Barlow, sans-serif', width: '100%'
  };

  const labelStyle = {
    fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif',
    letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)'
  };

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div
      className={`view ${active ? 'active' : ''}`}
      id="view-inventory"
      style={{ overflowY: 'auto', display: active ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}
    >
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <div className="kpi blue">
            <div className="kpi-label">Total Parts</div>
            <div className="kpi-value">{items.length}</div>
            <div className="kpi-sub">SKUs tracked</div>
          </div>
          <div className="kpi red">
            <div className="kpi-label">Out of Stock</div>
            <div className="kpi-value">{outOfStock.length}</div>
            <div className="kpi-sub">Immediate order needed</div>
          </div>
          <div className="kpi amber">
            <div className="kpi-label">Low Stock</div>
            <div className="kpi-value">{lowStock.length}</div>
            <div className="kpi-sub">Below reorder level</div>
          </div>
          <div className="kpi green">
            <div className="kpi-label">Stock Value</div>
            <div className="kpi-value" style={{ fontSize: '22px' }}>R {Math.round(totalValue).toLocaleString()}</div>
            <div className="kpi-sub">Total inventory value</div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['stock', 'purchase-orders'].map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: '12px',
                fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: activeTab === tab ? 'rgba(0,229,160,0.1)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--muted2)',
                border: `1px solid ${activeTab === tab ? 'rgba(0,229,160,0.25)' : 'transparent'}`
              }}
            >
              {tab === 'stock' ? 'Stock on Hand' : 'Purchase Orders'}
            </div>
          ))}
        </div>

        {/* Stock on Hand Tab */}
        {activeTab === 'stock' && (
          <div className="wo-wrap">
            <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="panel-title">Parts Inventory</div>
              <div className="panel-action" onClick={() => setShowItemModal(true)}>+ Add Part</div>
            </div>
            <table className="wo-table">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Qty on Hand</th>
                  <th>Reorder Level</th>
                  <th>Unit Cost</th>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isOut = item.quantity_on_hand === 0;
                  const isLow = !isOut && item.quantity_on_hand <= item.reorder_level;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>{item.part_number}</td>
                      <td><strong>{item.description}</strong></td>
                      <td style={{ color: 'var(--muted2)' }}>{item.category}</td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: isOut ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--accent)' }}>
                        {item.quantity_on_hand}
                      </td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--muted)' }}>{item.reorder_level}</td>
                      <td style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>R {Number(item.unit_cost).toLocaleString()}</td>
                      <td style={{ color: 'var(--muted2)', fontSize: '11px' }}>{item.supplier}</td>
                      <td>
                        <span className={`wo-badge ${isOut ? 'wo-sched' : isLow ? 'wo-prog' : 'wo-done'}`}
                          style={isOut ? { background: 'rgba(255,64,96,0.12)', color: 'var(--red)', borderColor: 'rgba(255,64,96,0.3)' } : {}}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'purchase-orders' && (
          <div className="wo-wrap">
            <div className="panel-head" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="panel-title">Purchase Orders</div>
              <div className="panel-action" onClick={() => setShowPOModal(true)}>+ New Purchase Order</div>
            </div>
            <table className="wo-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Total Cost</th>
                  <th>Approved By</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                      No purchase orders yet
                    </td>
                  </tr>
                ) : purchaseOrders.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>{po.po_number}</td>
                    <td><strong>{po.supplier}</strong></td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--accent)' }}>R {Number(po.total_cost || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--muted2)' }}>{po.approved_by || '—'}</td>
                    <td style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: 'var(--muted)' }}>
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`wo-badge ${po.status === 'completed' ? 'wo-done' : po.status === 'approved' ? 'wo-prog' : 'wo-sched'}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Part Modal */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '28px', width: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>
              Add / Update Part
            </div>
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
              <button onClick={handleAddItem} disabled={submitting} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 700 }}>
                {submitting ? 'Saving...' : 'Save Part'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '28px', width: '600px', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>
              New Purchase Order
            </div>
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
              {poForm.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={item.part_number} onChange={e => updatePOLine(index, 'part_number', e.target.value)} placeholder="Part #" style={{ ...inputStyle }} />
                  <input value={item.description} onChange={e => updatePOLine(index, 'description', e.target.value)} placeholder="Description" style={{ ...inputStyle }} />
                  <input value={item.quantity} onChange={e => updatePOLine(index, 'quantity', e.target.value)} placeholder="Qty" type="number" style={{ ...inputStyle }} />
                  <input value={item.unit_cost} onChange={e => updatePOLine(index, 'unit_cost', e.target.value)} placeholder="Unit Cost" type="number" style={{ ...inputStyle }} />
                  <div onClick={() => removePOLine(index)} style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '18px', textAlign: 'center', lineHeight: 1 }}>×</div>
                </div>
              ))}
              <div onClick={addPOLine} style={{ color: 'var(--accent2)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, marginTop: '4px' }}>
                + Add Line Item
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button onClick={() => setShowPOModal(false)} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleCreatePO} disabled={submitting} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '13px', fontWeight: 700 }}>
                {submitting ? 'Creating...' : 'Create PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;