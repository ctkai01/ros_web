const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware');
const dialogSubscriber = require('../../subscribers/dialogSubscriber');

// Get shared pending dialog requests from subscriber
const getPendingDialogRequests = () => dialogSubscriber.getPendingRequestsMap();

// Dialog field types
const DIALOG_FIELD_TYPES = {
  TEXT: 'text',
  INT: 'int',
  DOUBLE: 'double',
  COMBOBOX: 'combobox',
  POSITION: 'position',
  COMPARE: 'compare',
  TIME: 'time'
};

// Predefined field configurations
const PREDEFINED_DIALOG_FIELDS = {
  POSITION: {
    name: 'position',
    label: 'Position',
    type: DIALOG_FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select position',
    options: [],
    helpText: 'Select target position'
  },
  
  RETRIES: {
    name: 'retries',
    label: 'Retries',
    type: DIALOG_FIELD_TYPES.INT,
    defaultValue: '10',
    placeholder: 'Number of retry attempts',
    min: 1,
    max: 100,
    helpText: 'Number of retry attempts (1-100)'
  },
  
  DISTANCE_THRESHOLD: {
    name: 'distance_threshold',
    label: 'Distance Threshold (in meters)',
    type: DIALOG_FIELD_TYPES.DOUBLE,
    defaultValue: '0.1',
    placeholder: 'Distance threshold (meters, min: 0.1)',
    min: 0.1,
    max: 2,
    helpText: 'Distance threshold in meters (minimum 0.1)'
  },

  COMPARE: {
    name: 'compare',
    label: 'Compare',
    type: DIALOG_FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select',
    options: [
      { value: '0', label: 'Battery Percentage' },
      { value: '1', label: 'I/O Input' },
      { value: '2', label: 'Pending Mission' },
      { value: '3', label: 'PLC Register' }
    ],
    helpText: 'Compare input'
  },

  OPERATOR: {
    name: 'operator',
    label: 'Operator',
    type: DIALOG_FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select',
    options: [
      { value: '0', label: '!=' },
      { value: '1', label: '<' },
      { value: '2', label: '<=' },
      { value: '3', label: '==' },
      { value: '4', label: '>' },
      { value: '5', label: '>=' }
    ],
    helpText: 'Operator of the input'
  },

  VALUE: {
    name: 'value',
    label: 'Value',
    type: DIALOG_FIELD_TYPES.INT,
    defaultValue: '0',
    placeholder: 'Enter value',
    helpText: 'Value of the input'
  },

  MARKER: {
    name: 'marker',
    label: 'Marker',
    type: DIALOG_FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select marker',
    options: [],
    helpText: 'Select target marker'
  }
};

// POST /api/dialog/variable/request - Robot gửi dialog request
router.post('/variable/request', authenticateToken, async (req, res) => {
    try {
        const { request_id, message, field_type, field_config, options } = req.body;
        
        console.log('Dialog request received:', { request_id, message, field_type, field_config });
        
        if (!request_id || !message) {
            return res.status(400).json({
                error: 'Missing required fields: request_id, message'
            });
        }
        
        // Determine field configuration
        let config = field_config;
        if (field_type && PREDEFINED_DIALOG_FIELDS[field_type.toUpperCase()]) {
            config = { ...PREDEFINED_DIALOG_FIELDS[field_type.toUpperCase()] };
            if (options && Array.isArray(options)) {
                config.options = options;
            }
        }
        
        // Store the pending request in shared Map
        const pendingRequests = getPendingDialogRequests();
        pendingRequests.set(request_id, {
            message,
            field_type: field_type || 'text',
            field_config: config,
            timestamp: Date.now(),
            status: 'pending',
            source: 'api' // Indicate this came from API
        });
        
        // Clean up old requests (older than 5 minutes)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        for (const [id, request] of pendingRequests.entries()) {
            if (request.timestamp < fiveMinutesAgo) {
                pendingRequests.delete(id);
                console.log(`Cleaned up old dialog request: ${id}`);
            }
        }
        
        console.log(`Dialog request stored with ID: ${request_id}`);
        console.log(`Total pending requests: ${pendingRequests.size}`);
        
        res.json({
            success: true,
            message: 'Dialog request received and stored',
            request_id: request_id
        });
        
    } catch (error) {
        console.error('Error handling dialog request:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// GET /api/dialog/variable/pending - Web client lấy danh sách pending requests
router.get('/variable/pending', authenticateToken, async (req, res) => {
    try {
        const pendingDialogMap = getPendingDialogRequests();
        const pendingRequests = Array.from(pendingDialogMap.entries()).map(([id, request]) => ({
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
        
        
        res.json({
            success: true,
            data: pendingRequests
        });
        
    } catch (error) {
        console.error('Error getting pending dialog requests:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// POST /api/dialog/variable/response - Web client gửi response cho robot
router.post('/variable/response', authenticateToken, async (req, res) => {
    try {
        const { request_id, response } = req.body;
        
        console.log('Dialog response received:', { request_id, response });
        
        if (!request_id || !response) {
            return res.status(400).json({
                error: 'Missing required fields: request_id, response'
            });
        }
        
        const pendingDialogMap = getPendingDialogRequests();
        
        // Check if request exists
        if (!pendingDialogMap.has(request_id)) {
            return res.status(404).json({
                error: 'Dialog request not found or expired',
                request_id: request_id
            });
        }
        
        // Send response via ROS subscriber if it came from ROS
        const request = pendingDialogMap.get(request_id);
        if (request.source === 'ros') {
            const success = dialogSubscriber.sendDialogResponse(request_id, response);
            if (!success) {
                return res.status(500).json({
                    error: 'Failed to send response to robot'
                });
            }
        } else {
            // Update request status for API-originated requests
            request.status = 'responded';
            request.response = response;
            request.responseTimestamp = Date.now();
        }
        
        console.log(`Dialog response processed for request ID: ${request_id}`);
        
        res.json({
            success: true,
            message: 'Dialog response received and stored',
            request_id: request_id,
            response: response
        });
        
    } catch (error) {
        console.error('Error handling dialog response:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// DELETE /api/dialog/variable/request/:requestId - Xóa một pending request
router.delete('/variable/request/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        console.log(`Attempting to delete dialog request: ${requestId}`);
        
        const pendingDialogMap = getPendingDialogRequests();
        if (!pendingDialogMap.has(requestId)) {
            return res.status(404).json({
                error: 'Dialog request not found',
                request_id: requestId
            });
        }
        
        // Cancel via ROS subscriber if it came from ROS
        const request = pendingDialogMap.get(requestId);
        if (request.source === 'ros') {
            dialogSubscriber.cancelDialogRequest(requestId);
        } else {
            pendingDialogMap.delete(requestId);
        }
        
        console.log(`Dialog request deleted: ${requestId}`);
        
        res.json({
            success: true,
            message: 'Dialog request deleted successfully',
            request_id: requestId
        });
        
    } catch (error) {
        console.error('Error deleting dialog request:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// GET /api/dialog/variable/request/:requestId - Lấy thông tin chi tiết của một request
router.get('/variable/request/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        console.log(`Getting dialog request details: ${requestId}`);
        
        const pendingDialogMap = getPendingDialogRequests();
        if (!pendingDialogMap.has(requestId)) {
            return res.status(404).json({
                error: 'Dialog request not found',
                request_id: requestId
            });
        }
        
        const request = pendingDialogMap.get(requestId);
        
        res.json({
            success: true,
            data: {
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
            }
        });
        
    } catch (error) {
        console.error('Error getting dialog request details:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// WebSocket endpoint để real-time communication (optional)
// Bạn có thể implement WebSocket để robot nhận response real-time

module.exports = router;
