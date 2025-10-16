const ROSLIB = require('roslib');

// Mission status constants
const MISSION_STATUS = {
    PENDING: 0,
    RUNNING: 1,
    COMPLETED: 2,
    FAILED: 3,
    CANCELED: 4
};

// Priority constants
const PRIORITY = {
    IdlePriority: 0,
    LowestPriority: 1,
    LowPriority: 2,
    NormalPriority: 3,
    HighPriority: 4,
    HighestPriority: 5,
    TimeCriticalPriority: 6,
    InheritPriority: 7
};

// Store mission queue updates
let missionQueueUpdates = [];
const MAX_UPDATES = 100;

class MissionQueueAddedSubscriber {
    constructor(rosConnection, wss) {
        this.ros = null;
        this.subscriber = null;
        this.isSubscribed = false;
        this.rosConnection = rosConnection;
        this.wss = wss; // WebSocket server for broadcasting
        
        // Bind methods
        this.onMissionAdded = this.onMissionAdded.bind(this);
        this.startSubscription = this.startSubscription.bind(this);
        this.stopSubscription = this.stopSubscription.bind(this);
    }

    // Initialize subscription when ROS connection is available
    init() {
        if (this.rosConnection && this.rosConnection.isConnected()) {
            this.ros = this.rosConnection.getRos();
            this.startSubscription();
        } else {
            // Wait for ROS connection
            this.rosConnection.onConnect((ros) => {
                this.ros = ros;
                this.startSubscription();
            });
        }
    }

    // Start subscription to mission queue added
    startSubscription() {
        if (!this.ros || this.isSubscribed) {
            return;
        }

        try {
            console.log('🔔 Starting mission queue subscriber on /robot/mission/added');
            
            // Create custom message type for mission queue update
            const missionUpdateMessageType = {
                execution_id: 'string',
                mission_name: 'string',
                status: 'int16',
                priority: 'int16'
            };

            // Create subscriber
            this.subscriber = new ROSLIB.Topic({
                ros: this.ros,
                name: '/robot/mission/added',
                messageType: 'ntuamr/MissionQueueAdded' // Using String for now, will parse JSON
            });

            // Subscribe to topic
            this.subscriber.subscribe(this.onMissionAdded);
            this.isSubscribed = true;


        } catch (error) {
            console.error('❌ Error starting mission queue added subscriber:', error);
        }
    }

    // Handle mission queue update messages
    onMissionAdded(message) {
        try {
            
            let missionData;
            
            // Parse message data
            if (typeof message.data === 'string') {
                try {
                    missionData = JSON.parse(message.data);
                } catch (parseError) {
                    console.error('❌ Error parsing mission added JSON:', parseError);
                    return;
                }
            } else {
                missionData = message;
            }

            // Validate required fields
            if (!missionData.execution_id || !missionData.mission_name) {
                console.warn('⚠️ Invalid mission added message - missing required fields');
                return;
            }

            // Create mission update object
            const missionAdded = {
                id: Date.now() + Math.random(), // Unique ID for tracking
                timestamp: new Date().toISOString(),
                execution_id: missionData.execution_id,
                mission_name: missionData.mission_name,
                status: parseInt(missionData.status) || MISSION_STATUS.PENDING,
                priority: parseInt(missionData.priority) || PRIORITY.NormalPriority,
                statusName: this.getStatusName(missionData.status),
                priorityName: this.getPriorityName(missionData.priority)
            };

            // Add to updates list
            missionQueueUpdates.unshift(missionAdded);
            
            // Keep only recent updates
            if (missionQueueUpdates.length > MAX_UPDATES) {
                missionQueueUpdates = missionQueueUpdates.slice(0, MAX_UPDATES);
            }


            // Emit event for other parts of the application
            this.emitMissionAdded(missionAdded);

        } catch (error) {
            console.error('❌ Error processing mission queue added:', error);
        }
    }

    // Get status name from status code
    getStatusName(statusCode) {
        const status = parseInt(statusCode);
        switch (status) {
            case MISSION_STATUS.PENDING: return 'PENDING';
            case MISSION_STATUS.RUNNING: return 'RUNNING';
            case MISSION_STATUS.COMPLETED: return 'COMPLETED';
            case MISSION_STATUS.FAILED: return 'FAILED';
            case MISSION_STATUS.CANCELED: return 'CANCELED';
            default: return 'UNKNOWN';
        }
    }

    // Get priority name from priority code
    getPriorityName(priorityCode) {
        const priority = parseInt(priorityCode);
        switch (priority) {
            case PRIORITY.IdlePriority: return 'Idle';
            case PRIORITY.LowestPriority: return 'Lowest';
            case PRIORITY.LowPriority: return 'Low';
            case PRIORITY.NormalPriority: return 'Normal';
            case PRIORITY.HighPriority: return 'High';
            case PRIORITY.HighestPriority: return 'Highest';
            case PRIORITY.TimeCriticalPriority: return 'Time Critical';
            case PRIORITY.InheritPriority: return 'Inherit';
            default: return 'Unknown';
        }
    }

    // Emit mission update event
    emitMissionAdded(missionAdded) {
        // Broadcast to all connected WebSocket clients
        if (this.wss) {
            const message = {
                type: 'mission_queue_added',
                data: missionAdded,
                timestamp: new Date().toISOString()
            };
            
            this.wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    try {
                        client.send(JSON.stringify(message));
                    } catch (error) {
                        console.error('Error sending mission added to client:', error);
                    }
                }
            });
            
        }
    }

    // Stop subscription
    stopSubscription() {
        if (this.subscriber && this.isSubscribed) {
            try {
                this.subscriber.unsubscribe();
                this.subscriber = null;
                this.isSubscribed = false;
            } catch (error) {
                console.error('❌ Error stopping mission queue added subscriber:', error);
            }
        }
    }

    // Get recent mission updates
    getRecentUpdates(limit = 10) {
        return missionQueueUpdates.slice(0, limit);
    }

    // Get updates by execution ID
    getUpdatesByExecutionId(executionId) {
        return missionQueueUpdates.filter(update => update.execution_id === executionId);
    }

    // Get updates by status
    getUpdatesByStatus(status) {
        return missionQueueUpdates.filter(update => update.status === status);
    }

    // Clear all updates
    clearUpdates() {
        missionQueueUpdates = [];
    }

    // Get subscriber status
    getStatus() {
        return {
            isSubscribed: this.isSubscribed,
            isConnected: this.ros ? true : false,
            updateCount: missionQueueUpdates.length,
            lastUpdate: missionQueueUpdates.length > 0 ? missionQueueUpdates[0].timestamp : null
        };
    }
}

// Create singleton instance
let missionQueueAddedSubscriber = null;

// Initialize subscriber
function initMissionQueueAddedSubscriber(rosConnection, wss) {
    if (!missionQueueAddedSubscriber) {
        missionQueueAddedSubscriber = new MissionQueueAddedSubscriber(rosConnection, wss);
        missionQueueAddedSubscriber.init();
    }
    return missionQueueAddedSubscriber;
}

// Get subscriber instance
function getMissionQueueAddedSubscriber() {
    return missionQueueAddedSubscriber;
}

// Export functions and constants
module.exports = {
    MissionQueueAddedSubscriber,
    initMissionQueueAddedSubscriber,
    getMissionQueueAddedSubscriber,
    MISSION_STATUS,
    PRIORITY
}; 