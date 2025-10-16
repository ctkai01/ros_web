const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET all dashboards
router.get('/', async (req, res) => {
  try {
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const table = 'Dashboards';
    const result = await pool.request()
      .query(`
        SELECT 
          ID as id,
          Name as name,
          CreatedBy as createdBy,
          Properties as properties
        FROM ${table}
        ORDER BY ID DESC
      `);
    
    // Parse JSON properties for each dashboard
    const dashboardsWithParsedProperties = result.recordset.map(dashboard => ({
      ...dashboard,
      properties: typeof dashboard.properties === 'string' ? 
        JSON.parse(dashboard.properties) : dashboard.properties
    }));
    
    res.json(dashboardsWithParsedProperties);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// GET dashboard by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const table = 'Dashboards';
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          ID as id,
          Name as name,
          CreatedBy as createdBy,
          Properties as properties
        FROM ${table}
        WHERE ID = @id
      `);
    
    const dashboard = result.recordset[0];
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    // Parse JSON properties
    if (typeof dashboard.properties === 'string') {
      dashboard.properties = JSON.parse(dashboard.properties);
    }
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// CREATE new dashboard
router.post('/', async (req, res) => {
  try {
    const { name, createdBy, properties } = req.body;
    
    if (!name || !createdBy) {
      return res.status(400).json({ error: 'Name and createdBy are required' });
    }
    
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const table = 'Dashboards';
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('createdBy', sql.NVarChar, createdBy)
      .input('properties', sql.NVarChar, JSON.stringify(properties || {}))
      .query(`
        INSERT INTO ${table} (Name, CreatedBy, Properties)
        OUTPUT INSERTED.ID, INSERTED.Name, INSERTED.CreatedBy, INSERTED.Properties
        VALUES (@name, @createdBy, @properties)
      `);
    
    const createdDashboard = result.recordset[0];
    
    // Parse JSON properties
    let parsedProperties = createdDashboard.Properties;
    if (typeof parsedProperties === 'string') {
      parsedProperties = JSON.parse(parsedProperties);
    }
    
    res.status(201).json({
      id: createdDashboard.ID,
      name: createdDashboard.Name,
      createdBy: createdDashboard.CreatedBy,
      properties: parsedProperties
    });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// UPDATE dashboard
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, properties } = req.body;
    
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const table = 'Dashboards';
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('properties', sql.NVarChar, JSON.stringify(properties || {}))
      .query(`
        UPDATE ${table}
        SET Name = @name, Properties = @properties
        WHERE ID = @id
      `);
    
    // Get the updated dashboard
    const table2 = 'Dashboards';
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          ID as id,
          Name as name,
          CreatedBy as createdBy,
          Properties as properties
        FROM ${table2}
        WHERE ID = @id
      `);
    
    const dashboard = result.recordset[0];
    
    // Parse JSON properties
    if (typeof dashboard.properties === 'string') {
      dashboard.properties = JSON.parse(dashboard.properties);
    }
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error updating dashboard:', error);
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// DELETE dashboard
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const table = 'Dashboards';
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM ${table} WHERE ID = @id`);
    
    res.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// DUPLICATE dashboard
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { createdBy } = req.body;
    
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    // Get original dashboard
    const table = 'Dashboards';
    const originalResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM ${table} WHERE ID = @id`);
    const original = originalResult.recordset[0];
    
    if (!original) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    // Create duplicate
    const duplicateName = `${original.Name} (Copy)`;
    const result = await pool.request()
      .input('duplicateName', sql.NVarChar, duplicateName)
      .input('createdBy', sql.NVarChar, createdBy || original.CreatedBy)
      .input('properties', sql.NVarChar, original.Properties)
      .query(`
        INSERT INTO ${table} (Name, CreatedBy, Properties)
        OUTPUT INSERTED.ID, INSERTED.Name, INSERTED.CreatedBy, INSERTED.Properties
        VALUES (@duplicateName, @createdBy, @properties)
      `);
    
    const createdDuplicate = result.recordset[0];
    
    // Parse JSON properties
    let parsedProperties = createdDuplicate.Properties;
    if (typeof parsedProperties === 'string') {
      parsedProperties = JSON.parse(parsedProperties);
    }
    
    res.status(201).json({
      id: createdDuplicate.ID,
      name: createdDuplicate.Name,
      createdBy: createdDuplicate.CreatedBy,
      properties: parsedProperties
    });
  } catch (error) {
    console.error('Error duplicating dashboard:', error);
    res.status(500).json({ error: 'Failed to duplicate dashboard' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

module.exports = router; 