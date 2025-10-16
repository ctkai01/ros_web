const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');
const { config } = require('../../config/database');

// Get current site (default site or user's selected site)
router.get('/current', authenticateToken, async (req, res) => {
    try {
        // For now, return a mock current site
        // TODO: Implement actual logic to get user's current site or default site
        const currentSite = {
            id: 1,
            name: 'Main Site',
            isDefault: true
        };

        console.log('Getting current site:', currentSite);
        
        res.json({
            success: true,
            data: currentSite
        });
    } catch (error) {
        console.error('Error getting current site:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current site',
            error: error.message
        });
    }
});

// Get all sites
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Getting all sites');

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .query(`
                SELECT ID, siteName, isDefault 
                FROM Sites
                ORDER BY siteName
            `);

        console.log(`Found ${result.recordset.length} sites`);
        const sites = result.recordset;
        res.json(sites);
    } catch (error) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }

});

// Get maps for a site
router.get('/:siteId/maps', authenticateToken, async (req, res) => {
    try {
        const siteId = req.params.siteId;
        console.log(`Getting maps for site ID: ${siteId}`);
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('siteId', sql.Int, siteId)
            .query(`
                SELECT m.ID, m.mapName, m.IDSite, m.createdBy
                FROM maps m
                WHERE m.IDSite = @siteId
                ORDER BY m.mapName
            `);

        console.log(`Found ${result.recordset.length} maps for site ${siteId}`);
        const maps = result.recordset;
        res.json(maps);
    } catch (error) {
        console.error('Error fetching maps:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }

});

// Get site by ID
router.get('/:siteId', authenticateToken, async (req, res) => {
    try {
        const siteId = req.params.siteId;
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('siteId', sql.Int, siteId)
            .query(`
                SELECT ID, siteName, IDCurrentMap, isDefault 
                FROM Sites
                WHERE ID = @siteId
            `);

        if (result.recordset.length > 0) {
            const site = result.recordset[0];
            res.json(site);
        } else {
            console.log(`Site ID ${siteId} not found`);
            res.status(404).json({ error: 'Site not found' });
        }
    } catch (error) {
        console.error('Error fetching site details:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }

});

// Create a new site
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { siteName, isDefault } = req.body;
        console.log('Creating new site:', { siteName, isDefault });

        if (!siteName) {
            return res.status(400).json({
                error: 'Site name is required'
            });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // If this site is set as default, unset default for all other sites
            if (isDefault) {
                await transaction.request()
                    .query(`UPDATE Sites SET isDefault = 0`);
            }

            // Insert new site
            const result = await transaction.request()
                .input('siteName', sql.NVarChar, siteName)
                .input('isDefault', sql.Bit, isDefault ? 1 : 0)
                .query(`
                    INSERT INTO Sites (siteName, isDefault)
                    OUTPUT INSERTED.ID
                    VALUES (@siteName, @isDefault)
                `);

            const newSiteId = result.recordset[0].ID;

            await transaction.commit();
            console.log(`New site created with ID: ${newSiteId}`);
            
            res.status(201).json({
                success: true,
                siteId: newSiteId,
                siteName,
                isDefault
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error creating site:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Update site
router.put('/:siteId', authenticateToken, async (req, res) => {
    try {
        const { siteName, isDefault } = req.body;
        const siteId = req.params.siteId;
        console.log(`Updating site ID: ${siteId}`, { siteName, isDefault });

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            if (isDefault) {
                await transaction.request()
                    .input('siteId', sql.Int, siteId)
                    .query(`UPDATE Sites SET isDefault = 0 WHERE ID != @siteId`);
            }

            await transaction.request()
                .input('siteId', sql.Int, siteId)
                .input('siteName', sql.NVarChar, siteName)
                .input('isDefault', sql.Bit, isDefault ? 1 : 0)
                .query(`
                    UPDATE Sites 
                    SET siteName = @siteName,
                        isDefault = @isDefault
                    WHERE ID = @siteId
                `);

            await transaction.commit();
            console.log(`Site ID ${siteId} updated successfully`);
            res.json({ 
                success: true,
                siteId,
                siteName,
                isDefault
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error updating site:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Delete site
router.delete('/:siteId', authenticateToken, async (req, res) => {
    try {
        const siteId = req.params.siteId;
        console.log(`Deleting site ID: ${siteId}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Check if site exists
            const siteCheck = await transaction.request()
                .input('siteId', sql.Int, siteId)
                .query(`SELECT ID FROM Sites WHERE ID = @siteId`);

            if (siteCheck.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Site not found'
                });
            }

            // Delete the site
            await transaction.request()
                .input('siteId', sql.Int, siteId)
                .query(`DELETE FROM Sites WHERE ID = @siteId`);

            await transaction.commit();
            console.log(`Site ID ${siteId} deleted successfully`);
            
            res.json({
                success: true,
                message: 'Site deleted successfully'
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error deleting site:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Set default site
router.put('/:siteId/default', authenticateToken, async (req, res) => {
    const siteId = req.params.siteId;

    try {
        console.log(`Setting site ID ${siteId} as default`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Check if site exists
            const siteCheck = await transaction.request()
                .input('siteId', sql.Int, siteId)
                .query(`SELECT ID, siteName FROM Sites WHERE ID = @siteId`);

            if (siteCheck.recordset.length === 0) {
                console.log(`Site ID ${siteId} not found`);
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Site not found'
                });
            }

            const site = siteCheck.recordset[0];
            console.log(`Found site: ${site.siteName}`);

            // Update all sites to not be default
            await transaction.request()
                .query(`UPDATE Sites SET isDefault = 0`);
            console.log('Reset all sites to non-default');

            // Set the specified site as default
            await transaction.request()
                .input('siteId', sql.Int, siteId)
                .query(`UPDATE Sites SET isDefault = 1 WHERE ID = @siteId`);
            console.log(`Set site ${site.siteName} as default`);

            await transaction.commit();
            console.log('Transaction committed successfully');

            res.json({
                success: true,
                message: 'Default site updated successfully',
                defaultSiteId: siteId,
                siteName: site.siteName
            });

        } catch (err) {
            console.error('Error in transaction:', err);
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Error setting default site:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }

});

module.exports = router; 