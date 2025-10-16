const express = require('express');
const router = express.Router();
const msgpack = require('msgpack-lite');
const sql = require('mssql');

/**
 * GET /api/missions/msgpack/:id
 * Returns specific mission data (with data field) compressed with MessagePack
 */
router.get('/missions/msgpack/:id', async (req, res) => {
    try {
        const missionId = req.params.id;
        console.log(`🔧 Compressing mission ${missionId} data with MessagePack...`);
        const startTime = Date.now();
        
        // Get specific mission data from database
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, missionId)
            .query(`
                SELECT * FROM Missions WHERE ID = @id
            `);
        const mission = result.recordset[0];
        
        if (!mission) {
            return res.status(404).json({ error: 'Mission not found' });
        }
        
        // Compress with MessagePack
        const compressed = msgpack.encode(mission);
        
        const endTime = Date.now();
        const originalSize = JSON.stringify(mission).length;
        const compressedSize = compressed.length;
        const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
        
        console.log(`✅ Mission ${missionId} MessagePack compression completed in ${endTime - startTime}ms`);
        console.log(`📊 Compression stats: ${originalSize} → ${compressedSize} bytes (${ratio}% reduction)`);
        
        // Set headers for binary data
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Length': compressed.length,
            'X-Compression-Type': 'MessagePack',
            'X-Original-Size': originalSize.toString(),
            'X-Compressed-Size': compressedSize.toString(),
            'X-Compression-Ratio': ratio.toString()
        });
        
        res.send(compressed);
        
    } catch (error) {
        console.error('❌ Failed to compress missions data:', error);
        res.status(500).json({ 
            error: 'Failed to compress missions data',
            message: error.message 
        });
    }
});

/**
 * PUT /api/missions/msgpack/:id
 * Update mission data with MessagePack compression
 */
router.put('/missions/msgpack/:id', async (req, res) => {
    try {
        const missionId = req.params.id;
        console.log(`🔧 Updating mission ${missionId} with MessagePack compression...`);
        const startTime = Date.now();
        
        // Get mission data from request body
        const { siteId, missionName, missionGroupId, dataMission } = req.body;
        
        // Get database pool
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Update mission in database
        const result = await pool.request()
            .input('id', sql.Int, missionId)
            .input('siteId', sql.Int, siteId)
            .input('missionName', sql.NVarChar, missionName)
            .input('missionGroupId', sql.Int, missionGroupId)
            .input('dataMission', sql.NVarChar, JSON.stringify(dataMission))
            .query(`
                UPDATE Missions 
                SET IDSite = @siteId, 
                    missionName = @missionName, 
                    groupID = @missionGroupId, 
                    data = @dataMission 
                WHERE ID = @id
            `);
        
        const endTime = Date.now();
        console.log(`✅ Mission ${missionId} updated in ${endTime - startTime}ms`);
        
        res.json({ 
            success: true, 
            message: 'Mission updated successfully',
            updateTime: endTime - startTime
        });
        
    } catch (error) {
        console.error('❌ Failed to update mission:', error);
        res.status(500).json({ 
            error: 'Failed to update mission',
            message: error.message 
        });
    }
});

module.exports = router;
