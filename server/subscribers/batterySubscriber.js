const ROSLIB = require('roslib');

let batteryStatus = {

    // Basic Information
    model: '',
    hardwareVersion: '',
    softwareVersion: '',
    deviceName: '',
    pincode: '',
    number: '',
    anotherNumber: '',

    // Battery Status
    remainBattery: 0,
    voltage: 0,
    current: 0,
    batteryPower: 0,
    temperature1: 0,
    temperature2: 0,
    mosTemperature: 0,

    // Cell Information
    cellNumber: 0,
    cellVoltages: [],
    cellResistances: [],
    averageCellVoltage: 0,
    deltaCellVoltage: 0,
    maxVoltageCell: 0,
    minVoltageCell: 0,

    // System Status
    isCharging: false,
    isDischarging: false,
    balanceStatus: 'IDLE',
    systemStatus: 'OK',
    systemAlarms: 0,
    balanceCurrent: 0,
    balancingAction: 0,

    // Statistics
    batteryCapacity: 0,
    remainCapacity: 0,
    cycleCapacity: 0,
    cycleCount: 0,
    totalRuntime: 0,
    chargeCurrent: 0,
    dischargeCurrent: 0
};

function evaluateBatteryStatus(data) {
    let status = 'OK';
    let issues = [];

    // Check temperature (all three temperature sensors)
    const temperatures = [data.temperature1, data.temperature2, data.mosTemperature];
    const highTemps = temperatures.filter(temp => temp > 50);
    
    if (highTemps.length > 0) {
        status = 'Error';
        issues.push('High battery temperature detected');
    }

    // Check system alarms
    if (data.systemAlarms !== 0) {
        status = 'Error';
        issues.push('System alarm detected');
    }

    return { status, issues };
}

function initBatterySubscriber(ros, wss) {
    console.log('Initializing battery subscriber...');

    const batteryListener = new ROSLIB.Topic({
        ros: ros,
        name: '/Battery_info',
        messageType: 'jk_bms_msg/JkbmsStatus'
    });

    batteryListener.subscribe((message) => {
        try {
            const newStatus = {
                // Basic Information
                model: message.Model || '',
                hardwareVersion: message.HardwareVersion || '',
                softwareVersion: message.SoftwareVersion || '',
                deviceName: message.DeviceName || '',
                pincode: message.Pincode || '',
                number: message.Number || '',
                anotherNumber: message.AnotherNumber || '',

                // Battery Status
                remainBattery: message.RemainBattery || 0,
                voltage: message.Voltage || 0,
                batteryPower: message.BatteryPower || 0,
                temperature1: message.Temperature?.[0] || 0,
                temperature2: message.Temperature?.[1] || 0,
                mosTemperature: message.Temperature?.[2] || 0,

                // Cell Information
                cellNumber: message.CellNumber || 0,
                cellVoltages: message.CellVoltage || [],
                cellResistances: message.CellResistance || [],
                averageCellVoltage: message.AverageCellVoltage || 0,
                deltaCellVoltage: message.DeltaCellVoltage || 0,
                maxVoltageCell: message.MaxVoltageCell || 0,
                minVoltageCell: message.MinVoltageCell || 0,

                // System Status
                isCharging: message.ChargingMosfetStatus || false,
                isDischarging: message.DischargingMosfetStatus || false,
                balanceStatus: message.BalancerStatus === 1 ? 'Working' : 'Idle',
                systemAlarms: message.SystemAlarms || 0,
                balanceCurrent: message.BalanceCurrent || 0,
                balancingAction: message.BalancingAction || 0,

                // Statistics
                batteryCapacity: message.BatteryCapacity || 0,
                remainCapacity: message.RemainCapacity || 0,
                cycleCapacity: message.CycleCapacity || 0,
                cycleCount: message.CycleCount || 0,
                totalRuntime: message.TotalRuntime || 0,
                chargeCurrent: message.ChargeCurrent || 0
            };

            // Evaluate battery status
            const evaluation = evaluateBatteryStatus(newStatus);
            newStatus.systemStatus = evaluation.status;
            newStatus.issues = evaluation.issues;

            // Update batteryStatus
            batteryStatus = newStatus;

            broadcastBatteryInfo(wss);
        } catch (error) {
            console.error('Error processing battery message:', error);
        }
    });

    console.log('Battery subscriber initialized');
}

function broadcastBatteryInfo(wss) {
    if (wss.clients) {
        const data = {
            type: 'batteryUpdate',
            data: batteryStatus
        };
        
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 = WebSocket.OPEN
                client.send(JSON.stringify(data));
            }
        });
    }
}

module.exports = {
    initBatterySubscriber,
    getBatteryStatus: () => batteryStatus
}; 