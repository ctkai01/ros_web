import { useState, useEffect } from 'react';
import serverConfig from '../config/serverConfig';

const useBatteryInfo = () => {
  const [batteryInfo, setBatteryInfo] = useState({
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
    chargeCurrent: 0,
    batteryPower: 0,
    temperature1: 0,
    temperature2: 0,
    mosTemperature: 0,

    // Cell Information
    cellNumber: 0,
    cellVoltage: [],
    cellResistance: [],
    averageCellVoltage: 0,
    deltaCellVoltage: 0,
    maxVoltageCell: 0,
    minVoltageCell: 0,

    // System Status
    chargingMosfetStatus: false,
    dischargingMosfetStatus: false,
    balancerStatus: 0,
    systemStatus: 'OK',
    systemAlarms: 0,
    balanceCurrent: 0,
    balancingAction: 0,

    // Statistics
    batteryCapacity: 0,
    remainCapacity: 0,
    cycleCapacity: 0,
    cycleCount: 0,
    totalRuntime: 0
  });

  const fetchBatteryInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token || !refreshToken) {
        console.error('No authentication tokens found');
        return;
      }

      const response = await fetch(serverConfig.BATTERY_INFO_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
          'Accept': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        const data = await response.json();
        if (data.needRelogin) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('isLoggedIn');
          window.location.href = '/';
          return;
        }
        console.error('Authentication error:', data.message);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch battery info: ${response.statusText}`);
      }

      const newToken = response.headers.get('x-new-token');
      if (newToken) {
        localStorage.setItem('token', newToken);
      }

      const data = await response.json();
      setBatteryInfo(data);
    } catch (error) {
      console.error('Error fetching battery info:', error);
    }
  };

  useEffect(() => {
    fetchBatteryInfo();
    const interval = setInterval(fetchBatteryInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  return { batteryInfo };
};

export default useBatteryInfo;