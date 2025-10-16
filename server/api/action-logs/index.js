const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { config } = require('../../config/database');
const { authenticateToken } = require('../auth/middleware');

// Get action logs for a specific mission within time range
router.get('/:missionId', authenticateToken, async (req, res) => {
    try {
        const { missionId } = req.params;
        const { startedAt, completedAt } = req.query;
        
        console.log(`Getting action logs for mission ${missionId} from ${startedAt} to ${completedAt}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const table = config.engine === 'mysql' ? 'MissionLog' : '[NTURobot].[dbo].[MissionLog]';

        let query = `
            SELECT 
                ID,
                timestamp,
                level,
                message
            FROM ${table}
            WHERE 1=1
        `;

        const request = pool.request();
        
        // Add time range filter if provided
        if (startedAt && startedAt !== 'null' && startedAt !== '') {
            query += ` AND timestamp >= @startedAt`;
            request.input('startedAt', sql.DateTime2, new Date(startedAt));
        }
        
        if (completedAt && completedAt !== 'null' && completedAt !== '') {
            query += ` AND timestamp <= @completedAt`;
            request.input('completedAt', sql.DateTime2, new Date(completedAt));
        }

        query += ` ORDER BY timestamp DESC`;

        const result = await request.query(query);

        console.log(`Found ${result.recordset.length} action log items`);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching action logs:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Delete all action logs for a mission within time range
router.delete('/:missionId/delete-all', authenticateToken, async (req, res) => {
    try {
        const { missionId } = req.params;
        const { startedAt, completedAt } = req.query;
        
        console.log(`Deleting all action logs for mission ${missionId} from ${startedAt} to ${completedAt}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const table = config.engine === 'mysql' ? 'MissionLog' : '[NTURobot].[dbo].[MissionLog]';

        let query = `
            DELETE FROM ${table}
            WHERE 1=1
        `;

        const request = pool.request();
        
        // Add time range filter if provided
        if (startedAt && startedAt !== 'null' && startedAt !== '') {
            query += ` AND timestamp >= @startedAt`;
            request.input('startedAt', sql.DateTime2, new Date(startedAt));
        }
        
        if (completedAt && completedAt !== 'null' && completedAt !== '') {
            query += ` AND timestamp <= @completedAt`;
            request.input('completedAt', sql.DateTime2, new Date(completedAt));
        }

        const result = await request.query(query);

        console.log(`Deleted ${result.rowsAffected[0]} action log items`);
        res.status(200).json({ 
            message: 'All action logs deleted successfully',
            deletedCount: result.rowsAffected[0]
        });
    } catch (error) {
        console.error('Error deleting all action logs:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Delete single action log item by ID
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting action log item with ID: ${id}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const table = config.engine === 'mysql' ? 'MissionLog' : '[NTURobot].[dbo].[MissionLog]';
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM ${table}
                WHERE ID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ 
                error: 'Action log item not found' 
            });
        }

        console.log(`Action log item with ID ${id} deleted successfully`);
        res.status(200).json({ 
            message: 'Action log item deleted successfully',
            deletedId: id
        });
    } catch (error) {
        console.error('Error deleting action log item:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

module.exports = router;
