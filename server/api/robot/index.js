const express = require('express');
const router = express.Router();
const ROSLIB = require('roslib');
const WebSocket = require('ws');
const { authenticateToken } = require('../auth/middleware');
const { robotCommands } = require('../../config/robotCommands');
const rosConnection = require('../../shared/rosConnection');
const { getRobotStatus, updateMissionStatus, broadcastRobotStatus } = require('../../subscribers/robotStatusSubscriber');

// Map and TF topic variables
let mapTopic = null;
let tfTopic = null;
let scanTopic = null;
let odomTopic = null;
let navGlobalPathPlanningTopic = null;
let brakeTopic = null;


// THÊM MỚI: Hàm để dọn dẹp tất cả các subscriber trong file này
function cleanupRobotSubscribers() {
    console.log('Cleaning up subscribers in robot.js...');
    if (mapTopic) {
        console.log('Unsubscribing map topic...');
        mapTopic.unsubscribe();
        mapTopic = null;
    }
    else
    if (tfTopic) {
        tfTopic.unsubscribe();
        tfTopic = null;
    }
    if (scanTopic) {
        scanTopic.unsubscribe();
        scanTopic = null;
    }
    if (odomTopic) {
        odomTopic.unsubscribe();
        odomTopic = null;
    }
    if (navGlobalPathPlanningTopic) {
        navGlobalPathPlanningTopic.unsubscribe();
        navGlobalPathPlanningTopic = null;
    }
    if (brakeTopic) {
        brakeTopic.unsubscribe();
        brakeTopic = null;
    }
}

// THÊM MỚI: Đăng ký hàm dọn dẹp với sự kiện onClose của rosConnection
rosConnection.onClose(cleanupRobotSubscribers);



// Initialize ROS connection
function initRosConnection() {
    console.log('initRosConnection called in robot API - using shared connection');
    // The shared ROS connection is managed by rosConnection module
}

// Call ROS service
function callRosService(serviceName, serviceType, request) {
    console.log('callRosService called in robot API - using shared connection');
    console.log('serviceName:', serviceName);
    console.log('serviceType:', serviceType);
    console.log('request:', request);
    return rosConnection.callService(serviceName, serviceType, request);
}
function initOdomSubscriber(wss) {
    if (odomTopic) {
        console.log('Odom subscriber already exists');
        return;
    }

    console.log('Initializing odom subscriber...');

    odomTopic = new ROSLIB.Topic({
        ros: rosConnection.getConnection(),
        name: '/odom',
        messageType: 'nav_msgs/Odometry'
    });

    odomTopic.subscribe((message) => {
        broadcastToClients(wss, 'odom_update', message);
    });

    console.log('Odom subscriber initialized');
}
function initScanSubscriber(wss) {
    if (scanTopic) {
        console.log('🔍 [SERVER] Scan subscriber already exists, skipping initialization');
        return;
    }

    console.log('🔍 [SERVER] Initializing scan subscriber...');
    console.log('🔍 [SERVER] ROS connection status:', rosConnection.isConnected());
    console.log('🔍 [SERVER] WebSocket server available:', !!wss);

    scanTopic = new ROSLIB.Topic({
        ros: rosConnection.getConnection(),
        name: '/scan',
        messageType: 'sensor_msgs/LaserScan'
    });

    scanTopic.subscribe((message) => {
        broadcastToClients(wss, 'scan_update', message);
        
        // Also update sensors status
        try {
            const { handleScanDataFromRobotAPI } = require('../../subscribers/sensorsSubscriber');
            handleScanDataFromRobotAPI(message);
        } catch (error) {
            console.warn('⚠️ [SERVER] Could not update sensors status with scan data:', error.message);
        }
    });

    console.log('✅ [SERVER] Scan subscriber initialized successfully');
}

// Initialize brake subscriber
function initBrakeSubscriber(wss) {
    if (brakeTopic) {
        console.log('Brake subscriber already exists');
        return;
    }

    console.log('Initializing brake subscriber...');

    brakeTopic = new ROSLIB.Topic({
        ros: rosConnection.getConnection(),
        name: '/brake_status',
        messageType: 'std_msgs/Bool'
    });

    brakeTopic.subscribe((message) => {
        // console.log('Received brake data from ROS:', message);
        broadcastToClients(wss, 'brake_update', message);
    });

    console.log('Brake subscriber initialized');
}
// Initialize map subscriber
function initMapSubscriber(wss) {
    // console.log('initMapSubscriber called with wss:', !!wss);

    if (mapTopic) {
        console.log('Map subscriber already exists');
        return;
    }

    console.log('Initializing map subscriber...');

    mapTopic = new ROSLIB.Topic({
        ros: rosConnection.getConnection(),
        name: '/map',
        messageType: 'nav_msgs/OccupancyGrid'
    });

    mapTopic.subscribe((message) => {
         console.log('Received map update from ROS, broadcasting to clients...');
        //console.log('message', message);
        broadcastToClients(wss, 'map_update', message);
    });

    console.log('Map subscriber initialized');
}

// Initialize TF subscriber
function initTFSubscriber(wss) {
    if (tfTopic) {
        console.log('TF subscriber already exists');
        return;
    }

    console.log('Initializing TF subscriber...');

    tfTopic = new ROSLIB.Topic({
        ros: rosConnection.getConnection(),
        name: '/tf',
        messageType: 'tf2_msgs/TFMessage'
    });

    tfTopic.subscribe((message) => {
        if (message.transforms.length > 0) {
            broadcastToClients(wss, 'robot_tf', message);
        }
    });

    console.log('TF subscriber initialized');
}

// Initialize nav global path planning subscriber
function initNavGlobalPathPlanningSubscriber(wss) {
    if (navGlobalPathPlanningTopic) {
        console.log('Nav global path planning subscriber already exists');
        return;
    }

    console.log('Initializing nav global path planning subscriber...');

    navGlobalPathPlanningTopic = new ROSLIB.Topic({
        ros: rosConnection.getConnection(),
        name: '/move_base_node/SBPLLatticePlanner/plan',
        messageType: 'nav_msgs/Path'
    });

    navGlobalPathPlanningTopic.subscribe((message) => {
        broadcastToClients(wss, 'nav_global_path_planning', message);
    });
}
// Broadcast to WebSocket clients
function broadcastToClients(wss, type, data) {
    //console.log(`Broadcasting ${type} message to clients. WSS:`, !!wss, 'Clients count:', wss ? wss.clients.size : 0);

    if (!wss) {
        console.warn('WebSocket server not available for broadcasting');
        return;
    }

    const message = JSON.stringify({ type, data });
    //console.log(`Sending message: ${type}`, message.substring(0, 100) + '...');

    let sentCount = 0;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sentCount++;
        }
    });

    //console.log(`Message sent to ${sentCount} clients`);
}

// Get ROS connection status
router.get('/status', (req, res) => {
    const isConnected = rosConnection.isConnected();
    const rosObject = rosConnection.getRos();
    
    console.log('🔍 [SERVER] ROS status check:', {
        connected: isConnected,
        hasRosObject: !!rosObject,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        connected: isConnected,
        status: isConnected ? 'Connected' : 'Disconnected',
        hasRosObject: !!rosObject,
        timestamp: new Date().toISOString()
    });
});

// Generic robot command endpoint
router.post('/command', authenticateToken, async (req, res) => {
    try {
        const { cmd, msg = '' } = req.body;
        
        if (!cmd) {
            return res.status(400).json({
                success: false,
                message: 'Command is required'
            });
        }

        console.log(`Executing robot command: ${cmd}`);
        
        // Find command ID from robotCommands
        let commandId;
        if (typeof cmd === 'string') {
            // If cmd is string, find the ID
            commandId = robotCommands[cmd];
            if (!commandId) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid command: ${cmd}`
                });
            }
        } else {
            // If cmd is already a number, use it directly
            commandId = cmd;
        }

        const request = {
            cmd: commandId,
            msg: msg
        };

        console.log(`Sending ROS service request:`, request);

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        console.log(`ROS service response:`, result);

        if (result && result.result !== undefined) {
            res.json({
                success: result.result,
                message: result.msg || 'Command executed successfully',
                data: result
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid response from ROS service',
                data: result
            });
        }
    } catch (error) {
        console.error('Error executing robot command:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute robot command',
            error: error.message
        });
    }
});

// Get Mission State API
router.get('/mission-state', authenticateToken, async (req, res) => {
    try {
        console.log('Getting mission status from robot...');
        
        const request = {
            cmd: robotCommands.GET_MISSION_STATUS,
            msg: ''
        };


        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);


        if (result && result.result !== undefined) {
            // Parse mission status from response
            let missionStatus = 'IDLE'; // Default status
            
            if (result.msg) {
                try {
                    // Parse JSON string from ROS response
                    const missionData = JSON.parse(result.msg);
                    missionStatus = missionData.status || 'IDLE';
                    console.log('Parsed mission data:', missionData);
                } catch (parseError) {
                    console.warn('Failed to parse mission status JSON, using default:', parseError);
                    // Fallback to regex parsing if JSON fails
                    const statusMatch = result.msg.match(/status[:\s]+(\w+)/i);
                    if (statusMatch) {
                        missionStatus = statusMatch[1].toUpperCase();
                    }
                }
            }
            
            // Map status to MissionButtonState enum
            let buttonState;
            switch (missionStatus.toUpperCase()) {
                case 'IDLE':
                    buttonState = 'IDLE';
                    break;
                case 'RUNNING':
                case 'EXECUTING':
                    buttonState = 'RUNNING';
                    break;
                case 'PAUSED':
                case 'PAUSE':
                    buttonState = 'PAUSED';
                    break;
                default:
                    buttonState = 'IDLE';
            }

            res.json({
                success: result.result,
                message: result.msg || 'Mission status retrieved successfully',
                data: {
                    status: buttonState,
                    rawStatus: missionStatus,
                    lastUpdated: new Date().toISOString()
                }
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid response from ROS service',
                data: result
            });
        }
    } catch (error) {
        console.error('Error getting mission status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get mission status',
            error: error.message
        });
    }
});

// Start Mission API
router.post('/start-mission', authenticateToken, async (req, res) => {
    try {
        console.log('Starting mission...');
        
        const request = {
            cmd: robotCommands.START_MISSION,
            msg: ''
        };

        console.log(`Sending START_MISSION request:`, request);

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        console.log(`START_MISSION response:`, result);

        if (result && result.result !== undefined) {
            res.json({
                success: result.result,
                message: result.msg || 'Mission started successfully',
                data: result
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid response from ROS service',
                data: result
            });
        }
    } catch (error) {
        console.error('Error starting mission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start mission',
            error: error.message
        });
    }
});

// Pause Mission API
router.post('/pause-mission', authenticateToken, async (req, res) => {
    try {
        console.log('Pausing mission...');
        
        const request = {
            cmd: robotCommands.PAUSE_MISSION,
            msg: ''
        };

        console.log(`Sending PAUSE_MISSION request:`, request);

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        console.log(`PAUSE_MISSION response:`, result);

        if (result && result.result !== undefined) {
            res.json({
                success: result.result,
                message: result.msg || 'Mission paused successfully',
                data: result
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid response from ROS service',
                data: result
            });
        }
    } catch (error) {
        console.error('Error pausing mission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to pause mission',
            error: error.message
        });
    }
});

// Resume Mission API
router.post('/resume-mission', authenticateToken, async (req, res) => {
    try {
        console.log('Resuming mission...');
        
        const request = {
            cmd: robotCommands.RESUME_MISSION,
            msg: ''
        };

        console.log(`Sending RESUME_MISSION request:`, request);

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        console.log(`RESUME_MISSION response:`, result);

        if (result && result.result !== undefined) {
            res.json({
                success: result.result,
                message: result.msg || 'Mission resumed successfully',
                data: result
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid response from ROS service',
                data: result
            });
        }
    } catch (error) {
        console.error('Error resuming mission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resume mission',
            error: error.message
        });
    }
});

// Start SLAM
router.post('/start-slam', authenticateToken, async (req, res) => {
    console.log('Starting SLAM...');
    try {
        const request = {
            cmd: robotCommands.SET_START_SLAM,
            msg: ''
        };
        // start subcriber map
        if (!mapTopic) {
            initMapSubscriber(req.app.get('wss'));
        }
        // start subcriber tf
        if (!tfTopic) {
            initTFSubscriber(req.app.get('wss'));
        }

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        //console.log('result', result);
        if (result.result) {
            res.json({ success: true });
        } else {
            throw new Error('Failed to start SLAM');
        }
    } catch (error) {
        console.error('Error starting SLAM:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to start SLAM'
        });
    }
});

// Pause SLAM
router.post('/pause-slam', authenticateToken, async (req, res) => {
    try {
        const request = {
            cmd: robotCommands.SET_PAUSE_SLAM,
            msg: ''
        };

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        if (result.result) {
            res.json({ success: true });
        } else {
            throw new Error('Failed to stop SLAM');
        }
    } catch (error) {
        console.error('Error stopping SLAM:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to stop SLAM'
        });
    }
});
// save all config
router.post('/save-all-config', authenticateToken, async (req, res) => {
    const { mapId, siteId } = req.body;
    console.log('=== DEBUG save-all-config ===');
    console.log('req.body:', req.body);
    console.log('mapId:', mapId, 'type:', typeof mapId);
    console.log('siteId:', siteId, 'type:', typeof siteId);
    console.log('============================');

    try {
        const msg = {
            IDSite: siteId,
            IDMap: parseInt(mapId)
        };
        console.log('Sending to ROS service:', msg);

        const request = {
            cmd: robotCommands.SET_SAVE_ALL_CONFIG_MAP_FROM_SQL_TO_FILE,
            msg: JSON.stringify(msg)
        };

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);
        if (result.result) {
            res.json({ success: true });
        } else {
            throw new Error('Failed to save all map config');
        }
    } catch (error) {
        console.error('Error saving all map config:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save all map config'
        });
    }
});

// save costmap 
router.post('/save-costmap', authenticateToken, async (req, res) => {
    const { mapId, siteId } = req.body;
    console.log('=== DEBUG save-costmap ===');
    console.log('req.body:', req.body);
    console.log('mapId:', mapId, 'type:', typeof mapId);
    console.log('siteId:', siteId, 'type:', typeof siteId);
    console.log('============================');

    try {
        const msg = {
            IDSite: siteId,
            IDMap: parseInt(mapId)
        };

        console.log('Sending to ROS service:', msg);

        const request = {
            cmd: robotCommands.SET_SAVE_COSTMAP_FROM_SQL_TO_FILE,
            msg: JSON.stringify(msg)
        };

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);
        if (result.result) {
            res.json({ success: true });
        } else {
            throw new Error('Failed to save costmap');
        }
    } catch (error) {
        console.error('Error saving costmap:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save costmap'
        });
    }
});


// stop slam
router.post('/stop-slam', authenticateToken, async (req, res) => {
    const request = {
        cmd: robotCommands.SET_STOP_SLAM,
        msg: ''
    };

    // unsubcribe map
    if (mapTopic) {
        mapTopic.unsubscribe();
        mapTopic = null;
        console.log('Map subscriber stopped');
    }
 

    const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);
    if (result.result) {
        res.json({ success: true });
    } else {
        throw new Error('Failed to stop SLAM');
    }
});




// Load map
router.post('/update-map', authenticateToken, async (req, res) => {
    try {
        const { mapId, siteId } = req.body;

        const jsonData = {
            IDSite: siteId,
            IDMap: parseInt(mapId)
        };

        console.log('Loading map with data:', jsonData);

        const request = {
            cmd: robotCommands.SET_UPDATE_MAP,
            msg: JSON.stringify(jsonData)
        };

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        if (result.result) {
            res.json({ success: true });
            console.log('result', result);
        } else {
            throw new Error('Failed to load map');
        }
    } catch (error) {
        console.error('Error loading map:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to load map'
        });
    }
});

// Stop map
router.post('/stop-map', authenticateToken, async (req, res) => {
    try {
        const request = {
            cmd: robotCommands.SET_MAP_STOP,
            msg: ''
        };

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        if (result.result) {
            // Unsubscribe from topics when map stops
            if (mapTopic) {
                mapTopic.unsubscribe();
                mapTopic = null;
                console.log('Map subscriber stopped');
            }
            if (tfTopic) {
                tfTopic.unsubscribe();
                tfTopic = null;
                console.log('TF subscriber stopped');
            }

            res.json({ success: true });
        } else {
            throw new Error('Failed to stop map');
        }
    } catch (error) {
        console.error('Error stopping map:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to stop map'
        });
    }
});

// start navigation
router.post('/start-navigation', authenticateToken, async (req, res) => {
    try {
        const { mapId, siteId } = req.body;
        console.log('🚀 [SERVER] start-navigation API called with:', req.body);
        console.log('🚀 [SERVER] Request details:', {
            mapId: mapId,
            siteId: siteId,
            mapIdType: typeof mapId,
            siteIdType: typeof siteId,
            timestamp: new Date().toISOString()
        });
        // check if ROs state is not in navigation mode
        console.log('🔍 [SERVER] Checking robot navigation state...');
        
        let navigationState;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('ROS service call timeout after 10 seconds')), 10000);
            });
            
            const servicePromise = callRosService('/robot/command', 'ntuamr/robot_command', { 
                cmd: robotCommands.GET_NAVIGATION_STATED, 
                msg: '' 
            });
            
            navigationState = await Promise.race([servicePromise, timeoutPromise]);
            console.log('📊 [SERVER] Navigation state result:', navigationState);
            console.log('📊 [SERVER] Navigation state details:', {
                result: navigationState.result,
                msg: navigationState.msg,
                resultType: typeof navigationState.result
            });
        } catch (navStateError) {
            console.error('❌ [SERVER] Error checking navigation state:', navStateError);
            console.error('❌ [SERVER] Navigation state error details:', {
                message: navStateError.message,
                name: navStateError.name
            });
            console.log('⚠️ [SERVER] Assuming robot is not in navigation mode due to error');
            navigationState = { result: false, msg: 'Navigation state check failed' };
        }

        if (navigationState.result) {
            console.log('✅ [SERVER] Robot is already in navigation mode, initializing subscribers...');
            
            console.log('✅ [SERVER] Subscribers initialized successfully, sending success response');
            res.json({ success: true });
        } else {
            console.log('🔄 [SERVER] Robot is not in navigation mode, starting navigation...');
            // if robot is not in navigation mode, start navigation
            const msg = {
                IDSite: parseInt(siteId),
                IDMap: parseInt(mapId)
            };
            const request = {
                cmd: robotCommands.SET_START_NAVIGATION,
                msg: JSON.stringify(msg)
            };
            console.log('📤 [SERVER] Sending ROS command to start navigation:', request);
            console.log('📤 [SERVER] Message payload:', msg);
            
            let result;
            try {
                // Add timeout for ROS service call
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('ROS service call timeout after 15 seconds')), 15000);
                });
                
                const servicePromise = callRosService('/robot/command', 'ntuamr/robot_command', request);
                result = await Promise.race([servicePromise, timeoutPromise]);
                
                console.log('📥 [SERVER] ROS command result:', result);
                console.log('📥 [SERVER] ROS command result details:', {
                    result: result.result,
                    msg: result.msg,
                    resultType: typeof result.result
                });
            } catch (rosCommandError) {
                console.error('❌ [SERVER] Error calling ROS service to start navigation:', rosCommandError);
                console.error('❌ [SERVER] ROS command error details:', {
                    message: rosCommandError.message,
                    name: rosCommandError.name
                });
                // throw new Error(`Failed to start navigation: ${rosCommandError.message}`);
            }
            if (result.result) {

                console.log('✅ [SERVER] Navigation started successfully, sending success response');
                res.json({ success: true });
            } else {
                console.error('❌ [SERVER] Failed to start navigation - ROS command returned false');
                throw new Error('Failed to start navigation');
            }
        }
    } catch (error) {
        console.error('❌ [SERVER] Error starting navigation:', error);
        console.error('❌ [SERVER] Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to start navigation'
        });
    }
});

// stop navigation
router.post('/stop-navigation', authenticateToken, async (req, res) => {
    try {
        const { mapId, savePose } = req.body;
        const msg = {
            IDMap: parseInt(mapId),
            SavePose: Boolean(savePose)
        };
        const request = {
            cmd: robotCommands.SET_STOP_NAVIGATION,
            msg: JSON.stringify(msg)
        };

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        if (result.result) {
            // Unsubscribe from nav global path planning subscriber
            if (navGlobalPathPlanningTopic) {
                navGlobalPathPlanningTopic.unsubscribe();
                navGlobalPathPlanningTopic = null;
                console.log('Nav global path planning subscriber stopped');
            }
            
            res.json({ success: true });
        } else {
            throw new Error('Failed to stop navigation');
        }
    } catch (error) {
        console.error('Error stopping navigation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to stop navigation'
        });
    }
});

// init pose estimate
router.post('/init-pose-estimate', authenticateToken, async (req, res) => {
    try {
        const { poseEstimate } = req.body;

        console.log('Received pose estimate request:', poseEstimate);

        if (!poseEstimate || !poseEstimate.position || !poseEstimate.orientation) {
            throw new Error('Invalid pose estimate data');
        }

        // Create geometry_msgs::PoseWithCovarianceStamped message
        const poseWithCovarianceStamped = {
            header: {
                stamp: {
                    sec: Math.floor(Date.now() / 1000),
                    nanosec: (Date.now() % 1000) * 1000000
                },
                frame_id: 'map'
            },
            pose: {
                pose: {
                    position: {
                        x: poseEstimate.position.x,
                        y: poseEstimate.position.y,
                        z: poseEstimate.position.z || 0.0
                    },
                    orientation: {
                        x: poseEstimate.orientation.x,
                        y: poseEstimate.orientation.y,
                        z: poseEstimate.orientation.z,
                        w: poseEstimate.orientation.w
                    }
                },
                covariance: [
                    0.25, 0.0, 0.0, 0.0, 0.0, 0.0,  // x variance
                    0.0, 0.25, 0.0, 0.0, 0.0, 0.0,  // y variance
                    0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  // z variance
                    0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  // roll variance
                    0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  // pitch variance
                    0.0, 0.0, 0.0, 0.0, 0.0, 0.06  // yaw variance
                ]
            }
        };

        console.log('Publishing pose estimate to /initialpose:', poseWithCovarianceStamped);

        // Create publisher for /initialpose topic
        const initialPosePublisher = new ROSLIB.Topic({
            ros: rosConnection.getConnection(),
            name: '/initialpose',
            messageType: 'geometry_msgs/PoseWithCovarianceStamped'
        });

        // Publish the pose estimate
        initialPosePublisher.publish(poseWithCovarianceStamped);

        console.log('Pose estimate published successfully');

        res.json({
            success: true,
            message: 'Pose estimate published successfully',
            data: poseWithCovarianceStamped
        });

    } catch (error) {
        console.error('Error publishing pose estimate:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to publish pose estimate'
        });
    }
});

// navigation goal
router.post('/nav-goal', authenticateToken, async (req, res) => {
    try {
        const { navGoal } = req.body;

        console.log('Received navigation goal request:', navGoal);

        if (!navGoal || !navGoal.position || !navGoal.orientation) {
            throw new Error('Invalid navigation goal data');
        }

        // Create geometry_msgs::PoseStamped message
        const poseStamped = {
            header: {
                stamp: {
                    sec: Math.floor(Date.now() / 1000),
                    nanosec: (Date.now() % 1000) * 1000000
                },
                frame_id: 'map'
            },
            pose: {
                position: {
                    x: navGoal.position.x,
                    y: navGoal.position.y,
                    z: navGoal.position.z || 0.0
                },
                orientation: {
                    x: navGoal.orientation.x,
                    y: navGoal.orientation.y,
                    z: navGoal.orientation.z,
                    w: navGoal.orientation.w
                }
            }
        };

        console.log('Publishing navigation goal to /move_base_simple/goal:', poseStamped);

        // Create publisher for /move_base_simple/goal topic
        const navGoalPublisher = new ROSLIB.Topic({
            ros: rosConnection.getConnection(),
            name: '/move_base_simple/goal',
            messageType: 'geometry_msgs/PoseStamped'
        });

        // Publish the navigation goal
        navGoalPublisher.publish(poseStamped);

        console.log('Navigation goal published successfully');

        res.json({
            success: true,
            message: 'Navigation goal published successfully',
            data: poseStamped
        });

    } catch (error) {
        console.error('Error publishing navigation goal:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to publish navigation goal'
        });
    }
});

// Get robot status
router.get('/status', authenticateToken, (req, res) => {
    try {
        const status = getRobotStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error getting robot status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get robot status',
            error: error.message
        });
    }
});

// Update mission status
router.post('/mission-status', authenticateToken, (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        const updated = updateMissionStatus(status);
        
        if (updated) {
            // Broadcast to all WebSocket clients
            const wss = req.app.get('wss');
            if (wss) {
                broadcastRobotStatus(wss);
            }
            
            res.json({
                success: true,
                message: 'Mission status updated successfully',
                data: getRobotStatus()
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid mission status'
            });
        }
    } catch (error) {
        console.error('Error updating mission status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update mission status',
            error: error.message
        });
    }
});

// Test endpoint to check if robot API is working
router.get('/test', (req, res) => {
    console.log('=== ROBOT API TEST ENDPOINT CALLED ===');
    res.json({
        success: true,
        message: 'Robot API is working!',
        timestamp: new Date().toISOString()
    });
});

// Test ROS service call
router.post('/test-ros-service', authenticateToken, async (req, res) => {
    try {
        console.log('🧪 [SERVER] Testing ROS service call...');
        
        const startTime = Date.now();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('ROS service call timeout after 5 seconds')), 5000);
        });
        
        const servicePromise = callRosService('/robot/command', 'ntuamr/robot_command', {
            cmd: robotCommands.GET_NAVIGATION_STATED,
            msg: ''
        });
        
        const result = await Promise.race([servicePromise, timeoutPromise]);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ [SERVER] ROS service test successful:', {
            result: result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'ROS service call successful',
            data: result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ [SERVER] ROS service test failed:', error);
        res.status(500).json({
            success: false,
            message: 'ROS service call failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Force reinitialize all robot subscribers
router.post('/reinit-subscribers', authenticateToken, (req, res) => {
    try {
        console.log('🔄 [SERVER] Force reinitializing robot subscribers...');
        
        const wss = req.app.get('wss');
        if (!wss) {
            return res.status(500).json({
                success: false,
                message: 'WebSocket server not available'
            });
        }

        // Clean up existing subscribers
        cleanupRobotSubscribers();
        
        // Reinitialize subscribers
        console.log('🔄 [SERVER] Reinitializing TF subscriber...');
        initTFSubscriber(wss);
        
        console.log('🔄 [SERVER] Reinitializing scan subscriber...');
        initScanSubscriber(wss);
        
        console.log('🔄 [SERVER] Reinitializing brake subscriber...');
        initBrakeSubscriber(wss);

        res.json({
            success: true,
            message: 'Robot subscribers reinitialized successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ [SERVER] Error reinitializing subscribers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reinitialize subscribers',
            error: error.message
        });
    }
});

// Get pattern pose for marker detection
router.post('/get-pattern-pose', authenticateToken, async (req, res) => {
    console.log('=== GET_PATTERN_POSE API CALLED ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    try {
        const { type = 'pattern', timeout = 10.0, id = 0 } = req.body;
        
        console.log(`Getting pattern pose for type: ${type}, timeout: ${timeout}s`);
        
        // Validate pattern type
        const validTypes = ['aruco', 'pattern', 'vl_marker'];
        if (!validTypes.includes(type.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pattern type. Use "aruco", "pattern", or "vl_marker"'
            });
        }

        // Create JSON message for ROS service
        const msg = {
            type: type.toLowerCase(),
            id: parseInt(id),
            timeout: parseFloat(timeout)
        };

        const request = {
            cmd: robotCommands.GET_PATTERN_POSE,
            msg: JSON.stringify(msg)
        };

        console.log(`Sending GET_PATTERN_POSE request:`, request);

        const result = await callRosService('/robot/command', 'ntuamr/robot_command', request);

        console.log(`GET_PATTERN_POSE response:`, result);

        if (result && result.result !== undefined) {
            if (result.result) {
                // Parse the pose data from ROS response
                let poseData = null;
                if (result.msg) {
                    try {
                        poseData = JSON.parse(result.msg);
                    } catch (parseError) {
                        console.warn('Failed to parse pose data JSON:', parseError);
                        poseData = null;
                    }
                }

                res.json({
                    success: true,
                    message: 'Pattern pose detected successfully',
                    data: {
                        pose: poseData,
                        rawResponse: result.msg
                    }
                });
            } else {
                res.json({
                    success: false,
                    message: result.msg || 'Failed to detect pattern pose',
                    data: result
                });
            }
        } else {
            res.json({
                success: false,
                message: 'Invalid response from ROS service',
                data: result
            });
        }
    } catch (error) {
        console.error('Error getting pattern pose:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pattern pose',
            error: error.message
        });
    }
});


// Initialize ROS connection when module loads
initRosConnection();

// Export router as default and also export functions
const routerExports = {
    router,
    cleanupRobotSubscribers,
    initTFSubscriber,
    initScanSubscriber
};

// For backward compatibility, also export router as default
module.exports = router;
module.exports.router = router;
module.exports.cleanupRobotSubscribers = cleanupRobotSubscribers;
module.exports.initTFSubscriber = initTFSubscriber;
module.exports.initScanSubscriber = initScanSubscriber;
module.exports.initBrakeSubscriber = initBrakeSubscriber;
module.exports.initNavGlobalPathPlanningSubscriber = initNavGlobalPathPlanningSubscriber; 