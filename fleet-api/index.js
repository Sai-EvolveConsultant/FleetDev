const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const { auth } = require('express-oauth2-jwt-bearer');
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`
});

app.use(require('cors')({
  origin: [
    'http://localhost:5175',
    'https://fleet-dev-ecru.vercel.app'
  ]
}));
app.use(express.json());
app.use(require('morgan')('dev'));
app.use(checkJwt);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY unit_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM alerts WHERE resolved = FALSE ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/maintenance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance ORDER BY due_date');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, fuel_pct } = req.body;
    const result = await pool.query(
      'UPDATE vehicles SET status = $1, fuel_pct = $2 WHERE unit_id = $3 RETURNING *',
      [status, fuel_pct, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/work-orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM work_orders ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/summary', async (req, res) => {
  try {
    const vehicles = await pool.query('SELECT COUNT(*) FROM vehicles');
    const active = await pool.query(
      "SELECT COUNT(*) FROM vehicles WHERE status = 'active'"
    );
    const alerts = await pool.query(
      'SELECT COUNT(*) FROM alerts WHERE resolved = FALSE'
    );
    const overdue = await pool.query(
      "SELECT COUNT(*) FROM maintenance WHERE status = 'overdue'"
    );

    res.json({
      total_vehicles: parseInt(vehicles.rows[0].count),
      active_vehicles: parseInt(active.rows[0].count),
      open_alerts: parseInt(alerts.rows[0].count),
      overdue_maintenance: parseInt(overdue.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Create a new work order
app.post('/api/work-orders', async (req, res) => {
  try {
    const { unit_id, description, assigned_to, priority, parts_required, estimated_cost } = req.body;
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const wo_number = `WO-${date}-${rand}`;
    const result = await pool.query(
      `INSERT INTO work_orders 
        (unit_id, description, assigned_to, priority, parts_required, estimated_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open')
       RETURNING *`,
      [unit_id, description, assigned_to, priority, parts_required, estimated_cost]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all inventory items
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY category, description');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or update inventory item
app.post('/api/inventory', async (req, res) => {
  try {
    const { part_number, description, category, quantity_on_hand, reorder_level, unit_cost, supplier } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory (part_number, description, category, quantity_on_hand, reorder_level, unit_cost, supplier)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (part_number) DO UPDATE
       SET quantity_on_hand = EXCLUDED.quantity_on_hand,
           unit_cost = EXCLUDED.unit_cost,
           last_updated = NOW()
       RETURNING *`,
      [part_number, description, category, quantity_on_hand, reorder_level, unit_cost, supplier]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inventory/:id — update a part
app.patch('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { part_number, description, category, quantity_on_hand, reorder_level, unit_cost, supplier } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventory
       SET part_number = $1, description = $2, category = $3,
           quantity_on_hand = $4, reorder_level = $5, unit_cost = $6, supplier = $7,
           last_updated = NOW()
       WHERE id = $8::text
       RETURNING *`,
      [part_number, description, category, quantity_on_hand, reorder_level, unit_cost, supplier, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Part not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating part:', err);
    res.status(500).json({ error: 'Failed to update part' });
  }
});

// DELETE /api/inventory/:id — delete a part
app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM inventory WHERE id = $1::text', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting part:', err);
    res.status(500).json({ error: 'Failed to delete part' });
  }
});

// Get all purchase orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM purchase_orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a purchase order with line items
app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { supplier, notes, approved_by, items } = req.body;
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const po_number = `PO-${date}-${rand}`;
    const total_cost = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const poResult = await pool.query(
      `INSERT INTO purchase_orders (po_number, supplier, notes, approved_by, total_cost, status)
       VALUES ($1,$2,$3,$4,$5,'draft') RETURNING *`,
      [po_number, supplier, notes, approved_by, total_cost]
    );
    const po = poResult.rows[0];
    for (const item of items) {
      await pool.query(
        `INSERT INTO po_items (po_id, part_number, description, quantity, unit_cost, line_total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [po.id, item.part_number, item.description, item.quantity, item.unit_cost, item.quantity * item.unit_cost]
      );
    }
    res.status(201).json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update PO status
app.patch('/api/purchase-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE purchase_orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get single vehicle full detail
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE unit_id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit vehicle details
app.put('/api/vehicles/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      make, model, year, plate, odometer,
      licence_expiry, roadworthy_expiry, insurance_expiry,
      next_service_date, next_service_km, driver_assigned, notes
    } = req.body;
    const result = await pool.query(
      `UPDATE vehicles SET
        make = COALESCE($1, make),
        model = COALESCE($2, model),
        year = COALESCE($3, year),
        plate = COALESCE($4, plate),
        odometer = COALESCE($5, odometer),
        licence_expiry = COALESCE($6, licence_expiry),
        roadworthy_expiry = COALESCE($7, roadworthy_expiry),
        insurance_expiry = COALESCE($8, insurance_expiry),
        next_service_date = COALESCE($9, next_service_date),
        next_service_km = COALESCE($10, next_service_km),
        driver_assigned = COALESCE($11, driver_assigned),
        notes = COALESCE($12, notes)
      WHERE unit_id = $13
      RETURNING *`,
      [make, model, year, plate, odometer,
       licence_expiry, roadworthy_expiry, insurance_expiry,
       next_service_date, next_service_km, driver_assigned, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all work orders for a specific vehicle
app.get('/api/vehicles/:id/work-orders', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM work_orders WHERE unit_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get fuel logs for a specific vehicle
app.get('/api/vehicles/:id/fuel-logs', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM fuel_logs WHERE unit_id = $1 ORDER BY logged_at ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/work-orders/:id — update editable fields on a WO
app.patch('/api/work-orders/:id', async (req, res) => {
  const { id } = req.params;
  const { due_date, actual_cost, assigned_to, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE work_orders
       SET due_date    = COALESCE($1, due_date),
           actual_cost = COALESCE($2, actual_cost),
           assigned_to = COALESCE($3, assigned_to),
           description = COALESCE($4, description)
       WHERE id = $5
       RETURNING *`,
      [due_date || null, actual_cost || null, assigned_to || null, description || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Work order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating work order:', err);
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

// Update work order status (workflow)
app.patch('/api/work-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['open', 'in progress', 'awaiting parts', 'completed', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current WO
    const current = await pool.query('SELECT * FROM work_orders WHERE id = $1', [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Work order not found' });
    const wo = current.rows[0];

    // Update status
    const result = await pool.query(
      `UPDATE work_orders SET
        status = $1,
        completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $3 RETURNING *`,
      [status, status, id]
    );

    // Deduct inventory — wrapped separately so it never crashes the status update
    if (status === 'completed' && wo.status !== 'completed') {
      try {
        if (wo.parts_required && wo.parts_required.trim() !== '') {
          const partsText = wo.parts_required.toLowerCase();
          const inventoryItems = await pool.query('SELECT * FROM inventory');
          for (const item of inventoryItems.rows) {
            const matchByDesc = item.description && partsText.includes(item.description.toLowerCase());
            const matchByPart = item.part_number && partsText.includes(item.part_number.toLowerCase());
            if (matchByDesc || matchByPart) {
              await pool.query(
                `UPDATE inventory
                 SET quantity_on_hand = GREATEST(0, quantity_on_hand - 1),
                     last_updated = NOW()
                 WHERE id = $1`,
                [item.id]
              );
              console.log(`Deducted 1x ${item.description} from inventory`);
            }
          }
        }
      } catch (invErr) {
        // Log but don't fail the request
        console.error('Inventory deduction error:', invErr.message);
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('WO STATUS ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update purchase order status (workflow)
app.patch('/api/purchase-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['draft', 'approved', 'purchased', 'received'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the PO status
    const result = await pool.query(
      'UPDATE purchase_orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    // When marked as received — update inventory quantities
    if (status === 'received') {
      const lineItems = await pool.query(
        'SELECT * FROM po_items WHERE po_id = $1',
        [id]
      );
      for (const item of lineItems.rows) {
        await pool.query(
          `UPDATE inventory
           SET quantity_on_hand = quantity_on_hand + $1,
               last_updated = NOW()
           WHERE part_number = $2`,
          [item.quantity, item.part_number]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get flat parts list for dropdowns
app.get('/api/parts-list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT part_number, description, unit_cost, quantity_on_hand FROM inventory ORDER BY description'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(process.env.PORT, () => {
  console.log(`API running on port ${process.env.PORT}`);
});
