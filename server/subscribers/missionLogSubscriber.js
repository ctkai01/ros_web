const ROSLIB = require('roslib');

// Mission log storage
let missionLogs = [];
const MAX_LOGS = 1000; // Limit number of stored logs

// Log level constants (matching rosgraph_msgs/Log)
const LOG_LEVELS = {
    DEBUG: 1,
    INFO: 2,
    WARN: 4,
    ERROR: 8,
    FATAL: 16
};

// Helper function to get log level name
function getLogLevelName(level) {
    switch(level) {
        case LOG_LEVELS.DEBUG: return 'SUCCESS';
        case LOG_LEVELS.INFO: return 'INFO';
        case LOG_LEVELS.WARN: return 'WARN';
        case LOG_LEVELS.ERROR: return 'ERROR';
        case LOG_LEVELS.FATAL: return 'FATAL';
        default: return 'UNKNOWN';
    }
}

// Helper function to format timestamp
function formatTimestamp(header) {
    if (header && header.stamp) {
        const secs = header.stamp.secs || 0;
        const nsecs = header.stamp.nsecs || 0;
        const totalMs = secs * 1000 + nsecs / 1000000;
        return new Date(totalMs).toISOString();
    }
    return new Date().toISOString();
}

function initMissionLogSubscriber(ros, wss) {
    console.log('Initializing mission log subscriber...');

    const missionLogListener = new ROSLIB.Topic({
        ros: ros,
        name: '/mission_log',
        messageType: 'rosgraph_msgs/Log'
    });

    missionLogListener.subscribe((message) => {
        try {
            // Parse the log message
            const logEntry = {
                timestamp: formatTimestamp(message.header),
                level: message.level || LOG_LEVELS.INFO,
                levelName: getLogLevelName(message.level),
                name: message.name || 'unknown',
                message: message.msg || '',
                file: message.file || '',
                function: message.function || '',
                line: message.line || 0,
                topics: message.topics || [],
                receivedAt: new Date().toISOString()
            };

            // Add to logs array
            missionLogs.push(logEntry);

            // Keep only the last MAX_LOGS entries
            if (missionLogs.length > MAX_LOGS) {
                missionLogs = missionLogs.slice(-MAX_LOGS);
            }

            // Log to console based on level
            const consoleMessage = `[${logEntry.levelName}] ${logEntry.name}: ${logEntry.message}`;
            switch(logEntry.level) {
                case LOG_LEVELS.DEBUG:
                    console.debug(consoleMessage);
                    break;
                case LOG_LEVELS.INFO:
                    console.info(consoleMessage);
                    break;
                case LOG_LEVELS.WARN:
                    console.warn(consoleMessage);
                    break;
                case LOG_LEVELS.ERROR:
                case LOG_LEVELS.FATAL:
                    console.error(consoleMessage);
                    break;
                default:
                    console.log(consoleMessage);
            }

            // Broadcast to WebSocket clients
            broadcastMissionLog(wss, logEntry);

        } catch (error) {
            console.error('Error processing mission log message:', error);
            console.error('Raw message:', message);
        }
    });

    console.log('Mission log subscriber initialized');
}

function broadcastMissionLog(wss, logEntry) {
    if (wss.clients) {
        const data = {
            type: 'missionLog',
            data: logEntry
        };
        
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 = WebSocket.OPEN
                try {
                    client.send(JSON.stringify(data));
                } catch (error) {
                    console.error('Error sending mission log to client:', error);
                }
            }
        });
    }
}

function broadcastAllMissionLogs(wss) {
    if (wss.clients) {
        const data = {
            type: 'missionLogHistory',
            data: missionLogs
        };
        
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 = WebSocket.OPEN
                try {
                    client.send(JSON.stringify(data));
                } catch (error) {
                    console.error('Error sending mission log history to client:', error);
                }
            }
        });
    }
}

// Function to get logs with filtering options
function getMissionLogs(options = {}) {
    let filteredLogs = [...missionLogs];

    // Filter by log level
    if (options.level) {
        filteredLogs = filteredLogs.filter(log => log.level >= options.level);
    }

    // Filter by node name
    if (options.name) {
        filteredLogs = filteredLogs.filter(log => 
            log.name.toLowerCase().includes(options.name.toLowerCase())
        );
    }

    // Filter by time range
    if (options.startTime) {
        filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) >= new Date(options.startTime)
        );
    }

    if (options.endTime) {
        filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) <= new Date(options.endTime)
        );
    }

    // Limit results
    if (options.limit) {
        filteredLogs = filteredLogs.slice(-options.limit);
    }

    return filteredLogs;
}

// Function to clear logs
function clearMissionLogs() {
    missionLogs = [];
    console.log('Mission logs cleared');
}

module.exports = {
    initMissionLogSubscriber,
    getMissionLogs,
    clearMissionLogs,
    broadcastAllMissionLogs,
    LOG_LEVELS
}; 