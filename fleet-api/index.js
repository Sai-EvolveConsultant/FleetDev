const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(require('cors')());
app.use(express.json());
app.use(require('morgan')('dev'));

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

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(process.env.PORT, () => {
  console.log(`API running on port ${process.env.PORT}`);
});
