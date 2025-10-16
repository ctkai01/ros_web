const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');
const { config } = require('../../config/database');

// Get all actions
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Getting all actions');

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .query(`
                SELECT ID, actionName, groupID
                FROM Actions
                ORDER BY actionName
            `);

        console.log(`Found ${result.recordset.length} actions`);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching actions:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Get actions by group ID
router.get('/group/:groupId', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.groupId;
        console.log(`Getting actions for group ID: ${groupId}`);
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('groupId', sql.Int, groupId)
            .query(`
                SELECT ID, actionName, groupID
                FROM Actions
                WHERE groupID = @groupId
                ORDER BY actionName
            `);

        console.log(`Found ${result.recordset.length} actions for group ${groupId}`);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching actions:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Get action by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Getting action details for ID: ${id}`);
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT ID, actionName, groupID
                FROM Actions
                WHERE ID = @id
            `);

        if (result.recordset.length === 0) {
            console.log(`Action ID ${id} not found`);
            return res.status(404).json({ error: 'Action not found' });
        }

        const action = result.recordset[0];
        console.log('Action found:', action);
        res.json(action);
    } catch (error) {
        console.error('Error fetching action details:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
    // KHÔNG CẦN: finally { ... connection.close() ... }
    // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

module.exports = router; 