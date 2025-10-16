const ROSLIB = require('roslib');

let selfInputsStatus = {
    lastUpdate: 0,
    data: [],
    status: 'N/A',
    reason: 'N/A'
};

function initSelfInputsSubscriber(ros, wss) {
    console.log('Initializing self inputs subscriber...');

    // Self Inputs Subscriber
    const selfInputsSub = new ROSLIB.Topic({
        ros: ros,
        name: '/self_inputs',
        messageType: 'std_msgs/UInt8MultiArray'
    });

    selfInputsSub.subscribe((message) => {
        try {
            // Update self inputs data
            selfInputsStatus.data = message.data || [];
            selfInputsStatus.lastUpdate = Math.floor(Date.now() / 1000);
            selfInputsStatus.status = 'OK';
            selfInputsStatus.reason = 'N/A';
            
            // console.log('Self inputs data received:', selfInputsStatus.data);
            broadcastSelfInputsInfo(wss);
        } catch (error) {
            console.error('Error processing self inputs message:', error);
            selfInputsStatus.status = 'Error';
            selfInputsStatus.reason = 'Message processing error';
        }
    });

    // Set up timer to check data availability
    setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if data is older than 5 seconds
        if (currentTime - (selfInputsStatus.lastUpdate || 0) > 5) {
            selfInputsStatus.status = 'Error';
            selfInputsStatus.reason = 'No data received for more than 5 seconds';
        } else if (selfInputsStatus.status !== 'OK') {
            selfInputsStatus.status = 'OK';
            selfInputsStatus.reason = 'N/A';
        }
        
        broadcastSelfInputsInfo(wss);
    }, 1000);

    console.log('Self inputs subscriber initialized');
}

function broadcastSelfInputsInfo(wss) {
    if (wss.clients) {
        const data = {
            type: 'selfInputsUpdate',
            data: selfInputsStatus
        };
        
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 = WebSocket.OPEN
                client.send(JSON.stringify(data));
            }
        });
    }
}

module.exports = {
    initSelfInputsSubscriber,
    getSelfInputsStatus: () => selfInputsStatus
};
