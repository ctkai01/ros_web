import React, { useState } from 'react';
import './HardwareHealth.css';
import useBatteryInfo from '../../../hooks/useBatteryInfo';
import useComputerInfo from '../../../hooks/useComputerInfo';
import useMotorsInfo from '../../../hooks/useMotorsInfo';
import useSensorsInfo from '../../../hooks/useSensorsInfo';

const HardwareHealth = () => {
  const [expandedItem, setExpandedItem] = useState(null);
  const { batteryInfo } = useBatteryInfo();
  const { computerInfo } = useComputerInfo();
  const { motorsInfo } = useMotorsInfo();
  const { sensorsInfo } = useSensorsInfo();

  const getBatteryStatusColor = (percentage) => {
    if (!percentage && percentage !== 0) return 'yellow';
    if (percentage <= 20) return 'red';
    if (percentage <= 40) return 'yellow';
    return 'green';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'ok':
      case 'normal':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getLidarStatus = (lidar) => {
    if (lidar.status === 'OK' && lidar.scanAvailable === 'OK') {
      return 'OK';
    }
    else if (lidar.status === 'OK' && lidar.scanAvailable === 'Error') {
      return 'Warning';
    }
    else if (lidar.status === 'Error' && lidar.scanAvailable === 'OK') {
      return 'Error';
    }
    else if (lidar.status === 'Error' && lidar.scanAvailable === 'Error') {
      return 'Error';
    }
    else {
      return 'N/A';
    }
  };

  const formatValue = (value, unit = '', precision = 2) => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
      return `${value.toFixed(precision)}${unit}`;
    }
    return value || 'N/A';
  };

  const hardwareItems = [
    {
      id: 'power',
      name: 'Power system',
      status: getBatteryStatusColor(batteryInfo?.remainBattery),
      statusText: batteryInfo?.systemStatus || 'Unknown'
    },
    {
      id: 'computer',
      name: 'Computer',
      status: getStatusColor(computerInfo?.status),
      statusText: computerInfo?.issues?.join(', ') || computerInfo?.status || 'Unknown'
    },
    {
      id: 'motors',
      name: 'Motors',
      status: getStatusColor(motorsInfo?.status),
      statusText: motorsInfo?.status || 'Unknown'
    },
    {
      id: 'sensors',
      name: 'Sensors',
      status: getStatusColor(sensorsInfo?.status),
      statusText: sensorsInfo?.status || 'Unknown'
    },
    {
      id: 'safety',
      name: 'Safety System',
      status: getStatusColor(sensorsInfo?.safety?.status),
      statusText: sensorsInfo?.safety?.status || 'Unknown'
    }
  ];
  const renderPowerSystemDetails = () => {
    return (
      <div className="battery-item-details">
        <div className="detail-group">
          <h4>BMS Information</h4>
          <div>Model: {batteryInfo?.model || 'N/A'}</div>
          <div>Hardware Version: {batteryInfo?.hardwareVersion || 'N/A'}</div>
          <div>Software Version: {batteryInfo?.softwareVersion || 'N/A'}</div>
          <div>Device Name: {batteryInfo?.deviceName || 'N/A'}</div>
          <div>Pincode: {batteryInfo?.pincode || 'N/A'}</div>
          <div>Number: {batteryInfo?.number || 'N/A'}</div>
          <div>Another Number: {batteryInfo?.anotherNumber || 'N/A'}</div>
        </div>
  
        <div className="detail-group">
          <h4>Battery Status</h4>
          <div>Remaining Battery: {formatValue(batteryInfo?.remainBattery, '%')}</div>
          <div>Voltage: {formatValue(batteryInfo?.voltage, 'V')}</div>
          <div>Charge Current: {formatValue(batteryInfo?.chargeCurrent, 'A')}</div>
          <div>Power: {formatValue(batteryInfo?.batteryPower, 'W')}</div>
          <div>Balance Current: {formatValue(batteryInfo?.balanceCurrent, 'A')}</div>
        </div>
  
        <div className="detail-group">
          <h4>Temperature Information</h4>
          <div>Temperature1: {formatValue(batteryInfo?.temperature1, '°C')}</div>
          <div>Temperature2: {formatValue(batteryInfo?.temperature2, '°C')}</div>
          <div>MosTemperature: {formatValue(batteryInfo?.mosTemperature, '°C')}</div>
        </div>
  
        <div className="detail-group">
          <h4>Cell Information</h4>
          <div>Cell Count: {batteryInfo?.cellNumber || 'N/A'}</div>
          <div>Average Cell Voltage: {formatValue(batteryInfo?.averageCellVoltage, 'V')}</div>
          <div>Delta Cell Voltage: {formatValue(batteryInfo?.deltaCellVoltage, 'V')}</div>
          <div>Max Voltage Cell: Cell {batteryInfo?.maxVoltageCell || 'N/A'}</div>
          <div>Min Voltage Cell: Cell {batteryInfo?.minVoltageCell || 'N/A'}</div>
          <div className="cell-voltages">
            {batteryInfo?.cellVoltage?.map((voltage, index) => (
              <div key={index} className="cell-voltage-item">
                Cell {index + 1}: {formatValue(voltage, 'V')}
                {batteryInfo?.cellResistance?.[index] && 
                  ` (${formatValue(batteryInfo.cellResistance[index], 'Ω')})`}
              </div>
            ))}
          </div>
        </div>
  
        <div className="detail-group">
          <h4>System Status</h4>
          <div>Charging MOSFET: <span className={`value ${batteryInfo?.chargingMosfetStatus ? 'success' : ''}`}>
            {batteryInfo?.chargingMosfetStatus ? 'ON' : 'OFF'}
          </span></div>
          <div>Discharging MOSFET: <span className={`value ${batteryInfo?.dischargingMosfetStatus ? 'success' : ''}`}>
            {batteryInfo?.dischargingMosfetStatus ? 'ON' : 'OFF'}
          </span></div>
          <div>Balancer Status: <span className={`value ${batteryInfo?.balancerStatus === 1 ? 'success' : ''}`}>
            {batteryInfo?.balancerStatus === 1 ? 'Working' : 'Idle'}
          </span></div>
          <div>Balancing Action: <span className={`value`}>
            {getBalancingActionText(batteryInfo?.balancingAction)}
          </span></div>
          <div>System Status: <span className={`value ${batteryInfo?.systemAlarms === 0 ? 'success' : 'warning'}`}>
            {batteryInfo?.systemStatus}
            {batteryInfo?.systemAlarms !== 0 && getSystemAlarmsText(batteryInfo?.systemAlarms)}
          </span></div>
        </div>
  
        <div className="detail-group">
          <h4>Statistics</h4>
          <div>Battery Capacity: {formatValue(batteryInfo?.batteryCapacity, 'Ah')}</div>
          <div>Remain Capacity: {formatValue(batteryInfo?.remainCapacity, 'Ah')}</div>
          <div>Cycle Capacity: {formatValue(batteryInfo?.cycleCapacity, 'Ah')}</div>
          <div>Cycle Count: {batteryInfo?.cycleCount || 0}</div>
          <div>Total Runtime: {formatValue(batteryInfo?.totalRuntime / 3600, 'hours')}</div>
        </div>
      </div>
    );
  };
  
  // Thêm các hàm helper mới
  const getBalancingActionText = (action) => {
    switch (action) {
      case 0: return 'OFF';
      case 1: return 'Charging Balancer';
      case 2: return 'Discharging Balancer';
      default: return 'Unknown';
    }
  };
  
  const getSystemAlarmsText = (alarms) => {
    const alarmTexts = [];
    if (alarms & 1) alarmTexts.push('Charge Overtemperature');
    if (alarms & 2) alarmTexts.push('Charge Undertemperature');
    if (alarms & 8) alarmTexts.push('Cell Undervoltage');
    if (alarms & 1024) alarmTexts.push('Cell Count Mismatch');
    if (alarms & 2048) alarmTexts.push('Current Sensor Anomaly');
    if (alarms & 4096) alarmTexts.push('Cell Overvoltage');
    
    return alarmTexts.length > 0 ? ` (${alarmTexts.join(', ')})` : '';
  };

  const renderComputerDetails = () => {
    return (
      <div className="hardware-item-details">
        <div className="detail-group">
          <h4>CPU Information</h4>
          <div className="cpu-name">CPU Name: {computerInfo.cpuName || 'N/A'}</div>
          <div className="cpu-cores-grid">
            {computerInfo.cpuUsage.map((usage, index) => (
              <div key={`cpu-${index}`} className="cpu-core-item">
                <div className="cpu-core-header">Core {index + 1}</div>
                <div className="cpu-metrics">
                  <div className="cpu-metric">
                    <div className="metric-label">Usage</div>
                    <div className="cpu-progress-bar compact">
                      <div 
                        className="progress" 
                        style={{ width: `${usage}%` }}
                      >
                        <span className="progress-text">{formatValue(usage, '%', 1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="cpu-metric">
                    <div className="metric-label">Temperature</div>
                    <div className="cpu-progress-bar compact temperature">
                      <div 
                        className="progress" 
                        style={{ 
                          width: `${Math.min((computerInfo.cpuTemp[index] / 100) * 100, 100)}%`,
                          backgroundColor: computerInfo.cpuTemp[index] > 80 ? '#dc3545' : 
                                         computerInfo.cpuTemp[index] > 60 ? '#ffc107' : '#4caf50'
                        }}
                      >
                        <span className="progress-text">{formatValue(computerInfo.cpuTemp[index], '°C', 1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        <div className="detail-group">
          <h4>Memory Information</h4>
          <div>
            <div>Memory Usage:</div>
            <div className="cpu-progress-bar">
              <div 
                className="progress" 
                style={{ 
                  width: `${computerInfo.memoryUsage}%`,
                  backgroundColor: computerInfo.memoryUsage > 80 ? '#dc3545' : 
                                 computerInfo.memoryUsage > 60 ? '#ffc107' : '#4caf50'
                }}
              >
                <span className="progress-text">
                  {formatValue(computerInfo.memoryUsage, '%', 1)} ({formatValue(computerInfo.memoryTotal - computerInfo.memoryFree, 'GB', 2)} / {formatValue(computerInfo.memoryTotal, 'GB', 2)})
                </span>
              </div>
            </div>
            <div>Memory Free: {formatValue(computerInfo.memoryFree, 'GB', 2)}</div>
          </div>
        </div>
  
        <div className="detail-group">
          <h4>Swap Information</h4>
          <div>
            <div>Swap Usage:</div>
            <div className="cpu-progress-bar">
              <div 
                className="progress" 
                style={{ 
                  width: `${computerInfo.swapUsage}%`,
                  backgroundColor: computerInfo.swapUsage > 80 ? '#dc3545' : 
                                 computerInfo.swapUsage > 60 ? '#ffc107' : '#4caf50'
                }}
              >
                <span className="progress-text">
                  {formatValue(computerInfo.swapUsage, '%', 1)} ({formatValue(computerInfo.swapTotal - computerInfo.swapFree, 'GB', 2)} / {formatValue(computerInfo.swapTotal, 'GB', 2)})
                </span>
              </div>
            </div>
            <div>Swap Free: {formatValue(computerInfo.swapFree, 'GB', 2)}</div>
          </div>
        </div>
  
        <div className="detail-group">
          <h4>Disk Information</h4>
          <div>
            <div>Disk Usage:</div>
            <div className="cpu-progress-bar">
              <div 
                className="progress" 
                style={{ 
                  width: `${computerInfo.diskUsage}%`,
                  backgroundColor: computerInfo.diskUsage > 80 ? '#dc3545' : 
                                 computerInfo.diskUsage > 60 ? '#ffc107' : '#4caf50'
                }}
              >
                <span className="progress-text">
                  {formatValue(computerInfo.diskUsage, '%', 1)} ({formatValue(computerInfo.diskTotal - computerInfo.diskFree, 'GB', 2)} / {formatValue(computerInfo.diskTotal, 'GB', 2)})
                </span>
              </div>
            </div>
            <div>Disk Free: {formatValue(computerInfo.diskFree, 'GB', 2)}</div>
          </div>
        </div>
  
        <div className="detail-group">
          <h4>Network Status</h4>
          <div>Overall Status: <span className={`value ${computerInfo?.status === 'OK' ? 'success' : 'error'}`}>
            {computerInfo?.status || 'Unknown'}
          </span></div>
          {computerInfo?.networkInterfaces?.map((net, index) => (
            <div key={`net-${index}`} className="network-interface">
              <div>{net.name}: <span className={`value ${net.isAlive ? 'success' : 'error'}`}>
                {net.ip} ({net.isAlive ? 'Connected' : 'Disconnected'})
              </span></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMotorsDetails = () => {
    return (
      <div className="hardware-item-details">
        <div className="detail-group">
          <h4>Left Motor</h4>
          <div>Status: <span className={`value ${getStatusColor(motorsInfo.leftMotor.status)}`}>
            {motorsInfo.leftMotor.status}
          </span></div>
          <div>Speed: {formatValue(motorsInfo.leftMotor.speed, 'RPM')}</div>
          <div>Temperature: {formatValue(motorsInfo.leftMotor.temperature, '°C')}</div>
          <div>Current: {formatValue(motorsInfo.leftMotor.current, 'A')}</div>
        </div>

        <div className="detail-group">
          <h4>Right Motor</h4>
          <div>Status: <span className={`value ${getStatusColor(motorsInfo.rightMotor.status)}`}>
            {motorsInfo.rightMotor.status}
          </span></div>
          <div>Speed: {formatValue(motorsInfo.rightMotor.speed, 'RPM')}</div>
          <div>Temperature: {formatValue(motorsInfo.rightMotor.temperature, '°C')}</div>
          <div>Current: {formatValue(motorsInfo.rightMotor.current, 'A')}</div>
        </div>
      </div>
    );
  };

  const renderSensorsDetails = () => {
    const { imu, lidar } = sensorsInfo;
    
    return (
      <div className="hardware-item-details">
        <div className="detail-group">
          <h4 style={{ display: 'flex', margin: 0 }}>
            IMU Data
            <span style={{ marginLeft: 'auto' }} className={`value ${imu.status === 'OK' ? 'success' : 'error'}`}>
              {imu.status || 'N/A'}
            </span>
          </h4>
          <div className="info-table">
            <table>
              <thead>
                <tr>
                  <th>Measurement</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Z</th>
                  <th>W</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Orientation (Quaternion)</td>
                  <td>{formatValue(imu.orientation.x)}</td>
                  <td>{formatValue(imu.orientation.y)}</td>
                  <td>{formatValue(imu.orientation.z)}</td>
                  <td>{formatValue(imu.orientation.w)}</td>
                </tr>
                <tr>
                  <td>Linear Acceleration (m/s²)</td>
                  <td>{formatValue(imu.linearAcceleration.x)}</td>
                  <td>{formatValue(imu.linearAcceleration.y)}</td>
                  <td>{formatValue(imu.linearAcceleration.z)}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Angular Velocity (rad/s)</td>
                  <td>{formatValue(imu.angularVelocity.x)}</td>
                  <td>{formatValue(imu.angularVelocity.y)}</td>
                  <td>{formatValue(imu.angularVelocity.z)}</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
          {imu.reason && imu.reason !== 'N/A' && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#d32f2f' }}>
              Reason: {imu.reason}
            </div>
          )}
        </div>

        <div className="detail-group">
          <h4 style={{ display: 'flex', margin: 0 }}>
            Laser Scanner (front)
            <span style={{ marginLeft: 'auto' }} className={`value ${lidar.front.status === 'OK' ? 'success' : 'error'}`}>
              {lidar.front.status || 'N/A'}
            </span>
          </h4>
          <div>Device Status: <span className={`value ${lidar.front.deviceStatus === 'OK' ? 'success' : 'error'}`}>
            {lidar.front.deviceStatus || 'N/A' }
          </span></div>
          <div>Scan Available: <span className={`value ${lidar.front.scanAvailable === 'OK' ? 'success' : 'error'}`}>
            {lidar.front.scanAvailable || 'N/A'}
          </span></div>
          <div>Reason: <span className={`value ${lidar.front.reason === 'N/A' ? 'success' : 'error'}`}>
            {lidar.front.reason || 'N/A'}
          </span></div>
        </div>

        <div className="detail-group">
          <h4 style={{ display: 'flex', margin: 0 }}>
            Laser Scanner (rear)
            <span style={{ marginLeft: 'auto' }} className={`value ${getLidarStatus(lidar.rear) === 'OK' ? 'success' : 'error'}`}>
              {getLidarStatus(lidar.rear) || 'N/A'}
            </span>
          </h4>
          <div>Device Status: <span className={`value ${lidar.rear.status === 'OK' ? 'success' : 'error'}`}>
            {lidar.rear.status || 'N/A'}
          </span></div>
          <div>Scan Available: <span className={`value ${lidar.rear.scanAvailable === 'OK' ? 'success' : 'error'}`}>
            {lidar.rear.scanAvailable || 'N/A'}
          </span></div>
          <div>Reason: <span className={`value ${lidar.rear.reason === 'N/A' ? 'success' : 'error'}`}>
            {lidar.rear.reason || 'N/A'}
          </span></div>
        </div>
        <div className="detail-group">
          <h4 style={{ display: 'flex', margin: 0 }}>
            Combined Scan Data
            <span style={{ marginLeft: 'auto' }} className={`value ${lidar.scan.status === 'OK' ? 'success' : 'error'}`}>
              {lidar.scan.status || 'N/A'}
            </span>
          </h4>
          <div>Scan Available: <span className={`value ${lidar.scan.scanAvailable === 'OK' ? 'success' : 'error'}`}>
            {lidar.scan.scanAvailable}
          </span></div>
          <div>Reason: <span className={`value ${lidar.scan.reason === 'N/A' ? 'success' : 'error'}`}>
            {lidar.scan.reason || 'N/A'}
          </span></div>
        </div>
      </div>
    );
  };

  const renderSafetySystemDetails = () => {
    return (
      <div className="hardware-item-details">
        <div className="detail-group">
          <h4 style={{ display: 'flex', margin: 0 }}>
            Emergency Stop
            <span style={{ marginLeft: 'auto' }} className={`value ${sensorsInfo.safety.status === 'OK' ? 'success' : 'error'}`}>
              {sensorsInfo.safety.status || 'N/A'}
            </span>
          </h4>
          <div>Status: <span className={`value ${sensorsInfo.safety.status === 'OK' ? 'success' : 'error'}`}>
            {sensorsInfo.safety.status === 'OK' ? 'Released' : 'Pressed'}
          </span></div>
        </div>
      </div>
    );
  };

  const renderItemDetails = (item) => {
    switch (item.id) {
      case 'power':
        return renderPowerSystemDetails();
      case 'computer':
        return renderComputerDetails();
      case 'motors':
        return renderMotorsDetails();
      case 'sensors':
        return renderSensorsDetails();
      case 'safety':
        return renderSafetySystemDetails();
      default:
        return null;
    }
  };

  return (
    <div className="hardware-health">
      <div className="page-header">
        <div className="header-title">
          <h2>Hardware Health</h2>
          <span className="subtitle">Read the hardware health status of the robot.</span>
        </div>
      </div>
      <div className="hardware-items-list">
        {hardwareItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <div className="hardware-item">
              <div 
                className="hardware-item-header"
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              >
                <div className="header-left">
                  <span className={`status-dot ${item.status}`}></span>
                  <div className="nav-divider"  />
                  <span className="expand-arrow">
                    {expandedItem === item.id ? (
                      <img src="/assets/icons/down-arrow.png" alt="collapse" style={{width: '12px', height: '12px'}} />
                    ) : (
                      <img src="/assets/icons/right-arrow.png" alt="expand" style={{width: '12px', height: '12px'}} />
                    )}
                  </span>
                  <span className="item-name">{item.name}</span>
                </div>
                <div className="header-right">
                  <span className={`status-text ${item.status}`}>{item.statusText}</span>
                </div>
              </div>
              {expandedItem === item.id && renderItemDetails(item)}
            </div>
            {index < hardwareItems.length - 1 && <div className="nav-divider" style={{
              height: '1px',
              backgroundColor: '#e0e0e0',
              margin: '4px 0',
              opacity: 0.5
            }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HardwareHealth; 