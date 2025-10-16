const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');

// Get markers by multiple map IDs
router.post('/by-maps', authenticateToken, async (req, res) => {
    try {
        const { mapIds } = req.body;
        console.log('Fetching markers for map IDs:', mapIds);
        
        if (!mapIds || !Array.isArray(mapIds) || mapIds.length === 0) {
            return res.status(400).json({ error: 'mapIds array is required' });
        }
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        // Tạo query với IN clause
        const placeholders = mapIds.map((_, index) => `@mapId${index}`).join(',');
        const query = `
            SELECT [ID]
                ,[IDMap]
                ,[MarkerName]
                ,[Type]
                ,[Properties]
            FROM [NTURobot].[dbo].[Markers]
            WHERE [IDMap] IN (${placeholders})
            ORDER BY [IDMap], [ID] DESC
        `;

        const request = pool.request();
        mapIds.forEach((mapId, index) => {
            request.input(`mapId${index}`, sql.Int, mapId);
        });

        const result = await request.query(query);

        // Nhóm markers theo mapId
        const markersByMap = {};
        mapIds.forEach(mapId => {
            markersByMap[mapId] = [];
        });

        result.recordset.forEach(marker => {
            if (markersByMap[marker.IDMap]) {
                markersByMap[marker.IDMap].push(marker);
            }
        });

        console.log(`Found markers for ${Object.keys(markersByMap).length} maps`);
        res.json({ data: markersByMap });
    } catch (error) {
        console.error('Error fetching markers by maps:', error);
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

// Get all markers
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching all markers');
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .query(`
                SELECT [ID]
                    ,[IDMap]
                    ,[MarkerName]
                    ,[Type]
                    ,[Properties]
                FROM [NTURobot].[dbo].[Markers]
                ORDER BY [ID] DESC
            `);

        console.log(`Found ${result.recordset.length} markers`);
        const markers = result.recordset;
        res.json(markers);
    } catch (error) {
        console.error('Error fetching markers:', error);
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

// Get markers by map ID (for EditMaps compatibility)
router.get('/:mapId', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching markers for map ID: ${req.params.mapId}`);
    
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const result = await pool.request()
      .input('mapId', sql.Int, req.params.mapId)
      .query(`
        SELECT [ID]
          ,[IDMap]
          ,[MarkerName]
          ,[Type]
          ,[Properties]
        FROM [NTURobot].[dbo].[Markers]
        WHERE [IDMap] = @mapId
        ORDER BY [ID] DESC
      `);

    console.log(`Found ${result.recordset.length} markers for map ${req.params.mapId}`);
    const markers = result.recordset;
    res.json({ markers: markers }); // Return in format expected by EditMaps
  } catch (error) {
    console.error('Error fetching markers by map:', error);
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

// Get markers by map ID (new format)
router.get('/map/:mapId', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching markers for map ID: ${req.params.mapId}`);
    
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const result = await pool.request()
      .input('mapId', sql.Int, req.params.mapId)
      .query(`
        SELECT [ID]
          ,[IDMap]
          ,[MarkerName]
          ,[Type]
          ,[Properties]
        FROM [NTURobot].[dbo].[Markers]
        WHERE [IDMap] = @mapId
        ORDER BY [ID] DESC
      `);

    console.log(`Found ${result.recordset.length} markers for map ${req.params.mapId}`);
    const markers = result.recordset;
    res.json(markers);
  } catch (error) {
    console.error('Error fetching markers by map:', error);
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

// Get marker by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching marker ID: ${req.params.id}`);
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT [ID]
                    ,[IDMap]
                    ,[MarkerName]
                    ,[Type]
                    ,[Properties]
                FROM [NTURobot].[dbo].[Markers]
                WHERE [ID] = @id
            `);

        if (result.recordset.length === 0) {
              return res.status(404).json({ error: 'Marker not found' });
    }

    console.log(`Found marker: ${result.recordset[0].MarkerName}`);
    const marker = result.recordset[0];
    res.json(marker);
  } catch (error) {
    console.error('Error fetching marker:', error);
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

// Create new marker
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { idMap, name, type, properties } = req.body;
    console.log('Creating new marker:', { idMap, name, type, properties });
    
    if (!idMap || !name || type === undefined || !properties) {
      return res.status(400).json({
        error: 'Missing required fields: idMap, name, type, properties'
      });
    }

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    const result = await pool.request()
      .input('idMap', sql.Int, idMap)
      .input('name', sql.VarChar(50), name)
      .input('type', sql.Int, type)
      .input('properties', sql.VarChar(sql.MAX), JSON.stringify(properties))
      .query(`
        INSERT INTO [NTURobot].[dbo].[Markers] (IDMap, MarkerName, Type, Properties)
        VALUES (@idMap, @name, @type, @properties);
        
        SELECT SCOPE_IDENTITY() AS markerId;
      `);

    const newMarkerId = result.recordset[0].markerId;
    console.log(`Marker created successfully with ID: ${newMarkerId}`);
    
    res.json({
      success: true,
      message: 'Marker created successfully',
      markerId: newMarkerId
    });

  } catch (error) {
    console.error('Error creating marker:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update existing marker
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, properties } = req.body;
    console.log(`Updating marker ID: ${id}`, { name, type, properties });
    
    if (type === undefined || !properties) {
      return res.status(400).json({
        error: 'Missing required fields: type, properties'
      });
    }

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.VarChar(50), name)
      .input('type', sql.Int, type)
      .input('properties', sql.VarChar(sql.MAX), JSON.stringify(properties))
      .query(`
        UPDATE [NTURobot].[dbo].[Markers] 
        SET MarkerName = @name, Type = @type, Properties = @properties
        WHERE ID = @id;
        
        SELECT @@ROWCOUNT AS affectedRows;
      `);

    const affectedRows = result.recordset[0].affectedRows;

    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Marker not found'
      });
    }

    console.log(`Marker updated successfully: ${affectedRows} rows affected`);
    res.json({
      success: true,
      message: 'Marker updated successfully'
    });

  } catch (error) {
    console.error('Error updating marker:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Delete marker
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting marker ID: ${id}`);
    
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM [NTURobot].[dbo].[Markers]
        WHERE ID = @id;
        
        SELECT @@ROWCOUNT AS affectedRows;
      `);

    const affectedRows = result.recordset[0].affectedRows;

    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Marker not found'
      });
    }

    console.log(`Marker deleted successfully: ${affectedRows} rows affected`);
    res.json({
      success: true,
      message: 'Marker deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
