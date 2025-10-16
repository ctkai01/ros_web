const express = require('express');
const sql = require('mssql'); // Still needed for sql.Int etc.
const { authenticateToken } = require('../auth/middleware');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Getting all error logs');
        const pool = req.pool; // Using req.pool
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        const table = 'ErrorLogs';
        const result = await pool.request().query(`
            SELECT 
                id, timestamp, level, message
            FROM ${table}
            ORDER BY timestamp DESC
        `);
        console.log(`Found ${result.recordset.length} error logs`);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error getting error logs:', error);
        res.status(500).json({ error: 'Failed to get error logs.' });
    }
});

router.delete('/delete-all', authenticateToken, async (req, res) => {
    try {
        console.log('Deleting all error logs');
        const pool = req.pool; // Using req.pool
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        const table = 'ErrorLogs';
        const result = await pool.request().query(`
            DELETE FROM ${table}
        `);
        console.log('All error logs deleted successfully');
        res.json({ success: true, message: 'All error logs deleted successfully', deletedCount: result.rowsAffected[0] });
    } catch (error) {
        console.error('Error deleting all error logs:', error);
        res.status(500).json({ error: 'Failed to delete all error logs.' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting error log with ID: ${id}`);
        
        const pool = req.pool; // Using req.pool
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        const table = 'ErrorLogs';
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM ${table}
                WHERE id = @id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Error log not found.' });
        }
        
        console.log(`Error log with ID ${id} deleted successfully`);
        res.json({ success: true, message: 'Error log deleted successfully', deletedCount: result.rowsAffected[0] });
    } catch (error) {
        console.error('Error deleting error log:', error);
        res.status(500).json({ error: 'Failed to delete error log.' });
    }
});

module.exports = router;
