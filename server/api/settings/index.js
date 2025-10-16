const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../auth/middleware');
const { config } = require('../../config/database');

// Get robot footprint settings
router.get('/footprint',  async (req, res) => {
    try {
        console.log('Getting robot footprint settings');
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        const table = config.engine === 'mysql' ? 'Settings' : '[NTURobot].[dbo].[Settings]';
        const result = await pool.request()
            .query(`
                SELECT ID, itemName, propertiesName
                FROM ${table}
                WHERE itemName = 'Footprint'
            `);

        if (result.recordset.length > 0) {
            const footprintData = result.recordset[0];
            
            // Parse the propertiesName JSON
            let parsedProperties;
            try {
                parsedProperties = JSON.parse(footprintData.propertiesName);
            } catch (parseError) {
                console.error('Error parsing footprint properties JSON:', parseError);
                console.error('Raw propertiesName:', footprintData.propertiesName);
                return res.status(500).json({
                    success: false,
                    message: 'Error parsing footprint properties data'
                });
            }
            
            res.json({
                success: true,
                data: {
                    id: footprintData.ID,
                    itemName: footprintData.itemName,
                    properties: parsedProperties
                }
            });
        } else {
            // Return default footprint if not found in database
            const defaultFootprint = {
                success: true,
                data: {
                    id: 0,
                    itemName: 'Footprint',
                    properties: {
                        radius: 0.3,
                        points: [
                            { x: 0.3, y: 0.3 },
                            { x: -0.3, y: 0.3 },
                            { x: -0.3, y: -0.3 },
                            { x: 0.3, y: -0.3 }
                        ]
                    }
                }
            };
            console.log('Using default footprint:', defaultFootprint);
            res.json(defaultFootprint);
        }
    } catch (error) {
        console.error('Error fetching footprint settings:', error);
        
        // Return default footprint on error instead of 500
        console.log('Returning default footprint due to error');
        const defaultFootprint = {
            success: true,
            data: {
                id: 0,
                itemName: 'Footprint',
                properties: {
                    radius: 0.3,
                    points: [
                        { x: 0.3, y: 0.3 },
                        { x: -0.3, y: 0.3 },
                        { x: -0.3, y: -0.3 },
                        { x: 0.3, y: -0.3 }
                    ]
                }
            }
        };
        res.json(defaultFootprint);
    }

});

// Get TF laser to base settings
router.get('/tf_laser_to_base', async (req, res) => {
    try {
        console.log('Getting TF laser to base settings');
        
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }
        
        const table = config.engine === 'mysql' ? 'Settings' : '[NTURobot].[dbo].[Settings]';
        const result = await pool.request()
            .query(`
                SELECT ${config.engine === 'mysql' ? '' : 'TOP (1) '}ID, itemName, propertiesName
                FROM ${table}
                WHERE itemName = 'TFBaseFootprintToLaser'
                ${config.engine === 'mysql' ? 'ORDER BY ID DESC LIMIT 1' : ''}
            `);

        if (result.recordset.length > 0) {
            const tfData = result.recordset[0];
            
            // Parse the propertiesName JSON
            let parsedProperties;
            try {
                parsedProperties = JSON.parse(tfData.propertiesName);
            } catch (parseError) {
                console.error('Error parsing TF properties JSON:', parseError);
                console.error('Raw propertiesName:', tfData.propertiesName);
                return res.status(500).json({
                    success: false,
                    message: 'Error parsing TF properties data'
                });
            }
            
            res.json({
                success: true,
                data: {
                    id: tfData.ID,
                    itemName: tfData.itemName,
                    properties: parsedProperties
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'TF laser to base data not found'
            });
        }
    } catch (error) {
        console.error('Error fetching TF laser to base settings:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            number: error.number,
            state: error.state
        });
        
        // Return default TF data on error instead of 500
        console.log('Returning default TF data due to error');
        const defaultTF = {
            success: true,
            data: {
                id: 0,
                itemName: 'TFBaseFootprintToLaser',
                properties: {
                    Orientation: ["0.0000", "0.0000", "0.0000", "1.0000"],
                    Position: ["0.7730", "0.000", "0.0120"]
                }
            }
        };
        res.json(defaultTF);
    }

});

// Update robot footprint settings
router.put('/footprint',  async (req, res) => {
    try {
        const { radius, points } = req.body;
        console.log('Updating robot footprint settings:', { radius, points });

        if (!radius || !points || !Array.isArray(points)) {
            return res.status(400).json({ error: 'Invalid footprint data' });
        }

        const footprintData = JSON.stringify({ radius, points });
        
        await sql.query`
            UPDATE Settings
            SET settingValue = ${footprintData}
            WHERE settingKey = 'RobotFootprint';

            IF @@ROWCOUNT = 0
            INSERT INTO Settings (settingKey, settingValue)
            VALUES ('RobotFootprint', ${footprintData});
        `;

        console.log('Footprint settings updated successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating footprint settings:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

module.exports = router; 