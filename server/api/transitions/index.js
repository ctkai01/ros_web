const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { SERVER_CONFIG } = require('../../config/serverConfig');

// GET mapping data for transitions
router.get('/mapping', async (req, res) => {
    try {
        console.log('Transitions mapping API called');
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Get all sites with their maps and points
        const sitesQuery = `
            SELECT 
                s.ID as siteId,
                s.siteName,
                m.ID as mapId,
                m.mapName,
                p.ID as pointId,
                p.PointName as pointName
            FROM Sites s
            LEFT JOIN maps m ON s.ID = m.IDSite
            LEFT JOIN Point p ON m.ID = p.IDMap
            ORDER BY s.ID, m.ID, p.ID
        `;

        // Get all missions with their site information
        const missionsQuery = `
            SELECT 
                m.ID as missionId,
                m.missionName,
                m.IDSite as siteId
            FROM Missions m
            ORDER BY m.IDSite, m.ID
        `;

        const [sitesResult, missionsResult] = await Promise.all([
            pool.request().query(sitesQuery),
            pool.request().query(missionsQuery)
        ]);

        // Organize data for easy lookup
        const mappingData = {
            sites: {}
        };

        // Process sites data
        sitesResult.recordset.forEach(row => {
            if (!mappingData.sites[row.siteId]) {
                mappingData.sites[row.siteId] = {
                    id: row.siteId,
                    name: row.siteName,
                    maps: {}
                };
            }
            
            if (row.mapId && !mappingData.sites[row.siteId].maps[row.mapId]) {
                mappingData.sites[row.siteId].maps[row.mapId] = {
                    id: row.mapId,
                    name: row.mapName,
                    points: {}
                };
            }
            
            if (row.pointId && row.mapId) {
                mappingData.sites[row.siteId].maps[row.mapId].points[row.pointId] = {
                    id: row.pointId,
                    name: row.pointName
                };
            }
        });

        // Process missions data - organize by site
        missionsResult.recordset.forEach(row => {
            const siteId = row.siteId;
            
            // Initialize missions object for this site if it doesn't exist
            if (!mappingData.sites[siteId]) {
                mappingData.sites[siteId] = {
                    id: siteId,
                    name: `Site ${siteId}`, // Fallback name
                    maps: {},
                    missions: {}
                };
            }
            
            if (!mappingData.sites[siteId].missions) {
                mappingData.sites[siteId].missions = {};
            }
            
            mappingData.sites[siteId].missions[row.missionId] = {
                id: row.missionId,
                name: row.missionName
            };
        });

        res.json(mappingData);
    } catch (error) {
        console.error('Error fetching transitions mapping:', error);
        res.status(500).json({ error: 'Failed to fetch transitions mapping' });
    }
});

// GET all transitions
router.get('/', async (req, res) => {

    console.log('Transitions API called');
    try {

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .query(`
                SELECT * FROM Transitions
                  ORDER BY [ID] DESC
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching transitions:', error);
        res.status(500).json({ error: 'Failed to fetch transitions' });
    }
});

// GET single transition by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.pool;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT [ID]
                      ,[SiteID]
                      ,[StartPositionID]
                      ,[GoalPositionID]
                      ,[MissionID]
                      ,[CreatedBy]
                      ,[DateTime]
                  FROM [NTURobot].[dbo].[Transitions]
                  WHERE [ID] = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Transition not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching transition:', error);
        res.status(500).json({ error: 'Failed to fetch transition' });
    }
});

// POST create new transition
router.post('/', async (req, res) => {
    try {
        const { SiteID, StartPositionID, GoalPositionID, MissionID, CreatedBy } = req.body;
        
        // Validate required fields
        if (!SiteID || !StartPositionID || !GoalPositionID || !MissionID) {
            return res.status(400).json({ 
                error: 'Missing required fields: SiteID, StartPositionID, GoalPositionID, MissionID' 
            });
        }
        
        // Validate that start and goal positions are different
        if (StartPositionID === GoalPositionID) {
            return res.status(400).json({ 
                error: 'Start position and goal position cannot be the same' 
            });
        }
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        // Check if transition already exists
        const existingTransition = await pool.request()
            .input('SiteID', sql.Int, SiteID)
            .input('StartPositionID', sql.Int, StartPositionID)
            .input('GoalPositionID', sql.Int, GoalPositionID)
            .input('MissionID', sql.Int, MissionID)
            .query(`
                SELECT ID FROM [NTURobot].[dbo].[Transitions]
                WHERE SiteID = @SiteID 
                AND StartPositionID = @StartPositionID 
                AND GoalPositionID = @GoalPositionID 
                AND MissionID = @MissionID
            `);
        
        if (existingTransition.recordset.length > 0) {
            return res.status(409).json({ 
                error: 'Transition already exists with the same configuration' 
            });
        }
        
        const result = await pool.request()
            .input('SiteID', sql.Int, SiteID)
            .input('StartPositionID', sql.Int, StartPositionID)
            .input('GoalPositionID', sql.Int, GoalPositionID)
            .input('MissionID', sql.Int, MissionID)
            .input('CreatedBy', sql.NVarChar, CreatedBy || 'Unknown')
            .query(`
                INSERT INTO [NTURobot].[dbo].[Transitions]
                       ([SiteID]
                       ,[StartPositionID]
                       ,[GoalPositionID]
                       ,[MissionID]
                       ,[CreatedBy]
                       ,[DateTime])
                 VALUES
                       (@SiteID
                       ,@StartPositionID
                       ,@GoalPositionID
                       ,@MissionID
                       ,@CreatedBy
                       ,GETDATE());
                
                SELECT SCOPE_IDENTITY() AS ID;
            `);
        
        const newId = result.recordset[0].ID;
        res.status(201).json({ 
            success: true, 
            message: 'Transition created successfully',
            id: newId 
        });
    } catch (error) {
        console.error('Error creating transition:', error);
        res.status(500).json({ error: 'Failed to create transition' });
    }
});

// PUT update transition
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { SiteID, StartPositionID, GoalPositionID, MissionID, CreatedBy } = req.body;
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('SiteID', sql.Int, SiteID)
            .input('StartPositionID', sql.Int, StartPositionID)
            .input('GoalPositionID', sql.Int, GoalPositionID)
            .input('MissionID', sql.Int, MissionID)
            .input('CreatedBy', sql.NVarChar, CreatedBy)
            .query(`
                UPDATE [NTURobot].[dbo].[Transitions]
                   SET [SiteID] = @SiteID
                      ,[StartPositionID] = @StartPositionID
                      ,[GoalPositionID] = @GoalPositionID
                      ,[MissionID] = @MissionID
                      ,[CreatedBy] = @CreatedBy
                 WHERE [ID] = @id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Transition not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Transition updated successfully' 
        });
    } catch (error) {
        console.error('Error updating transition:', error);
        res.status(500).json({ error: 'Failed to update transition' });
    }
});

// DELETE transition
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
                DELETE FROM [NTURobot].[dbo].[Transitions]
                WHERE [ID] = @id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Transition not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Transition deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting transition:', error);
        res.status(500).json({ error: 'Failed to delete transition' });
    }
});

module.exports = router;
