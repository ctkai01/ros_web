const ROSLIB = require('roslib');

// Store pending dialog requests (shared with API)
let pendingDialogRequests = new Map();

// Dialog response publisher
let dialogResponsePublisher = null;

/**
 * Initialize dialog subscriber and publisher
 * @param {ROSLIB.Ros} ros - ROS connection
 * @param {WebSocket.Server} wss - WebSocket server for broadcasting
 */
function initDialogSubscriber(ros, wss) {
    console.log('Initializing dialog subscriber...');

    // Initialize publisher for sending responses back to robot
    dialogResponsePublisher = new ROSLIB.Topic({
        ros: ros,
        name: '/robot/dialog/variable/response',
        messageType: 'ntuamr/UIDialogResponse'
    });

    // Subscribe to dialog requests from robot
    const dialogRequestListener = new ROSLIB.Topic({
        ros: ros,
        name: '/robot/dialog/variable/request',
        messageType: 'ntuamr/UIDialogRequest'
    });

    // Subscribe to dialog cancel requests from robot
    const dialogCancelListener = new ROSLIB.Topic({
        ros: ros,
        name: '/robot/dialog/variable/cancel',
        messageType: 'ntuamr/UIDialogRequest'
    });

    dialogRequestListener.subscribe(async (message) => {
        try {

            // Kiểm tra request_id, bỏ qua nếu null hoặc undefined
            if (!message.request_id) {
                console.log('🔍 SERVER DEBUG - request_id is null/undefined, skipping...');
                return;
            }

            // Extract request data
            const requestId = message.request_id;
            let dialogMessage = message.message;
            let fieldType = '';
            let value = '';
            let config = null;
            let title = 'Robot Request';
            let rawMessage = null;

            // Kiểm tra type ngay từ đầu
            try {
                const parsedMessage = JSON.parse(dialogMessage);

                // Kiểm tra type trước tiên
                if (parsedMessage.type) {
                    fieldType = parsedMessage.type;
                    console.log('🔍 SERVER DEBUG - Set fieldType from JSON:', fieldType);
                    console.log('🔍 SERVER DEBUG - fieldType.toUpperCase():', fieldType.toUpperCase());

                                    // Xử lý message type trước (read-only)
                if (fieldType.toLowerCase() === 'message') {
                    config = {
                        type: 'message',
                        defaultValue: parsedMessage.message || 'No message available',
                        readOnly: true,
                        helpText: 'Message',
                        placeholder: 'Message',
                        options: [],
                        needsPositions: false,
                        needsMarkers: false,
                        needsIterations: false
                    };
                    console.log('🔍 SERVER DEBUG - Message config set:', config);
                }
                }

                if (parsedMessage.title) {
                    title = parsedMessage.title;
                }

                // Parse message content
                if (parsedMessage.message) {
                    try {
                        const messageContent = JSON.parse(parsedMessage.message);
                        rawMessage = parsedMessage.message; // Lưu raw message

                        // Parse message array - chỉ tìm item có is_current: true
                        if (messageContent && Array.isArray(messageContent)) {
                            const messageArray = messageContent;

                            // Chỉ tìm 1 item có is_current: true, bỏ qua tất cả các item khác
                            const currentItem = messageArray.find(item => item.is_current === true);

                            if (currentItem) {
                                // Lấy text từ current item
                                if (currentItem.text) {
                                    dialogMessage = currentItem.text;
                                }
                                if (currentItem.value) {
                                    value = currentItem.value;
                                }
                            }
                        }
                    } catch (messageParseError) {
                        console.log('Message content is not JSON, using as text:', messageParseError.message);
                        dialogMessage = parsedMessage.message;
                    }
                }

            } catch (parseError) {
                console.log('Message is not JSON, treating as simple text:', parseError.message);

                // Fallback: Cố gắng parse format "FIELD_TYPE:message"
                if (dialogMessage.includes(':')) {
                    const parts = dialogMessage.split(':', 2);
                    const possibleFieldType = parts[0].toLowerCase();
                    const actualMessage = parts[1].trim();

                    fieldType = possibleFieldType;
                    dialogMessage = actualMessage;
                }
            }

            // Lấy config dựa trên field type với label từ dialogMessage
            if (fieldType && fieldType.toLowerCase() !== 'message') {
                const dialogFields = PREDEFINED_DIALOG_FIELDS(dialogMessage);

                if (dialogFields[fieldType.toUpperCase()]) {
                    config = { ...dialogFields[fieldType.toUpperCase()] };
                    console.log('🔍 SERVER DEBUG - config after assignment:', config);

                    // Xử lý các loại đặc biệt cần fetch data từ web UI
                    if (fieldType.toLowerCase() === 'position') {
                        config.needsPositions = true;
                        config.type = 'combobox';
                        if (value) {
                            config.defaultValue = value;
                        }
                    }

                    if (fieldType.toLowerCase() === 'marker') {
                        config.needsMarkers = true;
                        config.type = 'combobox';
                        if (value) {
                            config.defaultValue = value;
                        }
                    }

                    // Xử lý các loại number có validation
                    if (fieldType.toLowerCase() === 'double') {
                        config.step = 0.1;
                        if (value) {
                            config.defaultValue = value;
                        }
                    }

                    if (fieldType.toLowerCase() === 'int') {
                        config.step = 1;
                        if (value) {
                            config.defaultValue = value;
                        }
                    }

                    if (fieldType.toLowerCase() === 'value') {
                        config.step = 1;
                        if (value) {
                            config.defaultValue = value;
                        }
                    }

                    if (fieldType.toLowerCase() === 'time') {
                        console.log('🔍 SERVER DEBUG - Processing TIME field, config.type before:', config.type);
                        config.step = 0.1;
                        if (value) {
                            config.defaultValue = value;
                        }
                        console.log('🔍 SERVER DEBUG - Processing TIME field, config.type after:', config.type);
                    }
                    if (fieldType.toLowerCase() === 'description') {
                        config.type = 'description';
                        config.defaultValue = value;
                    }

                    // Xử lý message type (read-only)
                    if (fieldType.toLowerCase() === 'message') {
                        config.readOnly = true;
                        config.defaultValue = dialogMessage;
                    }
                } else {
                    console.log('🔍 SERVER DEBUG - Field type not found in PREDEFINED_DIALOG_FIELDS:', fieldType);
                }
            } else {
                console.log('🔍 SERVER DEBUG - No field type detected');
            }


            // Store the pending request
            pendingDialogRequests.set(requestId, {
                message: dialogMessage,
                title: title,
                field_type: fieldType,
                field_config: config,
                value: value, // Position ID hoặc value từ is_current item
                raw_message: rawMessage, // Lưu raw message để parse sau
                timestamp: Date.now(),
                status: 'pending',
                source: 'ros' // Indicate this came from ROS
            });



            console.log('🔍 SERVER DEBUG - Pending dialog requests:', pendingDialogRequests);
            // Cleanup old requests (older than 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            for (const [id, request] of pendingDialogRequests.entries()) {
                if (request.timestamp < fiveMinutesAgo) {
                    pendingDialogRequests.delete(id);
                }
            }

            // Broadcast to web clients via WebSocket
            broadcastDialogUpdate(wss);

        } catch (error) {
            console.error('Error processing dialog request:', error);
        }
    });

    // Handle dialog cancel requests from robot
    dialogCancelListener.subscribe((message) => {
        try {

            const requestId = message.request_id;

            if (!requestId) {
                return;
            }

            // Check if request exists
            if (pendingDialogRequests.has(requestId)) {
                // Remove from pending requests
                pendingDialogRequests.delete(requestId);

                // Broadcast update to web clients
                broadcastDialogUpdate(wss);

            } else {
            }

        } catch (error) {
            console.error('Error processing dialog cancel request:', error);
        }
    });

    console.log('Dialog subscriber initialized');
}

/**
 * Send dialog response back to robot
 * @param {string} requestId - Request ID
 * @param {string} response - User response
 * @returns {boolean} Success status
 */
function sendDialogResponse(requestId, response) {
    try {
        if (!dialogResponsePublisher) {
            console.error('Dialog response publisher not initialized');
            return false;
        }

        const request = pendingDialogRequests.get(requestId);
        if (!request) {
            console.error(`Dialog request not found: ${requestId}`);
            return false;
        }

        // Parse the structured response from UI
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(response);
        } catch (parseError) {
            // Fallback for old format
            parsedResponse = {
                value: response,
                accepted: true
            };
        }

        // Create response message with structured format
        const responseMessage = new ROSLIB.Message({
            request_id: requestId,
            response: JSON.stringify(parsedResponse)
        });

        // Publish response to robot
        dialogResponsePublisher.publish(responseMessage);

        // Remove from pending requests after successful response
        pendingDialogRequests.delete(requestId);

        console.log(`Dialog response sent to robot: ${requestId} -> ${JSON.stringify(parsedResponse)}`);
        return true;

    } catch (error) {
        console.error('Error sending dialog response:', error);
        return false;
    }
}

/**
 * Cancel dialog request
 * @param {string} requestId - Request ID
 * @returns {boolean} Success status
 */
function cancelDialogRequest(requestId) {
    try {
        if (!dialogResponsePublisher) {
            console.error('Dialog response publisher not initialized');
            return false;
        }

        const request = pendingDialogRequests.get(requestId);
        if (!request) {
            console.error(`Dialog request not found: ${requestId}`);
            return false;
        }

        // Create cancellation message with structured format
        const cancelResponse = {
            value: '',
            accepted: false
        };

        const responseMessage = new ROSLIB.Message({
            request_id: requestId,
            response: JSON.stringify(cancelResponse)
        });

        // Publish cancellation to robot
        dialogResponsePublisher.publish(responseMessage);

        // Remove from pending requests
        pendingDialogRequests.delete(requestId);

        console.log(`Dialog request cancelled: ${requestId} -> ${JSON.stringify(cancelResponse)}`);
        return true;

    } catch (error) {
        console.error('Error cancelling dialog request:', error);
        return false;
    }
}

/**
 * Broadcast dialog updates to web clients
 * @param {WebSocket.Server} wss - WebSocket server
 */
function broadcastDialogUpdate(wss) {
    if (wss && wss.clients) {
        const pendingRequests = Array.from(pendingDialogRequests.entries()).map(([id, request]) => ({
            request_id: id,
            message: request.message,
            title: request.title,
            field_type: request.field_type,
            field_config: request.field_config,
            value: request.value,
            raw_message: request.raw_message,
            timestamp: request.timestamp,
            status: request.status
        }));

        const data = {
            type: 'dialogUpdate',
            data: pendingRequests
        };

        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 = WebSocket.OPEN
                client.send(JSON.stringify(data));
            }
        });
    }
}

/**
 * Get all pending dialog requests
 * @returns {Array} Array of pending requests
 */
function getPendingDialogRequests() {
    return Array.from(pendingDialogRequests.entries()).map(([id, request]) => ({
        request_id: id,
        message: request.message,
        title: request.title,
        field_type: request.field_type,
        field_config: request.field_config,
        value: request.value,
        raw_message: request.raw_message,
        timestamp: request.timestamp,
        status: request.status
    }));
}

/**
 * Get specific dialog request
 * @param {string} requestId - Request ID
 * @returns {Object|null} Request data or null if not found
 */
function getDialogRequest(requestId) {
    const request = pendingDialogRequests.get(requestId);
    if (!request) return null;

    return {
        request_id: requestId,
        message: request.message,
        title: request.title,
        field_type: request.field_type,
        field_config: request.field_config,
        value: request.value,
        raw_message: request.raw_message,
        timestamp: request.timestamp,
        status: request.status,
        response: request.response,
        responseTimestamp: request.responseTimestamp
    };
}

/**
 * Generate UUID for request IDs
 * @returns {string} UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



// Predefined field configurations for all robot dialog types
const PREDEFINED_DIALOG_FIELDS = (label) => ({
    // Position/Marker Types
    POSITION: {
        name: 'position',
        label: label || 'Select Position',
        type: 'combobox',
        defaultValue: '0',
        placeholder: 'Choose a position from the map',
        options: [],
        helpText: 'Select target position from map',
        needsPositions: true
    },

    MARKER: {
        name: 'marker',
        label: label || 'Select Marker',
        type: 'combobox',
        defaultValue: '0',
        placeholder: 'Choose a marker',
        options: [],
        helpText: 'Select target marker',
        needsMarkers: true
    },

    // Integer Types
    INT: {
        name: 'int',
        label: label || 'Enter Integer Value',
        type: 'number',
        defaultValue: '0',
        placeholder: 'Enter a whole number',
        helpText: 'Enter integer value'
    },

    TIME: {
        name: 'time',
        label: label || 'Enter Time',
        type: 'time',
        defaultValue: '1',
        placeholder: 'Enter time',
        min: 0.1,
        helpText: 'Enter time in seconds'
    },

    ITERATIONS: {
        name: 'iterations',
        label: label || 'Enter Number of Iterations',
        type: 'number',
        defaultValue: '1',
        placeholder: 'Enter number of loops',
        min: 1,
        helpText: 'Enter number of iterations'
    },

    LOOP: {
        name: 'loop',
        label: label || 'Enter Loop Count',
        type: 'number',
        defaultValue: '1',
        placeholder: 'Enter loop count',
        min: -1,
        max: 1000,
        helpText: 'Enter number of times to repeat the loop'
    },

    USERGROUPID: {
        name: 'usergroupid',
        label: label || 'Enter User Group ID',
        type: 'number',
        defaultValue: '1',
        placeholder: 'Enter user group ID',
        min: 1,
        helpText: 'Enter user group ID'
    },

    IDMISSION: {
        name: 'idmission',
        label: label || 'Enter Mission ID',
        type: 'number',
        defaultValue: '1',
        placeholder: 'Enter mission ID',
        min: 1,
        helpText: 'Enter mission ID'
    },

    // Double Types
    DOUBLE: {
        name: 'double',
        label: label || 'Enter Number',
        type: 'double',
        defaultValue: '0.0',
        placeholder: 'Enter a decimal number',
        step: 0.1,
        helpText: 'Enter decimal number'
    },

    // Boolean Types
    BOOL: {
        name: 'bool',
        label: label || 'Select Option',
        type: 'combobox',
        defaultValue: 'true',
        placeholder: 'Select true or false',
        options: [
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' }
        ],
        helpText: 'Select true or false'
    },

    // Logic/Control Types
    COMPARE: {
        name: 'compare',
        label: label || 'Select Variable to Compare',
        type: 'combobox',
        defaultValue: '0',
        placeholder: 'Select variable',
        options: [
            { value: '0', label: 'Battery Percentage' },
            { value: '1', label: 'I/O Input' },
            { value: '2', label: 'Pending Mission' },
            { value: '3', label: 'PLC Register' }
        ],
        helpText: 'Select variable to compare'
    },

    OPERATOR: {
        name: 'operator',
        label: label || 'Select Comparison Operator',
        type: 'combobox',
        defaultValue: '3',
        placeholder: 'Select',
        options: [
            { value: '0', label: '!=' },
            { value: '1', label: '<' },
            { value: '2', label: '<=' },
            { value: '3', label: '==' },
            { value: '4', label: '>' },
            { value: '5', label: '>=' }
        ],
        helpText: 'Select comparison operator'
    },

    VALUE: {
        name: 'value',
        label: label || 'Enter Comparison Value',
        type: 'int',
        defaultValue: '',
        placeholder: 'Enter value to compare against',
        helpText: 'Enter comparison value'
    },

    INDICATOR: {
        name: 'indicator',
        label: label || 'Select Condition Indicator',
        type: 'combobox',
        defaultValue: 'success',
        placeholder: 'Select indicator',
        options: [
            { value: 'success', label: 'Success' },
            { value: 'error', label: 'Error' },
            { value: 'warning', label: 'Warning' },
            { value: 'info', label: 'Info' }
        ],
        helpText: 'Select condition indicator'
    },

    // Text/String Types
    QUESTION: {
        name: 'question',
        label: label || 'Enter Question',
        type: 'text',
        defaultValue: '',
        placeholder: 'Enter your question',
        helpText: 'Enter question for user'
    },

    DESCRIPTION: {
        name: 'description',
        label: label || 'Enter Description',
        type: 'text',
        defaultValue: '',
        placeholder: 'Enter description',
        helpText: 'Enter description'
    },

    // Dialog Types
    PROMPTUSER: {
        name: 'promptuser',
        label: label || 'Confirm Action',
        type: 'combobox',
        defaultValue: 'yes',
        placeholder: 'Select yes or no',
        options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
        ],
        helpText: 'Confirm action with yes or no'
    },

    MESSAGE: {
        name: 'message',
        label: label || 'Display Message',
        type: 'message',
        defaultValue: '',
        placeholder: 'Message to display',
        readOnly: true,
        helpText: 'Display message (read-only)'
    },

    // Legacy/Compatibility Types
    RETRIES: {
        name: 'retries',
        label: label || 'Retries',
        type: 'number',
        defaultValue: '10',
        placeholder: 'Number of retry attempts',
        min: 1,
        max: 100,
        helpText: 'Number of retry attempts (1-100)'
    },

    DISTANCE_THRESHOLD: {
        name: 'distance_threshold',
        label: label || 'Distance Threshold (in meters)',
        type: 'number',
        defaultValue: '0.1',
        placeholder: 'Distance threshold (meters, min: 0.1)',
        min: 0.1,
        max: 2,
        helpText: 'Distance threshold in meters (minimum 0.1)'
    }
});

// Export functions for use by API and main server
module.exports = {
    initDialogSubscriber,
    sendDialogResponse,
    cancelDialogRequest,
    getPendingDialogRequests,
    getDialogRequest,
    broadcastDialogUpdate,
    // Export the requests Map for API access
    getPendingRequestsMap: () => pendingDialogRequests,
    setPendingRequestsMap: (map) => { pendingDialogRequests = map; }
};
