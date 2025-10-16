const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware');
const { getBatteryStatus } = require('../../subscribers/batterySubscriber');
const { getComputerStatus } = require('../../subscribers/computerSubscriber');
const { getMotorsStatus } = require('../../subscribers/motorsSubscriber');
const { getSensorsStatus } = require('../../subscribers/sensorsSubscriber');
const { getSelfInputsStatus } = require('../../subscribers/selfInputsSubscriber');

// Get battery information
router.get('/battery-info', authenticateToken, (req, res) => {
    try {
        const batteryStatus = getBatteryStatus();
        if (!batteryStatus) {
            return res.status(404).json({ 
                error: 'Battery information not available'
            });
        }
        res.json(batteryStatus);
    } catch (error) {
        console.error('Error getting battery status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get computer information
router.get('/computer-info', authenticateToken, (req, res) => {
    try {
        const computerStatus = getComputerStatus();
        if (!computerStatus) {
            return res.status(404).json({
                error: 'Computer information not available'
            });
        }
        res.json(computerStatus);
    } catch (error) {
        console.error('Error getting computer status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get motors information
router.get('/motors-info', authenticateToken, (req, res) => {
    try {
        const motorsStatus = getMotorsStatus();
        if (!motorsStatus) {
            return res.status(404).json({
                error: 'Motors information not available'
            });
        }
        res.json(motorsStatus);
    } catch (error) {
        console.error('Error getting motors status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get sensors information
router.get('/sensors-info', authenticateToken, (req, res) => {
    try {
        const sensorsStatus = getSensorsStatus();
        if (!sensorsStatus) {
            return res.status(404).json({
                error: 'Sensors information not available'
            });
        }
        res.json(sensorsStatus);
    } catch (error) {
        console.error('Error getting sensors status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get self inputs information
router.get('/self-inputs-info', authenticateToken, (req, res) => {
    try {
        const selfInputsStatus = getSelfInputsStatus();
        if (!selfInputsStatus) {
            return res.status(404).json({
                error: 'Self inputs information not available'
            });
        }
        res.json(selfInputsStatus);
    } catch (error) {
        console.error('Error getting self inputs status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

module.exports = router; 