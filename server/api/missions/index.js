const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');
const { config } = require('../../config/database');
const { robotCommands } = require('../../config/robotCommands');

// Import mission log subscriber
const { getMissionLogs, clearMissionLogs, LOG_LEVELS } = require('../../subscribers/missionLogSubscriber');
// Import mission status subscriber
const { getCurrentMissionQueueStatus } = require('../../subscribers/missionQueueStatusSubscriber');
// Import ROS connection
const rosConnection = require('../../shared/rosConnection');


router.get('/site/:id', async (req, res) => {
  try {
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const result = await pool.request()
      .input('siteId', sql.Int, req.params.id)
      .query(`
        SELECT ID, IDSite, missionName, groupID, description FROM Missions
        WHERE IDSite = @siteId
      `);
    res.json(result.recordset);
  } catch (error) {
    res.json({ message: 'Missions API' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});
// get mission by id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM Missions WHERE ID = @id
      `);

    if (result.recordset.length === 0) {
      console.log(`Mission ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Mission not found'
      });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    res.json({ message: 'Missions API' });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

router.get('/list/:id', async (req, res) => {
  try {
    const siteId = req.params.id;
    console.log('siteId', siteId);
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    const result = await pool.request()
      .input('siteId', sql.Int, req.params.id)
      .query(`
                SELECT ID, missionName, groupID, description FROM Missions WHERE IDSite = @siteId
      `);
    res.json(result.recordset);
  } catch (error) {
    res.json({ message: 'Missions API' });
  }
});

// Save missions to map
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { siteId, missionName, missionGroupId, dataMission, description } = req.body;

    console.log('🔄 CreateMission API called with:', req.body);

    // Validate required fields
    if (!siteId || !missionName || !missionGroupId) {
      console.log('❌ Missing required fields:', { siteId, missionName, missionGroupId });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'siteId, missionName, and missionGroupId are required'
      });
    }

    console.log('✅ All required fields present');

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    // Insert with data field (default to empty array if not provided)
    const result = await pool.request()
      .input('siteId', sql.Int, siteId)
      .input('missionName', sql.NVarChar, missionName)
      .input('missionGroupId', sql.Int, missionGroupId)
      .input('dataMission', sql.NVarChar, dataMission || '[]')
      .input('description', sql.NVarChar, description || '')
      .query(`
        INSERT INTO Missions (IDSite, missionName, groupID, data, description)
        VALUES (@siteId, @missionName, @missionGroupId, @dataMission, @description);
        SELECT SCOPE_IDENTITY() AS ID;
      `);

    const newMissionId = result.recordset[0].ID;
    console.log('✅ Mission created successfully with ID:', newMissionId);

    res.json({
      success: true,
      message: 'Mission created successfully',
      missionId: newMissionId
    });
  }
  catch (error) {
    console.error('❌ Error creating mission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Create mission for specific site
router.post('/site/:siteId', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;
    const { missionName, missionGroupId, dataMission, description } = req.body;

    console.log('🔄 CreateMission API called for site:', siteId, 'with data:', req.body);

    // Validate required fields
    if (!missionName || !missionGroupId) {
      console.log('❌ Missing required fields:', { missionName, missionGroupId });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'missionName and missionGroupId are required'
      });
    }

    console.log('✅ All required fields present');

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    // Insert with data field (default to empty array if not provided)
    const result = await pool.request()
      .input('siteId', sql.Int, siteId)
      .input('missionName', sql.NVarChar, missionName)
      .input('missionGroupId', sql.Int, missionGroupId)
      .input('dataMission', sql.NVarChar, dataMission || '[]')
      .input('description', sql.NVarChar, description || '')
      .query(`
        INSERT INTO Missions (IDSite, missionName, groupID, data, description)
        VALUES (@siteId, @missionName, @missionGroupId, @dataMission, @description);
        SELECT SCOPE_IDENTITY() AS ID;
      `);

    const newMissionId = result.recordset[0].ID;
    console.log('✅ Mission created successfully with ID:', newMissionId);

    res.json({
      success: true,
      message: 'Mission created successfully',
      missionId: newMissionId
    });
  }
  catch (error) {
    console.error('❌ Error creating mission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// update mission by id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;

    console.log(`Updating Missions ID: ${id}`);

    const { siteId, missionName, missionGroupId, dataMission, description } = req.body;

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const request = pool.request();
    request.timeout = 300000;

    request.input('id', sql.Int, id);
    request.input('siteId', sql.Int, siteId);
    request.input('missionName', sql.VarChar(50), missionName);
    request.input('missionGroupId', sql.Int, missionGroupId);
    request.input('dataMission', sql.Text, dataMission);
    request.input('description', sql.Text, description);

    const result = await request.query(`
      UPDATE Missions 
      SET IDSite = @siteId,
          missionName = @missionName,
          groupID = @missionGroupId,
          description = @description,
          data = @dataMission
      WHERE ID = @id
    `);

    if (result.rowsAffected[0] == 0) {
      console.log(`Missions ID ${id} not found or no changes made`);
      return res.status(404).json({ 
        success: false,
        error: 'Missions not found' 
      });
    }

    console.log(`Missions ID ${id} updated successfully`);
    res.json({ 
      success: true,
      message: 'Missions updated successfully' 
    });
  } catch (error) {
    console.error('Error updating Missions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});
// update mission by id


// Delete Mission
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Attempting to delete Missions ID: ${id}`);

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const checkMission = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM Missions WHERE ID = @id`);

    if (checkMission.recordset.length === 0) {
      console.log(`Missions ID ${id} not found`);
      return res.status(404).json({ message: 'Missions not found' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM Missions WHERE ID = @id`);

    console.log(`Missions ID ${id} deleted successfully`);
    res.json({ success: true, message: 'Missions deleted successfully' });
  } catch (error) {
    console.error('Error deleting Missions:', error);
    res.status(500).json({
      message: 'Internal server error',
      details: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Get mission logs with optional filtering
router.get('/logs', authenticateToken, (req, res) => {
  try {
    const options = {};

    // Parse query parameters
    if (req.query.level) {
      options.level = parseInt(req.query.level);
    }

    if (req.query.name) {
      options.name = req.query.name;
    }

    if (req.query.startTime) {
      options.startTime = req.query.startTime;
    }

    if (req.query.endTime) {
      options.endTime = req.query.endTime;
    }

    if (req.query.limit) {
      options.limit = parseInt(req.query.limit);
    }

    const logs = getMissionLogs(options);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
      logLevels: LOG_LEVELS
    });
  } catch (error) {
    console.error('Error getting mission logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mission logs',
      error: error.message
    });
  }
});

// Clear mission logs
router.delete('/logs', authenticateToken, (req, res) => {
  try {
    clearMissionLogs();

    res.json({
      success: true,
      message: 'Mission logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing mission logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear mission logs',
      error: error.message
    });
  }
});

// Get log level constants
router.get('/log-levels', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: LOG_LEVELS
  });
});

// Get recent mission logs from database
router.get('/logs/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    // Query to get recent mission logs
    const { config } = require('../../config/database');
    const table = config.engine === 'mysql' ? 'MissionLog' : '[NTURobot].[dbo].[MissionLog]';
    const isMySql = config.engine === 'mysql';

    let result;
    if (isMySql) {
      // MySQL driver can be picky about binding LIMIT as a parameter; inline safe integer
      const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
      result = await pool.request()
        .query(`
          SELECT 
              id,
              timestamp,
              level,
              message
          FROM ${table}
          ORDER BY timestamp DESC, id DESC
          LIMIT ${safeLimit}
        `);
    } else {
      result = await pool.request()
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit) 
              [id],
              [timestamp],
              [level],
              [message]
          FROM ${table}
          ORDER BY [timestamp] DESC, [id] DESC
        `);
    }

    // Map database results to component format
    const logs = result.recordset.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      level: mapDatabaseLevel(record.level),
      levelName: getLevelName(record.level),
      name: 'mission',
      message: record.message || '',
      file: '',
      function: '',
      line: 0
    }));

    res.json({
      success: true,
      data: logs.reverse(), // Reverse to show oldest first (chronological order)
      total: logs.length
    });

  } catch (error) {
    console.error('Error getting recent mission logs from database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent mission logs from database',
      error: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Helper function to map database level to component level
function mapDatabaseLevel(dbLevel) {
  // Assuming database stores level as string or number
  if (typeof dbLevel === 'string') {
    switch (dbLevel.toUpperCase()) {
      case 'SUCCESS': case 'SUCCEEDED': return 'success';
      case 'INFO': return 'info';
      case 'WARN': case 'WARNING': return 'warning';
      case 'ERROR': case 'FATAL': return 'error';
      case 'DEBUG': return 'success';
      default: return 'info';
    }
  }

  // Handle numeric levels
  switch (dbLevel) {
    case 1: return 'success'; // DEBUG -> SUCCESS
    case 2: return 'info';    // INFO
    case 4: return 'warning'; // WARN
    case 8: case 16: return 'error'; // ERROR/FATAL
    default: return 'info';
  }
}

// Helper function to get level name
function getLevelName(dbLevel) {
  if (typeof dbLevel === 'string') {
    switch (dbLevel.toUpperCase()) {
      case 'SUCCESS': case 'SUCCEEDED': return 'SUCCESS';
      case 'INFO': return 'INFO';
      case 'WARN': case 'WARNING': return 'WARN';
      case 'ERROR': return 'ERROR';
      case 'FATAL': return 'FATAL';
      case 'DEBUG': return 'SUCCESS';
      default: return 'INFO';
    }
  }

  // Handle numeric levels
  switch (dbLevel) {
    case 1: return 'SUCCESS'; // DEBUG -> SUCCESS
    case 2: return 'INFO';    // INFO
    case 4: return 'WARN';    // WARN
    case 8: return 'ERROR';   // ERROR
    case 16: return 'FATAL';  // FATAL
    default: return 'INFO';
  }
}

// Get mission queue by site ID
router.get('/queue/current', authenticateToken, async (req, res) => {
  try {
    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ 
        success: false,
        message: 'Database service is unavailable.' 
      });
    }
    

    
    // First, get current site info
    let currentSite = { id: 1, name: 'Default Site' };
    try {
      const siteResult = await pool.request().query(`
        SELECT TOP 1 ID as siteId, siteName
        FROM Sites
        WHERE isDefault = 1
        ORDER BY ID
      `);
      
      if (siteResult.recordset.length > 0) {
        currentSite = { 
          id: siteResult.recordset[0].siteId, 
          name: siteResult.recordset[0].siteName 
        };
      }

    } catch (siteError) {
      console.error('⚠️ Error getting current site, using default:', siteError);
    }
    
    // Then, get mission queue for current site
    let missions = [];
    try {
      const queueResult = await pool.request()
        .input('siteId', sql.Int, currentSite.id)
        .query(`
          SELECT 
            mq.ID as queueId,
            mq.MissionID as missionId,
            mq.Status as status,
            mq.ExecutionUUID as executionUUID,
            mq.Priority as priority,
            mq.QueuedAt as queuedAt,
            m.missionName as name,
            m.data as description
          FROM MissionQueue mq
          LEFT JOIN Missions m ON mq.MissionID = m.ID
          WHERE mq.IDSite = @siteId AND mq.Status IN (0, 1, 2)
          ORDER BY mq.Priority DESC, mq.QueuedAt ASC
        `);
      
      missions = queueResult.recordset.map(row => ({
        queueId: row.queueId,
        missionId: row.missionId,
        name: row.name || `Unknown Mission ${row.missionId}`,
        description: row.description || `Mission ${row.missionId} not found`,
        priority: row.priority || 1,
        estimatedDuration: 120, // Default duration
        status: row.status || 0,
        executionUUID: row.executionUUID || `uuid-${row.queueId}`,
        queuedAt: row.queuedAt || new Date().toISOString(),
        remainingTime: row.status === 1 ? Math.floor(Math.random() * 30) + 1 : null
      }));
      

    } catch (queueError) {
      console.error('⚠️ Error getting mission queue, returning empty:', queueError);
      missions = [];
    }

    const response = {
      success: true,
      data: {
        siteId: currentSite.id,
        siteName: currentSite.name,
        missions: missions,
        totalCount: missions.length,
        pendingCount: missions.filter(m => m.status === 0).length,
        runningCount: missions.filter(m => m.status === 1).length,
        pausedCount: missions.filter(m => m.status === 2).length,
        highPriorityCount: missions.filter(m => m.priority >= 2).length
      }
    };
    

    res.json(response);

  } catch (error) {
    console.error('🚨 Error getting mission queue:', error);

    // Return fallback data instead of error
    res.json({
      success: true,
      data: {
        siteId: 1,
        siteName: 'Default Site',
        missions: [],
        totalCount: 0,
        pendingCount: 0,
        runningCount: 0,
        pausedCount: 0,
        highPriorityCount: 0
      }
    });
  }
});

// Get all active mission queues
router.get('/queues/active', authenticateToken, async (req, res) => {
  try {
    // Query all active mission queues
    const queueQuery = `
      SELECT DISTINCT ExecutionUUID, COUNT(*) as MissionCount,
             MAX(QueuedAt) as LastUpdated
      FROM MissionQueue 
      WHERE Status IN (0, 1)
      GROUP BY ExecutionUUID
      ORDER BY LastUpdated DESC
    `;

    // Mock data - replace with actual database query
    const activeQueues = [
      {
        ExecutionUUID: '12345678-1234-1234-1234-123456789abc',
        MissionCount: 1,
        LastUpdated: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: activeQueues
    });

  } catch (error) {
    console.error('Error getting active queues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active queues',
      error: error.message
    });
  }
});

// Update mission status in queue
router.put('/queue/:queueId/status', authenticateToken, async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    console.log(`Updating queue item ${queueId} status to ${status}`);

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    // Update query
    const updateQuery = `
      UPDATE MissionQueue 
      SET Status = @status
      WHERE ID = @queueId
    `;

    const request = pool.request();
    request.input('queueId', sql.Int, queueId);
    request.input('status', sql.Int, status);
    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Queue item not found'
      });
    }

    console.log(`Queue item ${queueId} status updated to ${status} successfully`);

    res.json({
      success: true,
      message: 'Mission status updated successfully',
      data: {
        queueId: parseInt(queueId),
        status: status,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating mission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mission status',
      error: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Cancel mission in queue
router.delete('/queue/:queueId', authenticateToken, async (req, res) => {
  try {
    const { queueId } = req.params;

    console.log(`Cancelling queue item ${queueId}`);

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    // Mark as cancelled (Status = 5 for Cancelled)
    const cancelQuery = `
      UPDATE MissionQueue 
      SET Status = @status
      WHERE ID = @queueId
    `;

    const request = pool.request();
    request.input('queueId', sql.Int, queueId);
    request.input('status', sql.Int, 5); // 5 = Cancelled
    const result = await request.query(cancelQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Queue item not found'
      });
    }

    console.log(`Queue item ${queueId} cancelled successfully`);

    res.json({
      success: true,
      message: 'Mission cancelled successfully',
      data: {
        queueId: parseInt(queueId),
        status: 5, // Cancelled
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error cancelling mission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel mission',
      error: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Add mission to queue - only send command to ROS, robot will handle database
router.post('/queue/add', authenticateToken, async (req, res) => {
  try {
    const { missionId, siteId } = req.body;

    // Validate required fields
    if (!missionId) {
      return res.status(400).json({
        success: false,
        message: 'Mission ID is required'
      });
    }

    // Generate UUID for execution
    const { v4: uuidv4 } = require('uuid');
    const executionUUID = uuidv4();

    // Prepare message for ROS
    const rosMessage = {
      MissionID: missionId,
      MissionUuID: executionUUID,
      SiteID: siteId || 1
    };

    // Send command to ROS via shared connection
    try {
      const rosConnection = require('../../shared/rosConnection');
      
      // console.log('🔍 ROS Connection status:', {
      //   isConnected: rosConnection.isConnected(),
      //   hasRos: !!rosConnection.getRos(),
      //   rosObject: rosConnection.getRos()
      // });
      
      // Check if ROS is connected before sending command
      if (!rosConnection.isConnected() || !rosConnection.getRos()) {
        console.log('⚠️ ROS not connected, skipping ROS command');
        throw new Error('ROS connection not available');
      }
      
      const rosResponse = await rosConnection.sendRobotCommand(
        robotCommands.ADD_TO_MISSION_QUEUE,
        JSON.stringify(rosMessage)
      );

      console.log(`✅ ROS command sent successfully:`, rosResponse);

      res.json({
        success: true,
        message: 'Mission command sent to ROS successfully - robot will handle database',
        data: {
          missionId: missionId,
          executionUUID: executionUUID,
          rosResponse: rosResponse
        }
      });

      console.log('✅ Mission command sent to ROS successfully - robot will handle database');
    } catch (rosError) {
      console.error('❌ Error sending command to ROS:', rosError);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send command to ROS',
        error: rosError.message
      });
    }

  } catch (error) {
    console.error('❌ Error adding mission to queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add mission to queue',
      error: error.message
    });
  }
});

// Get all missions (for reference)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    // Query all missions
    const missionsQuery = `
      SELECT ID, Name, Description, Priority, EstimatedDuration, CreatedAt
      FROM Missions 
      ORDER BY Name ASC
    `;

    // Mock missions data - replace with actual database query
    const missions = [
      {
        ID: 101,
        Name: 'Home Navigation',
        Description: 'Navigate to home position',
        Priority: 1,
        EstimatedDuration: 60,
        CreatedAt: new Date().toISOString()
      },
      {
        ID: 102,
        Name: 'Patrol Route A',
        Description: 'Execute patrol route A',
        Priority: 2,
        EstimatedDuration: 180,
        CreatedAt: new Date().toISOString()
      },
      {
        ID: 103,
        Name: 'Cleaning Task',
        Description: 'Perform cleaning task in area B',
        Priority: 1,
        EstimatedDuration: 300,
        CreatedAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: missions
    });

  } catch (error) {
    console.error('Error getting missions list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get missions list',
      error: error.message
    });
  }
});

// Get mission queue added from subscriber
router.get('/queue/added', authenticateToken, (req, res) => {
  try {
    const { getMissionQueueAddedSubscriber } = require('../../subscribers/missionQueueAddedSubscriber');
    const subscriber = getMissionQueueAddedSubscriber();
    
    if (!subscriber) {
      return res.status(503).json({
        success: false,
        message: 'Mission queue added subscriber not initialized'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const executionId = req.query.execution_id;
    const status = req.query.status;

    let updates;
    
    if (executionId) {
      updates = subscriber.getUpdatesByExecutionId(executionId);
    } else if (status !== undefined) {
      updates = subscriber.getUpdatesByStatus(parseInt(status));
    } else {
      updates = subscriber.getRecentUpdates(limit);
    }

    const subscriberStatus = subscriber.getStatus();

    res.json({
      success: true,
      data: {
        updates: updates,
        subscriberStatus: subscriberStatus,
        totalUpdates: updates.length
      }
    });

  } catch (error) {
    console.error('Error getting mission queue updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mission queue updates',
      error: error.message
    });
  }
});

// Clear mission queue added
router.delete('/queue/added', authenticateToken, (req, res) => {
  try {
    const { getMissionQueueAddedSubscriber } = require('../../subscribers/missionQueueAddedSubscriber');
    const subscriber = getMissionQueueAddedSubscriber();
    
    if (!subscriber) {
      return res.status(503).json({
        success: false,
        message: 'Mission queue added subscriber not initialized'
      });
    }

    subscriber.clearUpdates();

    res.json({
      success: true,
      message: 'Mission queue updates cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing mission queue updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear mission queue updates',
      error: error.message
    });
  }
});

// Activate mission queue subscriber
router.post('/queue/added/subscriber/activate', authenticateToken, (req, res) => {
  try {
    const { getMissionQueueAddedSubscriber } = require('../../subscribers/missionQueueAddedSubscriber');
    const subscriber = getMissionQueueAddedSubscriber();
    
    if (!subscriber) {
      return res.status(503).json({
        success: false,
        message: 'Mission queue added subscriber not initialized'
      });
    }

    // Force re-initialization of subscriber
    subscriber.init();
    
    const status = subscriber.getStatus();
    console.log('🔔 Mission queue added subscriber activated:', status);

    res.json({
      success: true,
      message: 'Mission queue added subscriber activated successfully',
      data: {
        subscriberStatus: status
      }
    });

  } catch (error) {
    console.error('Error activating mission queue added subscriber:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate mission queue added subscriber',
      error: error.message
    });
  }
});

// Get missions by group ID from current site
router.get('/group/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }

    console.log(`🔄 Getting missions for group ${groupId} from current site`);

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    // Get missions by group ID from current site
    const result = await pool.request()
      .input('groupId', sql.Int, groupId)
      .query(`
        WITH CurrentSite AS (
          SELECT TOP 1 ID as siteId
          FROM Sites
          WHERE isDefault = 1
          ORDER BY ID
        )
        SELECT 
          m.ID,
          m.IDSite,
          m.missionName,
          m.groupID,
          m.description
        FROM Missions m
        INNER JOIN CurrentSite cs ON m.IDSite = cs.siteId
        WHERE m.groupID = @groupId
        ORDER BY m.missionName ASC
      `);

    const missions = result.recordset.map(mission => ({
      id: mission.ID,
      siteId: mission.IDSite,
      name: mission.missionName,
      groupId: mission.groupID,
      description: mission.description || '',
      data: mission.data || '[]'
    }));

    console.log(`✅ Found ${missions.length} missions for group ${groupId}`);

    res.json({
      success: true,
      data: missions,
      total: missions.length
    });

  } catch (error) {
    console.error('❌ Error getting missions by group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get missions by group',
      error: error.message
    });
  }
  // KHÔNG CẦN: finally { ... connection.close() ... }
  // Vì connection pool sẽ tự động quản lý việc đóng kết nối.
});

// Get missions by group ID from current site (alias endpoint)
router.get('/group/current-site/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }

    // SỬ DỤNG POOL TỪ REQUEST
    const pool = req.pool;
    if (!pool.connected) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }
    
    // Same query as /group/:groupId to get missions of current site
    const result = await pool.request()
      .input('groupId', sql.Int, groupId)
      .query(`
        WITH CurrentSite AS (
          SELECT TOP 1 ID as siteId
          FROM Sites
          WHERE isDefault = 1
          ORDER BY ID
        )
        SELECT 
          m.ID,
          m.IDSite,
          m.missionName,
          m.groupID,
          m.description,
          m.data
        FROM Missions m
        INNER JOIN CurrentSite cs ON m.IDSite = cs.siteId
        WHERE m.groupID = @groupId
        ORDER BY m.missionName ASC
      `);

    const missions = result.recordset.map(mission => ({
      id: mission.ID,
      ID: mission.ID, // keep original casing if frontend expects it
      siteId: mission.IDSite,
      IDSite: mission.IDSite,
      missionName: mission.missionName,
      groupID: mission.groupID,
      description: mission.description || '',
      data: mission.data || '[]'
    }));

    res.json({
      success: true,
      data: missions,
      total: missions.length
    });

  } catch (error) {
    console.error('❌ Error getting missions by group (current site alias):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get missions by group (current site)',
      error: error.message
    });
  }
});

// Get current mission queue status
router.get('/queue/status/current', authenticateToken, (req, res) => {
  try {
    const status = getCurrentMissionQueueStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting current mission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current mission status',
      error: error.message
    });
  }
});

// Reset mission status
router.post('/status/reset', authenticateToken, (req, res) => {
  try {
    const { resetMissionQueueStatus } = require('../../subscribers/missionQueueStatusSubscriber');
          resetMissionQueueStatus();
    
    res.json({
      success: true,
      message: 'Mission status reset successfully'
    });

  } catch (error) {
    console.error('Error resetting mission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset mission status',
      error: error.message
    });
  }
});

// Cancel mission in queue
router.post('/queue/cancel/:uuid', authenticateToken, async (req, res) => {
  try {
    const { uuid } = req.params;
    
    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: 'Mission UUID is required'
      });
    }

    console.log('🔄 Cancelling mission with UUID:', uuid);

    // Send SET_CANCEL_MISSION_BY_UUID command to ROS
    const rosConnection = require('../../shared/rosConnection');
    
    const command = {
      MissionUuID: uuid  // Use MissionUuID to match ROS side expectation
    };

    const result = await rosConnection.sendRobotCommand(
      robotCommands.SET_CANCEL_MISSION_BY_UUID, // SET_CANCEL_MISSION_BY_UUID command ID
      JSON.stringify(command)
    );
    
    // Check if ROS command was successful (result.result should be true from ROS response)
    if (result && result.result === true) {
      console.log('✅ Mission cancellation command sent to ROS successfully');
      
      res.json({
        success: true,
        message: 'Mission cancellation command sent successfully',
        data: {
          uuid: uuid,
          action: 'cancel'
        }
      });
    } else {
      console.error('❌ Failed to send cancellation command to ROS:', result ? result.msg : 'No response from ROS');
      res.status(500).json({
        success: false,
        message: 'Failed to send cancellation command to ROS',
        error: result ? result.msg : 'No response from ROS'
      });
    }

  } catch (error) {
    console.error('❌ Error cancelling mission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel mission',
      error: error.message
    });
  }
});


// Endpoint mới để sắp xếp lại hàng đợi
router.post('/queue/reorder', authenticateToken, async (req, res) => {
  try {
      const { orderedExecutionIds } = req.body;

      if (!Array.isArray(orderedExecutionIds)) {
          return res.status(400).json({ success: false, message: 'orderedExecutionIds must be an array.' });
      }

      // Chuyển mảng ID thành một chuỗi JSON để gửi đi
      const msgPayload = JSON.stringify(orderedExecutionIds);
      const rosConnection = require('../../shared/rosConnection');

      const result = await rosConnection.sendRobotCommand(
          robotCommands.SET_MISSION_QUEUE_ORDER, // <-- Lệnh mới cần được định nghĩa
          msgPayload
      );

      if (result && result.result) {
          res.json({ success: true, message: 'Mission queue reordered successfully.' });
      } else {
          throw new Error(result.msg || 'Failed to reorder mission queue on robot.');
      }

  } catch (error) {
      console.error('Error reordering mission queue:', error);
      res.status(500).json({
          success: false,
          message: 'Internal server error',
          details: error.message
      });
  }
});

// Set map current change
router.post('/map/change', authenticateToken, async (req, res) => {
  try {
    const { mapId, siteId } = req.body;

    console.log('🔄 SET_MAP_CURRENT_CHANGE API called with:', { mapId, siteId });

    // Validate required fields
    if (!mapId || !siteId) {
      console.log('❌ Missing required fields:', { mapId, siteId });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'mapId and siteId are required'
      });
    }

    console.log('✅ All required fields present');

    // Check ROS connection
    if (!rosConnection || !rosConnection.isConnected()) {
      console.log('❌ ROS connection not available');
      return res.status(503).json({
        success: false,
        error: 'ROS connection not available'
      });
    }

    // Create ROS message payload
    const messagePayload = JSON.stringify({
      IDMap: parseInt(mapId),
      IDSite: parseInt(siteId)
    });

    console.log('📤 Sending ROS command:', {
      commandId: robotCommands.SET_MAP_CURRENT_CHANGE,
      message: messagePayload
    });

    // Send command to ROS
    const result = await rosConnection.sendRobotCommand(
      robotCommands.SET_MAP_CURRENT_CHANGE,
      messagePayload
    );

    console.log('✅ ROS command sent successfully:', result);

    res.json({
      success: true,
      message: 'Map change command sent successfully',
      data: {
        mapId: parseInt(mapId),
        siteId: parseInt(siteId),
        command: robotCommands.SET_MAP_CURRENT_CHANGE
      }
    });

  } catch (error) {
    console.error('❌ Error in SET_MAP_CURRENT_CHANGE API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send map change command',
      details: error.message
    });
  }
});

module.exports = router;

