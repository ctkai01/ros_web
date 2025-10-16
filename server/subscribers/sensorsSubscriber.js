const ROSLIB = require('roslib');

let sensorsStatus = {
  safety: {
    status: 'N/A',
    reason: 'N/A'
  },
  imu: {
    lastUpdate: 0,
    status: 'N/A',
    reason: 'N/A',
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    orientationCovariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    angularVelocity: { x: 0, y: 0, z: 0 },
    angularVelocityCovariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    linearAcceleration: { x: 0, y: 0, z: 0 },
    linearAccelerationCovariance: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  lidar: {
    front: {
      status: 'N/A',
      deviceStatus: 'N/A',
      scanAvailable: 'N/A',
      lastUpdate: 0,
      reason: 'N/A'
    },
    rear: {
      status: 'N/A',
      deviceStatus: 'N/A',
      scanAvailable: 'N/A',
      lastUpdate: 0,
      reason: 'N/A'
    },
    scan: {
      status: 'N/A',
      scanAvailable: 'N/A',
      lastUpdate: 0,
      reason: 'N/A'
    },
    lastUpdate: 0
  },
  status: 'N/A'
};

function initSensorsSubscriber(ros, wss) {
  console.log('Initializing sensors subscriber...');

  // IMU Linear Acceleration
  const imuSub = new ROSLIB.Topic({
    ros: ros,
    name: '/imu',
    messageType: 'sensor_msgs/Imu'
  });

  imuSub.subscribe((message) => {
    // Update orientation (quaternion)
    sensorsStatus.imu.orientation = {
      x: message.orientation.x,
      y: message.orientation.y,
      z: message.orientation.z,
      w: message.orientation.w
    };
    
    // Update orientation covariance (9-element array)
    sensorsStatus.imu.orientationCovariance = message.orientation_covariance || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // Update angular velocity
    sensorsStatus.imu.angularVelocity = {
      x: message.angular_velocity.x,
      y: message.angular_velocity.y,
      z: message.angular_velocity.z
    };
    
    // Update angular velocity covariance (9-element array)
    sensorsStatus.imu.angularVelocityCovariance = message.angular_velocity_covariance || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // Update linear acceleration
    sensorsStatus.imu.linearAcceleration = {
      x: message.linear_acceleration.x,
      y: message.linear_acceleration.y,
      z: message.linear_acceleration.z
    };
    
    // Update linear acceleration covariance (9-element array)
    sensorsStatus.imu.linearAccelerationCovariance = message.linear_acceleration_covariance || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    sensorsStatus.imu.lastUpdate = Math.floor(Date.now() / 1000);
    broadcastSensorsInfo(wss);
  });


  //  Lidar Status
  const lidarStatusSub = new ROSLIB.Topic({
    ros: ros,
    name: '/lidar/status',
    messageType: 'lino_msgs/LidarStatus'
  });

  lidarStatusSub.subscribe((message) => {
    sensorsStatus.lidar.lastUpdate = Math.floor(Date.now() / 1000);
    if (message.lidar_front) {
      sensorsStatus.lidar.front.deviceStatus =  "OK";
      sensorsStatus.lidar.front.reason = "N/A";
    }
    else {
      sensorsStatus.lidar.front.deviceStatus = "Error";
      sensorsStatus.lidar.front.reason = "Lidar front is faulty";
    } 
    if (message.lidar_rear) {
      sensorsStatus.lidar.rear.deviceStatus = "OK";
      sensorsStatus.lidar.rear.reason = "N/A";
    }
    else {
      sensorsStatus.lidar.rear.deviceStatus = "Error";
      sensorsStatus.lidar.rear.reason = "Lidar rear is faulty";
    }
    broadcastSensorsInfo(wss);
  });

  // Front Lidar Range
  const frontLidarRangeSub = new ROSLIB.Topic({
    ros: ros,
    name: '/scan_1',
    messageType: 'sensor_msgs/LaserScan'
  });

  frontLidarRangeSub.subscribe((message) => {
    sensorsStatus.lidar.front.lastUpdate = message.header.stamp.secs + message.header.stamp.nsecs * 1e-9;
    broadcastSensorsInfo(wss);
  });


  // Rear Lidar Range
  const rearLidarRangeSub = new ROSLIB.Topic({
    ros: ros,
    name: '/scan_2',
    messageType: 'sensor_msgs/LaserScan'
  });

  rearLidarRangeSub.subscribe((message) => {
    // convert timestamp to seconds
    sensorsStatus.lidar.rear.lastUpdate = message.header.stamp.secs + message.header.stamp.nsecs * 1e-9;
    broadcastSensorsInfo(wss);
  });

  // Safety System
  const safetySystemSub = new ROSLIB.Topic({
    ros: ros,
    name: '/brake_status',
    messageType: 'std_msgs/Bool'
  });

  safetySystemSub.subscribe((message) => {
    sensorsStatus.safety.status = !message.data ? "OK" : "Warning";
    sensorsStatus.safety.reason = !message.data ? "N/A" : "Brake is not working";
    broadcastSensorsInfo(wss);
  });

  // Set up timer to check scan availability
  setInterval(() => {
    // get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000); // Get current Unix timestamp in seconds
    // check if the last update is less than 3 seconds ago
    if (currentTime - sensorsStatus.lidar.lastUpdate > 5) {
      sensorsStatus.lidar.front.deviceStatus = "N/A";
      sensorsStatus.lidar.rear.deviceStatus = "N/A";
      sensorsStatus.lidar.scan.deviceStatus = "N/A";
      sensorsStatus.lidar.front.reason = "Controller or bringup service error";
      sensorsStatus.lidar.rear.reason = "Controller or bringup service error";
      sensorsStatus.lidar.scan.reason = "Controller or bringup service error";
      sensorsStatus.lidar.front.status = "Error";
      sensorsStatus.lidar.rear.status = "Error";
      sensorsStatus.lidar.scan.status = "Error";

    }
    else {
      // Check front lidar
      if (currentTime - (sensorsStatus.lidar.front.lastUpdate || 0) < 3) {
        sensorsStatus.lidar.front.scanAvailable = "OK";
        sensorsStatus.lidar.front.reason = "N/A";
        sensorsStatus.lidar.front.status = "OK";
      }
      else {
        sensorsStatus.lidar.front.scanAvailable = "Error";
        if (sensorsStatus.lidar.front.reason === "N/A") {
          sensorsStatus.lidar.front.reason = "Device reading service error";
          sensorsStatus.lidar.front.status = "Error";
        }
      }
      // Check rear lidar
      if (currentTime - (sensorsStatus.lidar.rear.lastUpdate || 0) < 3) {
        sensorsStatus.lidar.rear.scanAvailable = "OK";
        sensorsStatus.lidar.rear.reason = "N/A";
        sensorsStatus.lidar.rear.status = "OK";
      }
      else {
        sensorsStatus.lidar.rear.scanAvailable = "Error";
        if (sensorsStatus.lidar.rear.reason === "N/A") {
          sensorsStatus.lidar.rear.reason = "Device reading service error";
          sensorsStatus.lidar.rear.status = "Error";
        }
      }
      // Check scan lidar
      if (currentTime - (sensorsStatus.lidar.scan.lastUpdate || 0) < 3) {
        sensorsStatus.lidar.scan.scanAvailable = "OK";
        sensorsStatus.lidar.scan.reason = "N/A";
        sensorsStatus.lidar.scan.status = "OK";
      }
      else {
        sensorsStatus.lidar.scan.scanAvailable = "Error";
        if (sensorsStatus.lidar.scan.reason === "N/A") {
          sensorsStatus.lidar.scan.reason = "Combined scan service error";
          sensorsStatus.lidar.scan.status = "Error";
        }
      }
    }
    if (currentTime - (sensorsStatus.imu.lastUpdate || 0) > 3) {
      sensorsStatus.imu.status = "Error";
      sensorsStatus.imu.reason = "Device reading service error";
    }
    else {
      sensorsStatus.imu.status = "OK";
      sensorsStatus.imu.reason = "N/A";
    }
    // Update overall status
    updateOverallStatus();

    broadcastSensorsInfo(wss);
  }, 1000);

  // Note: /scan subscriber removed to avoid conflict with robot API
  // Scan data will be received via WebSocket from robot API's scan subscriber

  console.log('Sensors subscriber initialized');
}

// Function to handle scan data from robot API
function handleScanDataFromRobotAPI(message) {
  sensorsStatus.lidar.scan.lastUpdate = message.header.stamp.secs + message.header.stamp.nsecs * 1e-9;
  // Note: broadcastSensorsInfo will be called by the timer, no need to call here
}

function updateOverallStatus() {
  if (sensorsStatus.lidar.front.status === 'Error' || sensorsStatus.lidar.rear.status === 'Error' || sensorsStatus.lidar.scan.status === 'Error' || sensorsStatus.imu.status === 'Error'  ) {
    sensorsStatus.status = 'Error';
  } else if (sensorsStatus.lidar.front.status === 'Warning' || sensorsStatus.lidar.rear.status === 'Warning' || sensorsStatus.lidar.scan.status === 'Warning' || sensorsStatus.imu.status === 'Warning') {
    sensorsStatus.status = 'Warning';
  } else {
    sensorsStatus.status = 'OK';
  }
}

function broadcastSensorsInfo(wss) {
  if (wss.clients) {
    const data = {
      type: 'sensorsUpdate',
      data: sensorsStatus
    };
    
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // 1 = WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  }
}

module.exports = {
  initSensorsSubscriber,
  getSensorsStatus: () => sensorsStatus,
  handleScanDataFromRobotAPI
}; 