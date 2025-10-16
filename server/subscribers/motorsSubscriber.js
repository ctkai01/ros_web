const ROSLIB = require('roslib');

let motorsStatus = {
  leftMotor: {
    status: 'Normal',
    speed: 0,
    temperature: 0,
    current: 0
  },
  rightMotor: {
    status: 'Normal',
    speed: 0,
    temperature: 0,
    current: 0
  },
  status: 'Normal'
};

function initMotorsSubscriber(ros, wss) {
  console.log('Initializing motors subscriber...');

  // Left Motor Status
  const leftMotorSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/left/status',
    messageType: 'std_msgs/String'
  });

  leftMotorSub.subscribe((message) => {
    motorsStatus.leftMotor.status = message.data;
    updateOverallStatus();
    broadcastMotorsInfo(wss);
  });

  // Left Motor Speed
  const leftSpeedSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/left/speed',
    messageType: 'std_msgs/Float32'
  });

  leftSpeedSub.subscribe((message) => {
    motorsStatus.leftMotor.speed = message.data;
    broadcastMotorsInfo(wss);
  });

  // Left Motor Temperature
  const leftTempSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/left/temperature',
    messageType: 'std_msgs/Float32'
  });

  leftTempSub.subscribe((message) => {
    motorsStatus.leftMotor.temperature = message.data;
    broadcastMotorsInfo(wss);
  });

  // Left Motor Current
  const leftCurrentSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/left/current',
    messageType: 'std_msgs/Float32'
  });

  leftCurrentSub.subscribe((message) => {
    motorsStatus.leftMotor.current = message.data;
    broadcastMotorsInfo(wss);
  });

  // Right Motor Status
  const rightMotorSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/right/status',
    messageType: 'std_msgs/String'
  });

  rightMotorSub.subscribe((message) => {
    motorsStatus.rightMotor.status = message.data;
    updateOverallStatus();
    broadcastMotorsInfo(wss);
  });

  // Right Motor Speed
  const rightSpeedSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/right/speed',
    messageType: 'std_msgs/Float32'
  });

  rightSpeedSub.subscribe((message) => {
    motorsStatus.rightMotor.speed = message.data;
    broadcastMotorsInfo(wss);
  });

  // Right Motor Temperature
  const rightTempSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/right/temperature',
    messageType: 'std_msgs/Float32'
  });

  rightTempSub.subscribe((message) => {
    motorsStatus.rightMotor.temperature = message.data;
    broadcastMotorsInfo(wss);
  });

  // Right Motor Current
  const rightCurrentSub = new ROSLIB.Topic({
    ros: ros,
    name: '/motors/right/current',
    messageType: 'std_msgs/Float32'
  });

  rightCurrentSub.subscribe((message) => {
    motorsStatus.rightMotor.current = message.data;
    broadcastMotorsInfo(wss);
  });

  console.log('Motors subscriber initialized');
}

function updateOverallStatus() {
  if (motorsStatus.leftMotor.status === 'Error' || motorsStatus.rightMotor.status === 'Error') {
    motorsStatus.status = 'Error';
  } else if (motorsStatus.leftMotor.status === 'Warning' || motorsStatus.rightMotor.status === 'Warning') {
    motorsStatus.status = 'Warning';
  } else {
    motorsStatus.status = 'Normal';
  }
}

function broadcastMotorsInfo(wss) {
  if (wss.clients) {
    const data = {
      type: 'motorsUpdate',
      data: motorsStatus
    };
    
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // 1 = WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  }
}

module.exports = {
  initMotorsSubscriber,
  getMotorsStatus: () => motorsStatus
}; 