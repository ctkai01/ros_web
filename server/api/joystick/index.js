const express = require('express');
const router = express.Router();
const ROSLIB = require('roslib');
const { authenticateToken } = require('../auth/middleware');

// Import shared ROS connection
const rosConnection = require('../../shared/rosConnection');

// Joystick state
let joystickEnabled = false;
let cmdVel = null;
let odomTopic = null;

// Store joystick data in memory
let joystickData = {
  x: 0,
  y: 0,
  lastUpdate: new Date().toISOString()
};

// Initialize odom subscriber for joystick
function initOdomSubscriber(req) {
  if (odomTopic) {
    console.log('Odom subscriber already exists for joystick');
    return true;
  }

  const ros = rosConnection.getRos();
  if (!ros) {
    console.error('ROS connection not available for odom subscriber');
    return false;
  }

  try {
    console.log('Initializing odom subscriber for joystick...');
    
    odomTopic = new ROSLIB.Topic({
      ros: ros,
      name: '/odom',
      messageType: 'nav_msgs/Odometry'
    });

    odomTopic.subscribe((message) => {
      // Broadcast odom updates to WebSocket clients
      const wss = req.app.get('wss');
      if (wss) {
        broadcastToClients(wss, 'odom_update', message);
      }
    });

    console.log('Odom subscriber initialized for joystick');
    return true;
  } catch (error) {
    console.error('Failed to initialize odom subscriber:', error);
    return false;
  }
}

// Cleanup odom subscriber
function cleanupOdomSubscriber() {
  if (odomTopic) {
    try {
      odomTopic.unsubscribe();
      odomTopic = null;
      console.log('Odom subscriber cleaned up for joystick');
    } catch (error) {
      console.error('Error cleaning up odom subscriber:', error);
    }
  }
}

// Broadcast to WebSocket clients
function broadcastToClients(wss, type, data) {
  if (!wss) {
    console.warn('WebSocket server not available for broadcasting odom');
    return;
  }
  
  const message = JSON.stringify({ type, data });
  
  let sentCount = 0;
  wss.clients.forEach(client => {
    if (client.readyState === require('ws').OPEN) {
      client.send(message);
      sentCount++;
    }
  });
  
}

// Initialize cmdVel topic when joystick is enabled
function initCmdVel() {
  if (!joystickEnabled) {
    console.log('Joystick is not enabled');
    return false;
  }

  const ros = rosConnection.getRos();
  if (!ros) {
    console.error('ROS connection not available');
    return false;
  }

  try {
    cmdVel = new ROSLIB.Topic({
      ros: ros,
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist'
    });
    console.log('CmdVel topic initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize cmdVel topic:', error);
    return false;
  }
}

// Cleanup cmdVel when joystick is disabled
function cleanupCmdVel() {
  if (cmdVel) {
    try {
      cmdVel.unsubscribe();
      cmdVel = null;
      console.log('CmdVel topic cleaned up');
    } catch (error) {
      console.error('Error cleaning up cmdVel topic:', error);
    }
  }
}

// GET /api/joystick/message - Get current joystick position
router.get('/message', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: joystickData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get joystick data'
    });
  }
});

// GET /api/joystick/active - Get joystick status
router.get('/active', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: joystickEnabled
  });
});

// POST /api/joystick/enable - Enable joystick and initialize cmdVel
router.post('/enable', authenticateToken, (req, res) => {
  try {
    if (joystickEnabled) {
      return res.json({
        success: true,
        message: 'Joystick already enabled',
        data: { enabled: true }
      });
    }

    joystickEnabled = true;
    
    // Initialize cmdVel topic
    if (!initCmdVel()) {
      joystickEnabled = false;
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize joystick - ROS connection not available'
      });
    }

    // Initialize odom subscriber for real-time position updates
    if (!initOdomSubscriber(req)) {
      console.warn('Failed to initialize odom subscriber, but joystick will still work');
      // Don't fail the entire request if odom fails, just log a warning
    }

    console.log('Joystick enabled successfully with odom subscriber');
    res.json({
      success: true,
      message: 'Joystick enabled successfully',
      data: { enabled: true }
    });
  } catch (error) {
    joystickEnabled = false;
    console.error('Error enabling joystick:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable joystick'
    });
  }
});

// POST /api/joystick/disable - Disable joystick and cleanup cmdVel
router.post('/disable', authenticateToken, (req, res) => {
  try {
    if (!joystickEnabled) {
      return res.json({
        success: true,
        message: 'Joystick already disabled',
        data: { enabled: false }
      });
    }

    joystickEnabled = false;
    
    // Cleanup cmdVel topic
    cleanupCmdVel();
    
    // Cleanup odom subscriber
    cleanupOdomSubscriber();
    
    console.log('Joystick disabled successfully');
    res.json({
      success: true,
      message: 'Joystick disabled successfully',
      data: { enabled: false }
    });
  } catch (error) {
    console.error('Error disabling joystick:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable joystick'
    });
  }
});

// Publish velocity to ROS
function publishVelocity(linear, angular) {
  if (!joystickEnabled || !cmdVel) {
    console.warn('Cannot publish velocity - joystick not enabled or cmdVel not initialized');
    return false;
  }

  try {
   // console.log('Publishing velocity:', { linear, angular });
    const twist = new ROSLIB.Message({
      linear: {
        x: linear,
        y: 0,
        z: 0
      },
      angular: {
        x: 0,
        y: 0,
        z: angular
      }
    });

    cmdVel.publish(twist);
    return true;
  } catch (error) {
    console.error('Error publishing velocity:', error);
    return false;
  }
}

// POST /api/joystick/send-message - Update joystick position and velocities (optimized for performance)
router.post('/send-message', authenticateToken, (req, res) => {
  try {
    const { position, velocities } = req.body;

    // Fast validation - only check essential fields
    if (!position || !velocities || 
        typeof position.x !== 'number' || typeof position.y !== 'number' ||
        typeof velocities.linear !== 'number' || typeof velocities.angular !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid joystick data'
      });
    }

    const { x, y } = position;
    const { linear, angular } = velocities;

    // Quick range check
    if (x < -1 || x > 1 || y < -1 || y > 1) {
      return res.status(400).json({
        success: false,
        error: 'Position out of range'
      });
    }

    // Update joystick data (no timestamp for performance)
    joystickData = {
      position: { x, y },
      velocities: { linear, angular }
    };

    // Publish velocity if joystick is enabled (async, don't wait)
    if (joystickEnabled && cmdVel) {
      // Don't wait for publish result to reduce latency
      setImmediate(() => {
        publishVelocity(linear, angular);
      });
    }

    // Send immediate response
    res.json({
      success: true,
      data: joystickData
    });
  } catch (error) {
    console.error('Error updating joystick data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update joystick data'
    });
  }
});

module.exports = router; 