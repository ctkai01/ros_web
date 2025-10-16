const ROSLIB = require('roslib');

let mapChangeData = {
    id_map: null,
    id_site: null,
    lastUpdated: null
};

// Helper function to parse map change message
function parseMapChangeMessage(message) {
    try {
        // Handle different message formats
        let parsedData = {};
        
        if (typeof message === 'object') {
            // Direct object format - ntucar/MapChange message
            parsedData = {
                id_map: message.id_map || null,
                id_site: message.id_site || null
            };
        } else if (typeof message === 'string') {
            // JSON string format
            try {
                const jsonData = JSON.parse(message);
                parsedData = {
                    id_map: jsonData.id_map || null,
                    id_site: jsonData.id_site || null
                };
            } catch (parseError) {
                console.error('Failed to parse map change message as JSON:', parseError);
                return null;
            }
        }

        // Validate the parsed data
        if (parsedData.id_map === null || parsedData.id_site === null) {
            console.warn('Map change message missing required fields:', parsedData);
            return null;
        }

        return parsedData;
    } catch (error) {
        console.error('Error parsing map change message:', error);
        return null;
    }
}

function initMapChangeSubscriber(ros, wss) {
    console.log('Initializing Map Change Subscriber...');

    const mapChangeListener = new ROSLIB.Topic({
        ros: ros,
        name: '/robot/map/change',
        messageType: 'ntuamr/MapChange'
    });

    mapChangeListener.subscribe((message) => {
        try {
            console.log('📋 Map Change Subscriber: Received message:', message);
            
            // Parse the map change message
            const parsedData = parseMapChangeMessage(message);
            
            if (parsedData) {
                // Update the global map change data
                mapChangeData = {
                    id_map: parsedData.id_map,
                    id_site: parsedData.id_site,
                    lastUpdated: new Date().toISOString()
                };

                console.log('✅ Map Change Subscriber: Successfully parsed map change data:', mapChangeData);

                // Broadcast to all connected WebSocket clients
                broadcastMapChange(wss, mapChangeData);
            } else {
                console.warn('⚠️ Map Change Subscriber: Failed to parse message');
            }
        } catch (error) {
            console.error('❌ Map Change Subscriber: Error processing message:', error);
        }
    });

    console.log('✅ Map Change Subscriber: Successfully subscribed to /robot/map/change');
}

function broadcastMapChange(wss, data) {
    if (!wss || !wss.clients) {
        console.warn('WebSocket server not available for broadcasting map change');
        return;
    }

    const message = {
        type: 'map_change',
        data: {
            id_map: data.id_map,
            id_site: data.id_site,
            lastUpdated: data.lastUpdated
        }
    };

    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            try {
                client.send(JSON.stringify(message));
            } catch (error) {
                console.error('Error sending map change to client:', error);
            }
        }
    });

    console.log(`📡 Map Change Subscriber: Broadcasted to ${wss.clients.size} clients`);
}

function sendCurrentMapChangeToClient(client) {
    if (!client || client.readyState !== 1) {
        return;
    }

    const message = {
        type: 'map_change',
        data: mapChangeData
    };

    try {
        client.send(JSON.stringify(message));
        console.log('📡 Map Change Subscriber: Sent current data to client');
    } catch (error) {
        console.error('Error sending current map change to client:', error);
    }
}

function getMapChangeData() {
    return { ...mapChangeData };
}

// Export functions
module.exports = {
    initMapChangeSubscriber,
    broadcastMapChange,
    sendCurrentMapChangeToClient,
    getMapChangeData
};
