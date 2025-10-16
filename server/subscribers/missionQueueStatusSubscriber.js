const ROSLIB = require('roslib');

// Mission queue status constants
const MISSION_QUEUE_STATUS = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// Store mission queue status updates
let missionQueueStatusUpdates = [];
const MAX_STATUS_UPDATES = 100;

class MissionQueueStatusSubscriber {
    constructor(rosConnection, wss) {
        this.ros = null;
        this.subscriber = null;
        this.isSubscribed = false;
        this.rosConnection = rosConnection;
        this.wss = wss; // WebSocket server for broadcasting
        
        // Current mission queue status
        this.currentStatus = {
            missionName: null,
            missionId: null,
            missionStatus: MISSION_QUEUE_STATUS.IDLE,
            lastUpdate: new Date().toISOString()
        };
        
        // Bind methods
        this.onMissionQueueStatusUpdate = this.onMissionQueueStatusUpdate.bind(this);
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

    // Start subscription to mission queue status
    startSubscription() {
        if (!this.ros || this.isSubscribed) {
            return;
        }

        try {
            console.log('🔔 Starting mission queue status subscriber on /robot/mission/status');
            
            // Create subscriber
            this.subscriber = new ROSLIB.Topic({
                ros: this.ros,
                name: '/robot/mission/status',
                messageType: 'ntuamr/MissionStatus'
            });

            // Subscribe to topic
            this.subscriber.subscribe(this.onMissionQueueStatusUpdate);
            this.isSubscribed = true;

            console.log('✅ Mission queue status subscriber started successfully');

        } catch (error) {
            console.error('❌ Error starting mission queue status subscriber:', error);
        }
    }

    // Handle mission queue status update messages
    onMissionQueueStatusUpdate(message) {
        try {
            
            // Validate required fields
            if (!message.execution_id || !message.mission_name || message.status === undefined) {
                console.warn('⚠️ Invalid mission queue status message - missing required fields');
                return;
            }

            // Create status update object
            const statusUpdate = {
                id: Date.now() + Math.random(), // Unique ID for tracking
                timestamp: new Date().toISOString(),
                execution_id: message.execution_id,
                mission_name: message.mission_name,
                status: parseInt(message.status),
                statusName: this.getStatusName(parseInt(message.status))
            };

            // Update current status
            this.currentStatus = {
                missionName: statusUpdate.mission_name,
                missionId: statusUpdate.execution_id,
                missionStatus: statusUpdate.status,
                lastUpdate: statusUpdate.timestamp
            };

            // Add to updates list
            missionQueueStatusUpdates.unshift(statusUpdate);
            
            // Keep only recent updates
            if (missionQueueStatusUpdates.length > MAX_STATUS_UPDATES) {
                missionQueueStatusUpdates = missionQueueStatusUpdates.slice(0, MAX_STATUS_UPDATES);
            }

    

            // Emit event for other parts of the application
            this.emitMissionQueueStatusUpdate(statusUpdate);

        } catch (error) {
            console.error('❌ Error processing mission queue status update:', error);
        }
    }

    // Get status name from status code
    getStatusName(statusCode) {
        switch (parseInt(statusCode)) {
            case 0: return 'PENDING';
            case 1: return 'RUNNING';
            case 2: return 'PAUSED';
            case 3: return 'COMPLETED';
            case 4: return 'FAILED';
            case 5: return 'CANCELLED';
            default: return 'UNKNOWN';
        }
    }

    // Emit mission queue status update event
    emitMissionQueueStatusUpdate(statusUpdate) {
        // Broadcast to all connected WebSocket clients
        if (this.wss) {
            const message = {
                type: 'mission_queue_status',
                data: statusUpdate,
                timestamp: new Date().toISOString()
            };
            
            this.wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    try {
                        client.send(JSON.stringify(message));
                    } catch (error) {
                        console.error('Error sending mission queue status to client:', error);
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
                console.log('🛑 Mission queue status subscriber stopped');
            } catch (error) {
                console.error('❌ Error stopping mission queue status subscriber:', error);
            }
        }
    }

    // Get current mission queue status
    getCurrentStatus() {
        return { ...this.currentStatus };
    }

    // Get recent status updates
    getRecentStatusUpdates(limit = 10) {
        return missionQueueStatusUpdates.slice(0, limit);
    }

    // Get status updates by status
    getStatusUpdatesByStatus(status) {
        return missionQueueStatusUpdates.filter(update => update.queueStatus === status);
    }

    // Clear all status updates
    clearStatusUpdates() {
        missionQueueStatusUpdates = [];
        console.log('🗑️ Mission queue status updates cleared');
    }

    // Reset current status
    resetStatus() {
        this.currentStatus = {
            currentMission: null,
            queueStatus: MISSION_QUEUE_STATUS.IDLE,
            progress: 0,
            startTime: null,
            endTime: null,
            errorMessage: null,
            queueLength: 0,
            pendingCount: 0,
            runningCount: 0,
            completedCount: 0,
            lastUpdate: new Date().toISOString()
        };
        console.log('🔄 Mission queue status reset');
    }

    // Get subscriber status
    getStatus() {
        return {
            isSubscribed: this.isSubscribed,
            isConnected: this.ros ? true : false,
            updateCount: missionQueueStatusUpdates.length,
            lastUpdate: missionQueueStatusUpdates.length > 0 ? missionQueueStatusUpdates[0].timestamp : null,
            currentStatus: this.currentStatus.queueStatus
        };
    }
}

// Create singleton instance
let missionQueueStatusSubscriber = null;

// Initialize subscriber
function initMissionQueueStatusSubscriber(rosConnection, wss) {
    if (!missionQueueStatusSubscriber) {
        missionQueueStatusSubscriber = new MissionQueueStatusSubscriber(rosConnection, wss);
        missionQueueStatusSubscriber.init();
    }
    return missionQueueStatusSubscriber;
}

// Get subscriber instance
function getMissionQueueStatusSubscriber() {
    return missionQueueStatusSubscriber;
}

// Get current mission queue status (for backward compatibility)
function getCurrentMissionQueueStatus() {
    if (missionQueueStatusSubscriber) {
        return missionQueueStatusSubscriber.getCurrentStatus();
    }
    return null;
}

// Reset mission queue status (for backward compatibility)
function resetMissionQueueStatus() {
    if (missionQueueStatusSubscriber) {
        missionQueueStatusSubscriber.resetStatus();
    }
}

// Export functions and constants
module.exports = {
    MissionQueueStatusSubscriber,
    initMissionQueueStatusSubscriber,
    getMissionQueueStatusSubscriber,
    getCurrentMissionQueueStatus,
    resetMissionQueueStatus,
    MISSION_QUEUE_STATUS
}; 