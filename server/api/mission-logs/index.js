const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { config } = require('../../config/database');
const { authenticateToken } = require('../auth/middleware');

// Get all mission queue items
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Getting all mission queue items');

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const mq = 'MissionQueue';
        const missions = 'Missions';
        const result = await pool.request()
            .query(`
                SELECT 
                    mq.ID,
                    mq.MissionID,
                    m.missionName,
                    mq.Status,
                    mq.QueuedAt,
                    mq.StartedAt,
                    mq.CompletedAt
                FROM ${mq} mq
                LEFT JOIN ${missions} m ON mq.MissionID = m.ID
                ORDER BY mq.QueuedAt DESC
            `);

        console.log(`Found ${result.recordset.length} mission queue items`);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching mission queue items:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Delete all mission queue items
router.delete('/', authenticateToken, async (req, res) => {
    try {
        console.log('Deleting all mission queue items');

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const mq = 'MissionQueue';
        const result = await pool.request()
            .query(`
                DELETE FROM ${mq}
            `);

        console.log('All mission queue items deleted successfully');
        res.status(200).json({ 
            message: 'All mission queue items deleted successfully',
            deletedCount: result.rowsAffected[0]
        });
    } catch (error) {
        console.error('Error deleting all mission queue items:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Delete single mission queue item by ID
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting mission queue item with ID: ${id}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const mq = 'MissionQueue';
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM ${mq}
                WHERE ID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ 
                error: 'Mission queue item not found' 
            });
        }

        console.log(`Mission queue item with ID ${id} deleted successfully`);
        res.status(200).json({ 
            message: 'Mission queue item deleted successfully',
            deletedId: id
        });
    } catch (error) {
        console.error('Error deleting mission queue item:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

module.exports = router;
