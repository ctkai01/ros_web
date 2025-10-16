const express = require('express');
const sql = require('mssql'); // Still needed for sql.Int etc.
const { authenticateToken } = require('../auth/middleware');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Getting all system logs');
        const pool = req.pool; // Using req.pool
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        const table = 'SystemLogs';
        const result = await pool.request().query(`
            SELECT 
                id, time, description, module
            FROM ${table}
            ORDER BY time DESC
        `);
        console.log(`Found ${result.recordset.length} system logs`);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error getting system logs:', error);
        res.status(500).json({ error: 'Failed to get system logs.' });
    }
});

router.delete('/delete-all', authenticateToken, async (req, res) => {
    try {
        console.log('Deleting all system logs');
        const pool = req.pool; // Using req.pool
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        const table = 'SystemLogs';
        const result = await pool.request().query(`
            DELETE FROM ${table}
        `);
        console.log('All system logs deleted successfully');
        res.json({ success: true, message: 'All system logs deleted successfully', deletedCount: result.rowsAffected[0] });
    } catch (error) {
        console.error('Error deleting all system logs:', error);
        res.status(500).json({ error: 'Failed to delete all system logs.' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting system log with ID: ${id}`);
        
        const pool = req.pool; // Using req.pool
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        const table = 'SystemLogs';
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM ${table}
                WHERE id = @id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'System log not found.' });
        }
        
        console.log(`System log with ID ${id} deleted successfully`);
        res.json({ success: true, message: 'System log deleted successfully', deletedCount: result.rowsAffected[0] });
    } catch (error) {
        console.error('Error deleting system log:', error);
        res.status(500).json({ error: 'Failed to delete system log.' });
    }
});

module.exports = router;
