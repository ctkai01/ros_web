const ROSLIB = require('roslib');

let robotStatus = {
    systemStatus: 'UNKNOWN',
    lastUpdated: new Date().toISOString()
};

// System Status constants
const SYSTEM_STATUS = {
    DISCONNECTED: 'DISCONNECTED',
    INITIALIZING: 'INITIALIZING', 
    IDLE_CONNECTED: 'IDLE CONNECTED',
    STARTING_NAV: 'STARTING NAVI',
    READY: 'READY',
    SLAM_ACTIVE: 'SLAM ACTIVE',
    SLAM_PAUSED: 'SLAM PAUSED',
    SYSTEM_ERROR: 'SYSTEM ERROR',
    UNKNOWN: 'UNKNOWN',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED', 
    PENDING: 'PENDING'
};

// Helper function to get system status color
function getSystemStatusColor(status) {
    switch (status) {
        case SYSTEM_STATUS.READY:
            return '#c5f2ae'; // Green
        case SYSTEM_STATUS.INITIALIZING:
        case SYSTEM_STATUS.STARTING_NAV:
            return '#f7dc6f'; // Yellow
        case SYSTEM_STATUS.SLAM_ACTIVE:
            return '#f39c12'; // Orange
        case SYSTEM_STATUS.SLAM_PAUSED:
            return '#f8c471'; // Lighter Orange
        case SYSTEM_STATUS.SYSTEM_ERROR:
            return '#e74c3c'; // Red
        case SYSTEM_STATUS.DISCONNECTED:
        case SYSTEM_STATUS.IDLE_CONNECTED:
            return '#f2f2f2'; // Gray/Default
        case SYSTEM_STATUS.UNKNOWN:
            return '#f2f2f2'; // Gray/Default
        case SYSTEM_STATUS.RUNNING:
            return '#aed6f1'; // Light Blue
        case SYSTEM_STATUS.PAUSED:
            return '#f8c471'; // Light Orange
        case SYSTEM_STATUS.PENDING:
        default:
            return '#f2f2f2'; // Gray
    }
}

// Helper function to parse status message
function parseStatusMessage(message) {
    try {
        // Try to parse as JSON first
        const parsed = JSON.parse(message);
        return {
            systemStatus: parsed.systemStatus || parsed.system_status || 'UNKNOWN',
        };
    } catch (error) {
        // If not JSON, treat as plain text system status
        const upperMessage = message.toUpperCase();
        
        // Map common variations
        const statusMap = {
            'DISCONNECTED': SYSTEM_STATUS.DISCONNECTED,
            'INITIALIZING': SYSTEM_STATUS.INITIALIZING,
            'IDLE CONNECTED': SYSTEM_STATUS.IDLE_CONNECTED,
            'IDLE_CONNECTED': SYSTEM_STATUS.IDLE_CONNECTED,
            'STARTING NAVI': SYSTEM_STATUS.STARTING_NAV,
            'STARTING_NAV': SYSTEM_STATUS.STARTING_NAV,
            'READY': SYSTEM_STATUS.READY,
            'SLAM ACTIVE': SYSTEM_STATUS.SLAM_ACTIVE,
            'SLAM_ACTIVE': SYSTEM_STATUS.SLAM_ACTIVE,
            'SLAM PAUSED': SYSTEM_STATUS.SLAM_PAUSED,
            'SLAM_PAUSED': SYSTEM_STATUS.SLAM_PAUSED,
            'SYSTEM ERROR': SYSTEM_STATUS.SYSTEM_ERROR,
            'SYSTEM_ERROR': SYSTEM_STATUS.SYSTEM_ERROR
        };
        
        return {
            systemStatus: statusMap[upperMessage] || upperMessage || 'UNKNOWN',
        };
    }
}

function initRobotStatusSubscriber(ros, wss) {

    const robotStatusListener = new ROSLIB.Topic({
        ros: ros,
        name: '/robot/status',
        messageType: 'std_msgs/String'
    });

    robotStatusListener.subscribe((message) => {
        try {
            
            // Parse the status message
            const parsedStatus = parseStatusMessage(message.data);
            
            // Update robot status
            robotStatus = {
                systemStatus: parsedStatus.systemStatus,
                lastUpdated: new Date().toISOString()
            };

            // Broadcast to WebSocket clients
            broadcastRobotStatus(wss);

        } catch (error) {
            console.error('Error processing robot status message:', error);
            console.error('Raw message:', message);
        }
    });
}

function broadcastRobotStatus(wss) {
    if (wss && wss.clients) {
        const data = {
            type: 'robotStatus',
            data: {
                ...robotStatus,
                systemStatusColor: getSystemStatusColor(robotStatus.systemStatus),
            }
        };
                
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 = WebSocket.OPEN
                try {
                    client.send(JSON.stringify(data));
                } catch (error) {
                    console.error('Error sending robot status to client:', error);
                }
            }
        });
    }
}

// Function to send current status to a specific client (when they connect)
function sendCurrentStatusToClient(client) {
    if (client && client.readyState === 1) {
        const data = {
            type: 'robotStatus',
            data: {
                ...robotStatus,
                systemStatusColor: getSystemStatusColor(robotStatus.systemStatus),
            }
        };
        
        try {
            client.send(JSON.stringify(data));
        } catch (error) {
            console.error('Error sending current robot status to client:', error);
        }
    }
}

// Function to get current robot status
function getRobotStatus() {
    return {
        ...robotStatus,
        systemStatusColor: getSystemStatusColor(robotStatus.systemStatus),
    };
}



// Function to update mission status (can be called from other parts of the system)
function updateMissionStatus(status) {
    if (Object.values(SYSTEM_STATUS).includes(status)) {
        robotStatus.systemStatus = status;
        robotStatus.lastUpdated = new Date().toISOString();
        console.log('Mission status updated to:', status);
        return true;
    }
    return false;
}

module.exports = {
    initRobotStatusSubscriber,
    getRobotStatus,
    updateMissionStatus,
    broadcastRobotStatus,
    sendCurrentStatusToClient,
    SYSTEM_STATUS
}; 