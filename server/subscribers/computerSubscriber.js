const ROSLIB = require('roslib');

let computerStatus = {
    // CPU Information
    cpuName: '',
    cpuUsage: [],
    cpuTemp: [],
    
    // Memory Information
    memoryUsage: 0,
    memoryTotal: 0,
    memoryFree: 0,
    
    // Swap Information
    swapUsage: 0,
    swapTotal: 0,
    swapFree: 0,
    
    // Disk Information
    diskUsage: 0,
    diskTotal: 0,
    diskFree: 0,
    
    // Network Information
    networkInterfaces: [], // Will store objects with name, ip, and status
    status: 'Unknown',
    issues: []
};

function evaluateComputerStatus(data) {
    let status = 'OK';
    let issues = [];

    // Kiểm tra kết nối mạng - chỉ kiểm tra các interface bắt đầu bằng 'en' hoặc 'wl'
    const ethernetInterfaces = data.networkInterfaces.filter(net => net.name.startsWith('en'));
    const wirelessInterfaces = data.networkInterfaces.filter(net => net.name.startsWith('wl'));
    
    // Chỉ báo lỗi nếu có interface ethernet hoặc wireless không kết nối
    const disconnectedEthernet = ethernetInterfaces.filter(net => !net.isAlive);
    const disconnectedWireless = wirelessInterfaces.filter(net => !net.isAlive);
    
    if (disconnectedEthernet.length > 0 || disconnectedWireless.length > 0) {
        if (status !== 'Error') status = 'Warning';
        
        if (disconnectedEthernet.length > 0) {
            issues.push(`Ethernet interfaces disconnected: ${disconnectedEthernet.map(net => net.name).join(', ')}`);
        }
        if (disconnectedWireless.length > 0) {
            issues.push(`Wireless interfaces disconnected: ${disconnectedWireless.map(net => net.name).join(', ')}`);
        }
    }

    // Kiểm tra CPU usage
    const highCpuCores = data.cpuUsage.filter(usage => usage > 80).length;
    if (highCpuCores > 0) {
        if (highCpuCores === data.cpuUsage.length) {
            status = 'Error';
            issues.push('All CPU cores high usage');
        } else {
            if (status !== 'Error') status = 'Warning';
            issues.push(`${highCpuCores} CPU cores high usage`);
        }
    }

    // Kiểm tra Memory usage
    if (data.memoryUsage > 90) {
        status = 'Error';
        issues.push('Critical memory usage');
    } else if (data.memoryUsage > 80) {
        if (status !== 'Error') status = 'Warning';
        issues.push('High memory usage');
    }

    // Kiểm tra Disk usage
    if (data.diskUsage > 90) {
        status = 'Error';
        issues.push('Critical disk space');
    } else if (data.diskUsage > 80) {
        if (status !== 'Error') status = 'Warning';
        issues.push('Low disk space');
    }

    return { status, issues };
}

function initComputerSubscriber(ros, wss) {
    console.log('Initializing computer subscriber...');

    const computerListener = new ROSLIB.Topic({
        ros: ros,
        name: '/computer_info',
        messageType: 'computer_monitor_msg/ComputerMonitoring'
    });

    computerListener.subscribe((message) => {
        try {
            // Process network information
            const networkInfo = message.NetWorkInterfaceName.map((name, index) => ({
                name: name,
                ip: message.NetWorkIPAddress[index],
                isAlive: message.NetWorkAlive[index]
            }));

            const newStatus = {
                cpuName: message.CPUName,
                cpuUsage: message.CPUUsage,
                cpuTemp: message.CPUTemp,
                
                memoryUsage: message.MemoryUsage,
                memoryTotal: message.MemoryTotal,
                memoryFree: message.MemoryFree,
                
                swapUsage: message.SwapUsage,
                swapTotal: message.SwapTotal,
                swapFree: message.SwapFree,
                
                diskUsage: message.DiskUsage,
                diskTotal: message.DiskTotal,
                diskFree: message.DiskFree,
                
                networkInterfaces: networkInfo
            };

            // Evaluate computer status
            const evaluation = evaluateComputerStatus(newStatus);
            newStatus.status = evaluation.status;
            newStatus.issues = evaluation.issues;

            // Update computerStatus
            computerStatus = newStatus;

            broadcastComputerInfo(wss);
        } catch (error) {
            console.error('Error processing computer message:', error);
        }
    });

    console.log('Computer subscriber initialized');
}

function broadcastComputerInfo(wss) {
    if (wss.clients) {
        const data = {
            type: 'computerUpdate',
            data: computerStatus
        };
        
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify(data));
            }
        });
    }
}

module.exports = {
    initComputerSubscriber,
    getComputerStatus: () => computerStatus
};