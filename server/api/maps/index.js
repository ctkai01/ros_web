const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');
const { config } = require('../../config/database');
const { robotCommands } = require('../../config/robotCommands');

// Get maps for a site
router.get('/sites/:siteId/maps', authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching maps for site ID: ${req.params.siteId}`);
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('siteId', sql.Int, req.params.siteId)
            .query(`
                SELECT m.ID, m.mapName, m.IDSite, m.createdBy, m.Info
                FROM maps m
                WHERE m.IDSite = @siteId
            `);

        console.log(`Found ${result.recordset.length} maps for site ${req.params.siteId}`);
        const maps = result.recordset;
        res.json(maps);
    } catch (error) {
        console.error('Error fetching maps:', error);
        // Kiểm tra lỗi cụ thể
        if (error.code === 'ETIMEOUT') {
            return res.status(504).json({
                error: 'Database connection timeout',
                details: error.message
            });
        }
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Database connection refused',
                details: error.message
            });
        }
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Create new map
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { mapName, IDSite, createdBy } = req.body;
        console.log('Creating new map:', { mapName, IDSite, createdBy });

        if (!mapName || !IDSite) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapName', sql.NVarChar, mapName)
            .input('IDSite', sql.Int, IDSite)
            .input('createdBy', sql.NVarChar, createdBy)
            .query(`
                INSERT INTO maps (mapName, IDSite, createdBy)
                VALUES (@mapName, @IDSite, @createdBy);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newMapId = result.recordset[0].ID;
        console.log(`Map created successfully with ID: ${newMapId}`);
        res.json({ success: true, mapId: newMapId });
    } catch (error) {
        console.error('Error creating map:', error);
        if (error.number === 2627) { // SQL Server unique constraint violation
            return res.status(409).json({
                error: 'Map name already exists',
                details: error.message
            });
        }
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Delete map
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.id;
        console.log(`Attempting to delete map ID: ${mapId}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const checkMap = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`SELECT * FROM maps WHERE ID = @mapId`);

        if (checkMap.recordset.length === 0) {
            console.log(`Map ID ${mapId} not found`);
            return res.status(404).json({ message: 'Map not found' });
        }

        await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`DELETE FROM maps WHERE ID = @mapId`);

        console.log(`Map ID ${mapId} deleted successfully`);
        res.json({ message: 'Map deleted successfully' });
    } catch (error) {
        console.error('Error deleting map:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }

});

// Update map basic info (name and site only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.id;
        const { mapName, IDSite } = req.body;
        console.log(`Updating map basic info ID: ${mapId}`, { mapName, IDSite });

        if (!mapId || !mapName || !IDSite) {
            return res.status(400).json({ error: 'Missing required fields: mapName and IDSite are required' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('mapName', sql.NVarChar, mapName)
            .input('IDSite', sql.Int, IDSite)
            .query(`
                UPDATE maps 
                SET mapName = @mapName,
                    IDSite = @IDSite,
                    dateTime = GETDATE()
                WHERE ID = @mapId
            `);

        if (result.rowsAffected[0] === 0) {
            console.log(`Map ID ${mapId} not found or no changes made`);
            return res.status(404).json({ error: 'Map not found' });
        }

        console.log(`Map ID ${mapId} basic info updated successfully`);
        res.json({ message: 'Map updated successfully' });
    } catch (error) {
        console.error('Error updating map basic info:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Update map full data (legacy endpoint for map data updates)
router.put('/:id/data', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.id;
        const { siteId, info, mapData, dateTime } = req.body;
        console.log(`Updating map data ID: ${mapId}`);

        if (!mapId || !siteId || !info || !mapData || !dateTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const infoBuffer = Buffer.from(info);
        const mapDataBuffer = Buffer.from(mapData);

        const request = pool.request();
        request.timeout = 300000;

        request.input('mapId', sql.Int, mapId);
        request.input('siteId', sql.Int, siteId);
        request.input('info', sql.VarBinary(sql.MAX), infoBuffer);
        request.input('mapData', sql.VarBinary(sql.MAX), mapDataBuffer);
        request.input('dateTime', sql.DateTime, dateTime);

        const result = await request.query(`
            UPDATE maps 
            SET Info = @info,
                mapData = @mapData,
                dateTime = @dateTime
            WHERE ID = @mapId AND IDSite = @siteId
        `);

        if (result.rowsAffected[0] === 0) {
            console.log(`Map ID ${mapId} not found or no changes made`);
            return res.status(404).json({ error: 'Map not found' });
        }

        console.log(`Map ID ${mapId} data updated successfully`);
        res.json({ message: 'Map data updated successfully' });
    } catch (error) {
        console.error('Error updating map data:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Load map
router.post('/load/:mapId', authenticateToken, async (req, res) => {
    try {
        const { mapId } = req.params;
        console.log(`Loading map ID: ${mapId}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT m.ID, m.mapName, m.IDSite, m.Info, m.mapData
                FROM maps m
                WHERE m.ID = @mapId
            `);

        if (result.recordset.length === 0) {
            console.log(`Map ID ${mapId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Map not found'
            });
        }

        const mapMetadata = result.recordset[0];
        console.log(`Map ID ${mapId} loaded successfully`);

        res.json({
            success: true,
            data: {
                id: mapMetadata.ID,
                siteId: mapMetadata.IDSite,
                info: mapMetadata.Info,
                mapData: mapMetadata.mapData,
                mapName: mapMetadata.mapName
            }
        });
    } catch (error) {
        console.error('Error loading map:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to load map',
            details: error.message
        });
    }

});

// Get map info (basic information only, no mapData)
router.get('/:mapId/info', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        console.log(`Fetching info for map ID: ${mapId}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT m.ID, m.mapName, m.IDSite, m.createdBy, m.dateTime, m.Info
                FROM maps m
                WHERE m.ID = @mapId
            `);

        if (result.recordset.length === 0) {
            console.log(`Map ID ${mapId} not found`);
            return res.status(404).json({ error: 'Map not found' });
        }

        const mapInfo = result.recordset[0];
        console.log(`Map info fetched successfully for map ID ${mapId}`);
        res.json(mapInfo);
    } catch (error) {
        console.error('Error fetching map info:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Get map metadata
router.get('/:mapId/metadata', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        console.log(`Fetching metadata for map ID: ${mapId}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT m.Info, m.mapData, m.poseData
                FROM maps m
                WHERE m.ID = @mapId
            `);

        if (result.recordset.length === 0) {
            console.log(`Map ID ${mapId} not found`);
            return res.status(404).json({ error: 'Map not found' });
        }

        const mapMetadata = result.recordset[0];
        console.log(`Metadata fetched successfully for map ID ${mapId}`);
        res.json(mapMetadata);
    } catch (error) {
        console.error('Error fetching map metadata:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Save map data
router.post('/save/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        const { siteId, info, mapData, dateTime } = req.body;

        // Validate input
        if (!mapId || !siteId || !info || !mapData || !dateTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Convert info to Buffer
        const infoBuffer = Buffer.from(info);

        // Convert mapData array to proper binary format
        const mapDataBuffer = Buffer.from(mapData);

        // Tạo request với kiểu dữ liệu rõ ràng và timeout dài hơn
        const request = pool.request();
        request.timeout = 300000; // 5 phút cho mỗi request

        request.input('mapId', sql.Int, mapId);
        request.input('siteId', sql.Int, siteId);
        request.input('info', sql.VarBinary(sql.MAX), infoBuffer);
        request.input('mapData', sql.VarBinary(sql.MAX), mapDataBuffer);
        request.input('dateTime', sql.DateTime, dateTime);

        // Execute query với prepared statement
        const result = await request.query(`
            UPDATE maps 
            SET Info = @info,
                mapData = @mapData,
                dateTime = @dateTime
            WHERE ID = @mapId AND IDSite = @siteId
        `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Map not found' });
        }

        res.json({ success: true, message: 'Map updated successfully' + JSON.stringify(req.body) });
    } catch (error) {
        console.error('Error saving map data:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Export map
router.get('/:mapId/export', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT m.mapData, m.Info
                FROM maps m
                WHERE m.ID = @mapId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Map not found' });
        }

        const mapData = result.recordset[0];
        res.json({
            success: true,
            data: {
                mapData: mapData.mapData,
                info: mapData.Info
            }
        });
    } catch (error) {
        console.error('Error exporting map:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Import map
router.post('/import', authenticateToken, async (req, res) => {
    try {
        const { mapName, siteId, mapData, info } = req.body;

        if (!mapName || !siteId || !mapData || !info) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const mapDataBuffer = Buffer.from(mapData);
        const infoBuffer = Buffer.from(info);

        const result = await pool.request()
            .input('mapName', sql.NVarChar, mapName)
            .input('siteId', sql.Int, siteId)
            .input('mapDataBuffer', sql.VarBinary(sql.MAX), mapDataBuffer)
            .input('infoBuffer', sql.VarBinary(sql.MAX), infoBuffer)
            .input('createdBy', sql.NVarChar, req.user.name)
            .query(`
                INSERT INTO maps (mapName, IDSite, mapData, Info, dateTime, createdBy)
                VALUES (@mapName, @siteId, @mapDataBuffer, @infoBuffer, GETDATE(), @createdBy);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newMapId = result.recordset[0].ID;
        res.json({ success: true, mapId: newMapId });
    } catch (error) {
        console.error('Error importing map:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});
// Add Position to map
router.post('/addPosition', authenticateToken, async (req, res) => {
    try {
        const { mapId, pointName, properties } = req.body;
        console.log(`Map created successfully with ID:`, req.body);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('pointName', sql.NVarChar, pointName)
            .input('properties', sql.NVarChar, properties)
            .query(`
                INSERT INTO Point (IDMap, PointName, Properties)
                VALUES (@mapId, @pointName, @properties);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newPositionId = result.recordset[0].ID;
        res.json({ 
            success: true, 
            message: 'Position to map saved successfully',
            positionId: newPositionId
        });
    }
    catch (error) {
        console.error('Error Positon map:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});


// SỬ DỤNG: POST /api/maps/batch/points-by-map
router.post('/batch/points-by-map', authenticateToken, async (req, res) => {
    try {
        const { mapIds } = req.body;

        // Kiểm tra xem mapIds có phải là một mảng hợp lệ không
        if (!Array.isArray(mapIds) || mapIds.length === 0) {
            return res.status(400).json({ success: false, message: 'mapIds must be a non-empty array.' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Tạo một danh sách các tham số cho câu lệnh IN
        const request = pool.request();
        const params = mapIds.map((id, index) => `@id${index}`);
        mapIds.forEach((id, index) => {
            request.input(`id${index}`, sql.Int, id);
        });

        // Sử dụng mệnh đề IN để lấy tất cả các điểm trong một câu lệnh duy nhất
        // QUAN TRỌNG: Lấy cả IDMap để có thể nhóm kết quả lại
        const result = await request.query(`
            SELECT p.ID, p.PointName, p.Properties, p.IDMap
            FROM Point p
            WHERE p.IDMap IN (${params.join(',')})
        `);

        // Nhóm các điểm lại theo mapId
        const pointsByMap = {};
        // Khởi tạo các mảng rỗng cho mỗi mapId
        mapIds.forEach(id => {
            pointsByMap[id] = [];
        });

        // Điền dữ liệu vào các mảng tương ứng
        result.recordset.forEach(point => {
            if (pointsByMap[point.IDMap]) {
                pointsByMap[point.IDMap].push(point);
            }
        });

        res.json({
            success: true,
            data: pointsByMap, // Trả về một đối tượng { "mapId1": [points...], "mapId2": [points...] }
            message: 'Points for multiple maps loaded successfully.'
        });

    } catch (error) {
        console.error('Error loading points for multiple maps:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// load point by map
router.get('/loadPositionbyMap/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT p.ID, p.PointName, p.Properties
                FROM Point p
                WHERE p.IDMap = @mapId
            `);
        const mapPoint = result.recordset;
        res.json(
            {
                success: true,
                data: {
                    mapPoint: mapPoint
                },
                message: 'Load Positon successfully '
            });
        //res.json({success: true, message: 'Load Positon successfully ' });
    }
    catch (error) {
        console.error('Error Load Positon map:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});
// load point by map
router.get('/loadPositions', authenticateToken, async (req, res) => {
    try {
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .query(`
                SELECT ID, PointName, Properties
                FROM Point
            `);
        const mapPoint = result.recordset;
        res.json(mapPoint);
        //res.json({success: true, message: 'Load Positon successfully ' });
    }
    catch (error) {
        console.error('Error Load Positon map:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Get all positions (for transitions)
router.get('/positions', authenticateToken, async (req, res) => {
    try {
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .query(`
                SELECT ID, PointName as positionName, Properties
                FROM Point
                ORDER BY ID
            `);
        
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error loading positions:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});
// Delete position
router.delete('/deletePosition/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete Position ID: ${id}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const checkPosition = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Point WHERE ID = @id`);

        if (checkPosition.recordset.length === 0) {
            console.log(`Position ID ${id} not found`);
            return res.status(404).json({ message: 'Position not found' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Point WHERE ID = @id`);

        console.log(`Position ID ${id} deleted successfully`);
        res.json({ success: true, message: 'Position deleted successfully' });
    } catch (error) {
        console.error('Error deleting Position:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }

});
// load forbiddenZones
router.get('/loadForbiddenZones/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT f.ID, f.ForbiddenName, f.IDMap, f.Properties
                FROM Forbidden f
                WHERE f.IDMap = @mapId
            `);
        const mapForbidden = result.recordset;
        res.json({
            success: true,
            data: {
                mapForbidden: mapForbidden
            },
            message: 'Load Forbidden successfully '
        });
        //res.json({success: true, message: 'Load Positon successfully ' });
    }
    catch (error) {
        console.error('Error load  mapForbidden:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});
// Add ForbiddenZone to map
router.post('/addForbiddenZone', authenticateToken, async (req, res) => {
    try {
        const { mapId, forbiddenZoneName, properties } = req.body;
        console.log(`Forbidden created successfully with ID:`, req.body);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('forbiddenName', sql.VarChar(50), forbiddenZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                INSERT INTO Forbidden (IDMap, ForbiddenName, Properties)
                VALUES (@mapId, @forbiddenName, @properties);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newForbiddenZoneId = result.recordset[0].ID;
        res.json({ 
            success: true, 
            message: 'Forbidden to map saved successfully',
            forbiddenZoneId: newForbiddenZoneId
        });
    }
    catch (error) {
        console.error('Error importing map:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});
// Delete Forbidden
router.delete('/deleteForbiddenZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete ForbiddenZone ID: ${id}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const checkForbiddenZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Forbidden WHERE ID = @id`);

        if (checkForbiddenZone.recordset.length === 0) {
            console.log(`Forbidden ID ${id} not found`);
            return res.status(404).json({ message: 'Forbidden not found' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Forbidden WHERE ID = @id`);

        console.log(`Forbidden ID ${id} deleted successfully`);
        res.json({ success: true, message: 'Forbidden deleted successfully' });
    } catch (error) {
        console.error('Error deleting Forbidden:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }

});
// Add VirtualWall to map
router.post('/addVirtualWall', authenticateToken, async (req, res) => {
    try {
        const { mapId, virtualWallName, properties } = req.body;
        console.log(`VirtualWalls created successfully with ID:`, req.body);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('virtualWallName', sql.VarChar(50), virtualWallName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                INSERT INTO VirtualWall (IDMap, VirtualWallName, Properties)
                VALUES (@mapId, @virtualWallName, @properties);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newVirtualWallId = result.recordset[0].ID;
        res.json({ 
            success: true, 
            message: 'VirtualWall to map saved successfully',
            virtualWallId: newVirtualWallId
        });
    }
    catch (error) {
        console.error('Error VirtualWalls map:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Update VirtualWalls
router.put('/updateVirtualWall/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { virtualWallName, properties } = req.body;

        console.log(`Attempting to update VirtualWall ID: ${id}`, req.body);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if virtual wall exists
        const checkVirtualWall = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM VirtualWall WHERE ID = @id`);

        if (checkVirtualWall.recordset.length === 0) {
            console.log(`VirtualWall ID ${id} not found`);
            return res.status(404).json({ message: 'VirtualWall not found' });
        }

        // Update virtual wall
        await pool.request()
            .input('id', sql.Int, id)
            .input('virtualWallName', sql.VarChar(50), virtualWallName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                UPDATE VirtualWall 
                SET VirtualWallName = @virtualWallName, Properties = @properties
                WHERE ID = @id
            `);

        console.log(`VirtualWall ID ${id} updated successfully`);
        res.json({ success: true, message: 'VirtualWall updated successfully' });
    } catch (error) {
        console.error('Error updating VirtualWall:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }

});

// Delete VirtualWalls
router.delete('/deleteVirtualWall/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete VirtualWall ID: ${id}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const checkVirtualWall = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM VirtualWall WHERE ID = @id`);

        if (checkVirtualWall.recordset.length === 0) {
            console.log(`VirtualWall ID ${id} not found`);
            return res.status(404).json({ message: 'VirtualWall not found' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM VirtualWall WHERE ID = @id`);

        console.log(`VirtualWall ID ${id} deleted successfully`);
        res.json({ success: true, message: 'VirtualWall deleted successfully' });
    } catch (error) {
        console.error('Error deleting VirtualWall:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }

});

// get Virtual Wall
router.get('/getVirtualWalls/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT v.ID, v.VirtualWallName, v.IDMap, v.Properties
                FROM VirtualWall v
                WHERE v.IDMap = @mapId
            `);
        const mapVirtualWall = result.recordset;
        res.json({
            success: true,
            data: {
                mapVirtualWall: mapVirtualWall
            },
            message: 'Load VirtualWall successfully '
        });
        //res.json({success: true, message: 'Load Positon successfully ' });
    }
    catch (error) {
        console.error('Error load  VirtualWall:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Update Forbidden Zone
router.put('/updateForbiddenZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { forbiddenZoneName, properties } = req.body;

        console.log(`Attempting to update ForbiddenZone ID: ${id}`, req.body);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if forbidden zone exists
        const checkForbiddenZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Forbidden WHERE ID = @id`);

        if (checkForbiddenZone.recordset.length === 0) {
            console.log(`ForbiddenZone ID ${id} not found`);
            return res.status(404).json({ message: 'ForbiddenZone not found' });
        }

        // Update forbidden zone
        await pool.request()
            .input('id', sql.Int, id)
            .input('forbiddenName', sql.VarChar(50), forbiddenZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                UPDATE Forbidden 
                SET ForbiddenName = @forbiddenName, Properties = @properties
                WHERE ID = @id
            `);

        console.log(`ForbiddenZone ID ${id} updated successfully`);
        res.json({ success: true, message: 'ForbiddenZone updated successfully' });
    } catch (error) {
        console.error('Error updating ForbiddenZone:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }

});

// ===== PREFERRED ZONE APIs =====

// load preferredZones
router.get('/loadPreferredZones/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT p.ID, p.PreferredName, p.IDMap, p.Properties
                FROM Preferred p
                WHERE p.IDMap = @mapId
            `);

        const mapPreferred = result.recordset;
        console.log(`Load Preferred successfully for map ID: ${mapId}`);
        res.json({
            success: true,
            data: {
                mapPreferred: mapPreferred
            },
            message: 'Load Preferred successfully '
        });
    } catch (error) {
        console.error('Error load  mapPreferred:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Add PreferredZone to map
router.post('/addPreferredZone', authenticateToken, async (req, res) => {
    try {
        const { mapId, preferredZoneName, properties } = req.body;
        console.log(`Preferred created successfully with ID:`, req.body);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('preferredName', sql.VarChar(50), preferredZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                INSERT INTO Preferred (IDMap, PreferredName, Properties)
                VALUES (@mapId, @preferredName, @properties);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newPreferredZoneId = result.recordset[0].ID;
        console.log(`PreferredZone created successfully with ID: ${newPreferredZoneId}`);
        res.json({
            success: true,
            message: 'Preferred to map saved successfully',
            preferredZoneId: newPreferredZoneId
        });
    } catch (error) {
        console.error('Error creating PreferredZone:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Delete Preferred
router.delete('/deletePreferredZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete PreferredZone ID: ${id}`);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if preferred zone exists
        const checkPreferredZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Preferred WHERE ID = @id`);

        if (checkPreferredZone.recordset.length === 0) {
            console.log(`Preferred ID ${id} not found`);
            return res.status(404).json({ message: 'Preferred not found' });
        }

        // Delete preferred zone
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Preferred WHERE ID = @id`);

        console.log(`Preferred ID ${id} deleted successfully`);
        res.json({ success: true, message: 'Preferred deleted successfully' });
    } catch (error) {
        console.error('Error deleting Preferred:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Update Preferred Zone
router.put('/updatePreferredZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { preferredZoneName, properties } = req.body;

        console.log(`Attempting to update PreferredZone ID: ${id}`, req.body);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if preferred zone exists
        const checkPreferredZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Preferred WHERE ID = @id`);

        if (checkPreferredZone.recordset.length === 0) {
            console.log(`PreferredZone ID ${id} not found`);
            return res.status(404).json({ message: 'PreferredZone not found' });
        }

        // Update preferred zone
        await pool.request()
            .input('id', sql.Int, id)
            .input('preferredName', sql.VarChar(50), preferredZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                UPDATE Preferred
                SET PreferredName = @preferredName, Properties = @properties
                WHERE ID = @id
            `);

        console.log(`PreferredZone ID ${id} updated successfully`);
        res.json({ success: true, message: 'PreferredZone updated successfully' });
    } catch (error) {
        console.error('Error updating PreferredZone:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// ===== UNPREFERRED ZONE APIs =====

// load unpreferredZones
router.get('/loadUnpreferredZones/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT u.ID, u.UnpreferredName, u.IDMap, u.Properties
                FROM Unpreferred u
                WHERE u.IDMap = @mapId
            `);

        const mapUnpreferred = result.recordset;
        console.log(`Load Unpreferred successfully for map ID: ${mapId}`);
        res.json({
            success: true,
            data: {
                mapUnpreferred: mapUnpreferred
            },
            message: 'Load Unpreferred successfully '
        });
    } catch (error) {
        console.error('Error load  mapUnpreferred:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Add UnpreferredZone to map
router.post('/addUnpreferredZone', authenticateToken, async (req, res) => {
    try {
        const { mapId, unpreferredZoneName, properties } = req.body;
        console.log(`Unpreferred created successfully with ID:`, req.body);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('unpreferredName', sql.VarChar(50), unpreferredZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                INSERT INTO Unpreferred (IDMap, UnpreferredName, Properties)
                VALUES (@mapId, @unpreferredName, @properties);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newUnpreferredZoneId = result.recordset[0].ID;
        console.log(`UnpreferredZone created successfully with ID: ${newUnpreferredZoneId}`);
        res.json({
            success: true,
            message: 'Unpreferred to map saved successfully',
            unpreferredZoneId: newUnpreferredZoneId
        });
    } catch (error) {
        console.error('Error creating UnpreferredZone:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Delete Unpreferred
router.delete('/deleteUnpreferredZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete UnpreferredZone ID: ${id}`);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if unpreferred zone exists
        const checkUnpreferredZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Unpreferred WHERE ID = @id`);

        if (checkUnpreferredZone.recordset.length === 0) {
            console.log(`Unpreferred ID ${id} not found`);
            return res.status(404).json({ message: 'Unpreferred not found' });
        }

        // Delete unpreferred zone
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Unpreferred WHERE ID = @id`);

        console.log(`Unpreferred ID ${id} deleted successfully`);
        res.json({ success: true, message: 'Unpreferred deleted successfully' });
    } catch (error) {
        console.error('Error deleting Unpreferred:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Update Unpreferred Zone
router.put('/updateUnpreferredZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { unpreferredZoneName, properties } = req.body;

        console.log(`Attempting to update UnpreferredZone ID: ${id}`, req.body);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if unpreferred zone exists
        const checkUnpreferredZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Unpreferred WHERE ID = @id`);

        if (checkUnpreferredZone.recordset.length === 0) {
            console.log(`UnpreferredZone ID ${id} not found`);
            return res.status(404).json({ message: 'UnpreferredZone not found' });
        }

        // Update unpreferred zone
        await pool.request()
            .input('id', sql.Int, id)
            .input('unpreferredName', sql.VarChar(50), unpreferredZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                UPDATE Unpreferred
                SET UnpreferredName = @unpreferredName, Properties = @properties
                WHERE ID = @id
            `);

        console.log(`UnpreferredZone ID ${id} updated successfully`);
        res.json({ success: true, message: 'UnpreferredZone updated successfully' });
    } catch (error) {
        console.error('Error updating UnpreferredZone:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// ===== CRITICAL ZONE APIs =====

// load criticalZones
router.get('/loadCriticalZones/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT c.ID, c.CriticalName, c.IDMap, c.Properties
                FROM Critical c
                WHERE c.IDMap = @mapId
            `);

        const mapCritical = result.recordset;
        console.log(`Load Critical successfully for map ID: ${mapId}`);
        res.json({
            success: true,
            data: {
                mapCritical: mapCritical
            },
            message: 'Load Critical successfully '
        });
    } catch (error) {
        console.error('Error load  mapCritical:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Add CriticalZone to map
router.post('/addCriticalZone', authenticateToken, async (req, res) => {
    try {
        const { mapId, criticalZoneName, properties } = req.body;
        console.log(`Critical created successfully with ID:`, req.body);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('criticalName', sql.VarChar(50), criticalZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                INSERT INTO Critical (IDMap, CriticalName, Properties)
                VALUES (@mapId, @criticalName, @properties);
                SELECT SCOPE_IDENTITY() AS ID;
            `);

        const newCriticalZoneId = result.recordset[0].ID;
        console.log(`CriticalZone created successfully with ID: ${newCriticalZoneId}`);
        res.json({
            success: true,
            message: 'Critical to map saved successfully',
            criticalZoneId: newCriticalZoneId
        });
    } catch (error) {
        console.error('Error creating CriticalZone:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Delete Critical
router.delete('/deleteCriticalZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete CriticalZone ID: ${id}`);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if critical zone exists
        const checkCriticalZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Critical WHERE ID = @id`);

        if (checkCriticalZone.recordset.length === 0) {
            console.log(`Critical ID ${id} not found`);
            return res.status(404).json({ message: 'Critical not found' });
        }

        // Delete critical zone
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Critical WHERE ID = @id`);

        console.log(`Critical ID ${id} deleted successfully`);
        res.json({ success: true, message: 'Critical deleted successfully' });
    } catch (error) {
        console.error('Error deleting Critical:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Update Critical Zone
router.put('/updateCriticalZone/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { criticalZoneName, properties } = req.body;

        console.log(`Attempting to update CriticalZone ID: ${id}`, req.body);

        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if critical zone exists
        const checkCriticalZone = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Critical WHERE ID = @id`);

        if (checkCriticalZone.recordset.length === 0) {
            console.log(`CriticalZone ID ${id} not found`);
            return res.status(404).json({ message: 'CriticalZone not found' });
        }

        // Update critical zone
        await pool.request()
            .input('id', sql.Int, id)
            .input('criticalName', sql.VarChar(50), criticalZoneName)
            .input('properties', sql.VarChar(sql.MAX), properties)
            .query(`
                UPDATE Critical
                SET CriticalName = @criticalName, Properties = @properties
                WHERE ID = @id
            `);

        console.log(`CriticalZone ID ${id} updated successfully`);
        res.json({ success: true, message: 'CriticalZone updated successfully' });
    } catch (error) {
        console.error('Error updating CriticalZone:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }
});

// Change current map for a site
router.put('/:mapId/setCurrent', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        const { siteId } = req.body;

        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: 'Site ID is required'
            });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // First, verify that the map exists and belongs to the site
        const mapCheck = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('siteId', sql.Int, siteId)
            .query(`
                SELECT ID, mapName, IDSite 
                FROM maps 
                WHERE ID = @mapId AND IDSite = @siteId
            `);

        if (mapCheck.recordset.length === 0) {
            console.log(`Map ID ${mapId} not found or doesn't belong to site ${siteId}`);
            return res.status(404).json({
                success: false,
                error: 'Map not found or doesn\'t belong to the specified site'
            });
        }

        // Update the site's current map
        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .input('siteId', sql.Int, siteId)
            .query(`
                UPDATE Sites 
                SET IDCurrentMap = @mapId
                WHERE ID = @siteId
            `);

        if (result.rowsAffected[0] === 0) {
            console.log(`Site ID ${siteId} not found`);
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }

        console.log(`Current map set successfully to map ID: ${mapId} for site ID: ${siteId}`);
        res.json({
            success: true,
            message: 'Current map set successfully',
            data: {
                siteId: siteId,
                mapId: mapId,
                mapName: mapCheck.recordset[0].mapName
            }
        });
    } catch (error) {
        console.error('Error setting current map:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Update current map ID (can be -1 to indicate no current map)
router.post('/update-current-map', authenticateToken, async (req, res) => {
    try {
        const { siteId, currentMapId } = req.body;

        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: 'Site ID is required'
            });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Update the site's current map ID
        const result = await pool.request()
            .input('currentMapId', sql.Int, currentMapId)
            .input('siteId', sql.Int, siteId)
            .query(`
                UPDATE Sites 
                SET IDCurrentMap = @currentMapId
                WHERE ID = @siteId
            `);

        if (result.rowsAffected[0] === 0) {
            console.log(`Site ID ${siteId} not found`);
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }

        console.log(`Current map ID updated to ${currentMapId} for site ID: ${siteId}`);
        res.json({
            success: true,
            message: 'Current map ID updated successfully',
            data: {
                siteId: siteId,
                currentMapId: currentMapId
            }
        });
    } catch (error) {
        console.error('Error updating current map ID:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get current site ID
router.get('/getCurrentSiteId', authenticateToken, async (req, res) => {
    try {
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Get the default site (isDefault = 1) or the first site
        const result = await pool.request()
            .query(`
                SELECT TOP 1 ID, siteName, IDCurrentMap, isDefault
                FROM Sites
                WHERE isDefault = 1
                ORDER BY ID
            `);

        if (result.recordset.length > 0) {
            const site = result.recordset[0];
            res.json({
                success: true,
                data: site.ID
            });
        } else {
            // If no default site, get the first site
            const fallbackResult = await pool.request()
                .query(`
                    SELECT TOP 1 ID, siteName, IDCurrentMap, isDefault
                    FROM Sites
                    ORDER BY ID
                `);

            if (fallbackResult.recordset.length > 0) {
                const site = fallbackResult.recordset[0];
                res.json({
                    success: true,
                    data: site.ID
                });
            } else {
                console.log('No sites found in database');
                res.status(404).json({
                    success: false,
                    error: 'No sites found in database'
                });
            }
        }
    } catch (error) {
        console.error('Error getting current site ID:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        // Fallback to default site ID if database error
        console.warn('Database error, returning default site ID: 1');
        res.json({
            success: true,
            data: 1 // Default site ID
        });
    }

});

// Get current map ID for a site
router.get('/getCurrentMapId/:siteId', authenticateToken, async (req, res) => {
    // KHÔNG CẦN: let connection;
    try {
        const siteId = req.params.siteId;

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            // Trả về lỗi 503 Service Unavailable nếu pool chưa sẵn sàng
            return res.status(503).json({ success: false, error: 'Database service is unavailable.' });
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
            res.json({
                success: true,
                data: {
                    siteId: site.ID,
                    mapId: site.IDCurrentMap,
                    siteName: site.siteName,
                    isDefault: site.isDefault
                }
            });
        } else {
            console.log(`Site ID ${siteId} not found`);
            res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
    } catch (error) {
        console.error('Error getting current map ID:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Update position
router.put('/updatePosition/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { pointName, pointType, properties } = req.body;

        console.log(`Attempting to update Position ID: ${id}`, req.body);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Check if position exists
        const checkPosition = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Point WHERE ID = @id`);

        if (checkPosition.recordset.length === 0) {
            console.log(`Position ID ${id} not found`);
            return res.status(404).json({ message: 'Position not found' });
        }

        // Update position
        await pool.request()
            .input('id', sql.Int, id)
            .input('pointName', sql.NVarChar, pointName)
            .input('properties', sql.NVarChar, properties)
            .query(`
                UPDATE Point 
                SET PointName = @pointName, Properties = @properties
                WHERE ID = @id
            `);

        console.log(`Position ID ${id} updated successfully`);
        res.json({ success: true, message: 'Position updated successfully' });
    } catch (error) {
        console.error('Error updating Position:', error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message
        });
    }

});
// get id of site from map id
router.get('/getSiteIdFromMapId/:mapId', authenticateToken, async (req, res) => {
    try {
        const mapId = req.params.mapId;
        console.log(`Getting site ID from map ID: ${mapId}`);

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('mapId', sql.Int, mapId)
            .query(`
                SELECT IDSite, mapName FROM maps WHERE ID = @mapId
            `);

        if (result.recordset.length > 0) {
            const siteId = result.recordset[0].IDSite;
            const mapName = result.recordset[0].mapName;
            console.log(`Site ID found for map ID ${mapId}: ${siteId}`);
            res.json({
                success: true,
                data: {
                    siteId: siteId,
                    mapName: mapName
                }
            });
        } else {
            console.log(`No site ID found for map ID ${mapId}`);
            res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
    } catch (error) {
        console.error('Error getting site ID from map ID:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }

});

// SỬ DỤNG: POST /api/maps/batch/markers-by-map
router.post('/batch/markers-by-map', authenticateToken, async (req, res) => {
    try {
        const { mapIds } = req.body;

        // Kiểm tra xem mapIds có phải là một mảng hợp lệ không
        if (!Array.isArray(mapIds) || mapIds.length === 0) {
            return res.status(400).json({ success: false, message: 'mapIds must be a non-empty array.' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Tạo một danh sách các tham số cho câu lệnh IN
        const request = pool.request();
        const params = mapIds.map((id, index) => `@id${index}`);
        mapIds.forEach((id, index) => {
            request.input(`id${index}`, sql.Int, id);
        });

        // Sử dụng mệnh đề IN để lấy tất cả các markers trong một câu lệnh duy nhất
        // QUAN TRỌNG: Lấy cả IDMap để có thể nhóm kết quả lại
        const markersTable = config.engine === 'mysql' ? 'Markers' : '[NTURobot].[dbo].[Markers]';
        const result = await request.query(`
            SELECT m.ID, m.MarkerName, m.Properties, m.IDMap, m.Type
            FROM ${markersTable} m
            WHERE m.IDMap IN (${params.join(',')})
        `);

        // Nhóm các markers lại theo mapId
        const markersByMap = {};
        // Khởi tạo các mảng rỗng cho mỗi mapId
        mapIds.forEach(id => {
            markersByMap[id] = [];
        });

        // Điền dữ liệu vào các mảng tương ứng
        result.recordset.forEach(marker => {
            if (markersByMap[marker.IDMap]) {
                markersByMap[marker.IDMap].push(marker);
            }
        });

        res.json({
            success: true,
            data: markersByMap, // Trả về một đối tượng { "mapId1": [markers...], "mapId2": [markers...] }
            message: 'Markers for multiple maps loaded successfully.'
        });

    } catch (error) {
        console.error('Error loading markers for multiple maps:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }

});

// API mới: GET markers cho dialog (chỉ lấy maps có markers)
router.get('/dialog/markers', authenticateToken, async (req, res) => {
    try {
        const { siteId } = req.query;
        
        if (!siteId) {
            return res.status(400).json({ success: false, message: 'siteId is required.' });
        }

        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Lấy maps có markers trong một query duy nhất
        const markersTable = config.engine === 'mysql' ? 'Markers' : '[NTURobot].[dbo].[Markers]';
        const result = await pool.request()
            .input('siteId', sql.Int, siteId)
            .query(`
                SELECT DISTINCT 
                    m.ID as MapID, 
                    m.mapName,
                    mk.ID as MarkerID, 
                    mk.MarkerName, 
                    mk.Type
                FROM maps m
                INNER JOIN ${markersTable} mk ON m.ID = mk.IDMap
                WHERE m.IDSite = @siteId
                ORDER BY m.mapName, mk.MarkerName
            `);

        // Nhóm markers theo map
        const markersByMap = {};
        result.recordset.forEach(row => {
            const mapId = row.MapID;
            if (!markersByMap[mapId]) {
                markersByMap[mapId] = {
                    mapName: row.mapName,
                    markers: []
                };
            }
            markersByMap[mapId].markers.push({
                id: row.MarkerID,
                name: row.MarkerName,
                type: row.Type
            });
        });

        res.json({
            success: true,
            data: markersByMap,
            message: 'Markers for dialog loaded successfully.'
        });

    } catch (error) {
        console.error('Error loading markers for dialog:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Upload map files (ZIP)
router.post('/upload', authenticateToken, async (req, res) => {
    try {
        // Parse multipart form data using multer
        const multer = require('multer');
        const upload = multer().fields([
            { name: 'mapId', maxCount: 1 },
            { name: 'pgmData', maxCount: 1 },
            { name: 'yamlData', maxCount: 1 },
            { name: 'poseData', maxCount: 1 }
        ]);
        
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: 'File upload error' });
            }

            try {
                const mapId = req.body.mapId;
                
                if (!mapId) {
                    return res.status(400).json({ success: false, message: 'mapId is required' });
                }

                // SỬ DỤNG POOL TỪ REQUEST
                const pool = req.pool;
                if (!pool.connected) {
                    return res.status(503).json({ error: 'Database service is unavailable.' });
                }

                // Check if map exists
                const mapCheck = await pool.request()
                    .input('mapId', sql.Int, mapId)
                    .query('SELECT ID FROM maps WHERE ID = @mapId');

                if (mapCheck.recordset.length === 0) {
                    return res.status(404).json({ success: false, message: 'Map not found' });
                }

                const files = req.files;
                if (!files || !files.pgmData || !files.yamlData || !files.poseData) {
                    return res.status(400).json({ success: false, message: 'Missing required files: PGM, YAML, or PBSTREAM' });
                }

                const pgmData = files.pgmData[0].buffer;
                const yamlData = files.yamlData[0].buffer;
                const poseData = files.poseData[0].buffer;

                // Update map in database
                const result = await pool.request()
                    .input('mapId', sql.Int, mapId)
                    .input('mapData', sql.VarBinary(sql.MAX), pgmData)
                    .input('info', sql.VarBinary(sql.MAX), yamlData)
                    .input('poseData', sql.VarBinary(sql.MAX), poseData)
                    .input('dateTime', sql.DateTime2, new Date())
                    .query(`
                        UPDATE maps 
                        SET mapData = @mapData, Info = @info, poseData = @poseData, dateTime = @dateTime
                        WHERE ID = @mapId
                    `);

                res.json({
                    success: true,
                    message: 'Map uploaded successfully'
                });

            } catch (error) {
                console.error('Error uploading map:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    details: error.message
                });
            }
        });

    } catch (error) {
        console.error('Error in upload endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            details: error.message
        });
    }
});

module.exports = router; 