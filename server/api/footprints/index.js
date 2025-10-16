const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');
const { config } = require('../../config/database');// Get robot footprint settings

router.get('/',  async (req, res) => {
    try {
        const siteId = req.params.siteId;
        console.log('Getting robot footprint settings for site ID:', siteId);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        const result = await pool.request()
            .query(`
                SELECT ID,Name,Properties
                FROM Footprints
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching footprint :', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});
router.get('/:siteId',  async (req, res) => {
    try {
        const siteId = req.params.siteId;
        console.log('Getting robot footprint settings for site ID:', siteId);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        const result = await pool.request()
            .input('siteId', sql.Int, siteId)
            .query(`
                SELECT ID,Name,Properties
                FROM Footprints
                WHERE IDSite = @siteId
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching footprint :', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});
router.post('/', async (req, res) => {
    try {
        const { siteId, Name, Properties } = req.body; 

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('siteId', sql.Int, siteId)
            .input('Name', sql.NVarChar, Name)
            .input('Properties', sql.NVarChar, Properties)
            .query(`
                INSERT INTO Footprints (IDSite, Name, Properties)
                VALUES (@siteId, @Name, @Properties)
            `);
        res.json(result.recordset);
    } catch (error) {       
        console.error('Error inserting footprint:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { siteId, Name, Properties } = req.body;

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('siteId', sql.Int, siteId)
            .input('Name', sql.NVarChar, Name)
            .input('Properties', sql.NVarChar, Properties)
            .query(`
                UPDATE Footprints
                SET IDSite = @siteId, Name = @Name, Properties = @Properties
                WHERE ID = @id
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error updating footprint:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        }); 
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM Footprints
                WHERE ID = @id
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error deleting footprint:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});






module.exports = router; 