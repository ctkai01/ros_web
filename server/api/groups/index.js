const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');
const { config } = require('../../config/database');

// Get all groups
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Getting all groups');

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .query(`
                SELECT ID, groupName
                FROM Groups
                ORDER BY ID
            `);

        console.log(`Found ${result.recordset.length} groups`);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }

});

// Get group by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Getting group details for ID: ${id}`);
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT ID, groupName
                FROM Groups
                WHERE ID = @id
            `);

        if (result.recordset.length === 0) {
            console.log(`Group ID ${id} not found`);
            return res.status(404).json({ error: 'Group not found' });
        }

        const group = result.recordset[0];
        console.log('Group found:', group);
        res.json(group);
    } catch (error) {
        console.error('Error fetching group details:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Create new group
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { groupName } = req.body;
        console.log('Creating new group:', { groupName });

        // Validate required fields
        if (!groupName || groupName.trim() === '') {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check for duplicate group name
        const checkResult = await pool.request()
            .input('groupName', sql.NVarChar, groupName.trim())
            .query(`
                SELECT ID FROM Groups 
                WHERE groupName = @groupName
            `);

        if (checkResult.recordset.length > 0) {
            return res.status(409).json({ error: 'Group name already exists' });
        }

        // Insert new group
        const result = await pool.request()
            .input('groupName', sql.NVarChar, groupName.trim())
            .query(`
                INSERT INTO Groups (groupName)
                OUTPUT INSERTED.ID, INSERTED.groupName
                VALUES (@groupName)
            `);

        const newGroup = result.recordset[0];
        console.log('Group created successfully:', newGroup);
        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Update group
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { groupName } = req.body;
        console.log(`Updating group ID ${id}:`, { groupName });

        // Validate required fields
        if (!groupName || groupName.trim() === '') {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // Check if group ID <= 12 (protected groups)
        if (parseInt(id) <= 12) {
            return res.status(403).json({ error: 'Cannot modify protected groups (ID <= 12)' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if group exists
        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT ID FROM Groups 
                WHERE ID = @id
            `);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check for duplicate group name (excluding current group)
        const duplicateResult = await pool.request()
            .input('groupName', sql.NVarChar, groupName.trim())
            .input('id', sql.Int, id)
            .query(`
                SELECT ID FROM Groups 
                WHERE groupName = @groupName AND ID != @id
            `);

        if (duplicateResult.recordset.length > 0) {
            return res.status(409).json({ error: 'Group name already exists' });
        }

        // Update group
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('groupName', sql.NVarChar, groupName.trim())
            .query(`
                UPDATE Groups 
                SET groupName = @groupName
                OUTPUT INSERTED.ID, INSERTED.groupName
                WHERE ID = @id
            `);

        const updatedGroup = result.recordset[0];
        console.log('Group updated successfully:', updatedGroup);
        res.json(updatedGroup);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Delete group
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Deleting group ID: ${id}`);

        // Check if group ID <= 12 (protected groups)
        if (parseInt(id) <= 12) {
            return res.status(403).json({ error: 'Cannot delete protected groups (ID <= 12)' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if group exists
        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT ID FROM Groups 
                WHERE ID = @id
            `);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Delete group
        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM Groups 
                WHERE ID = @id
            `);

        console.log(`Group ID ${id} deleted successfully`);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

module.exports = router; 