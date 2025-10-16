import { useState, useEffect } from 'react';
import serverConfig from '../config/serverConfig';

const useSensorsInfo = () => {
  const [sensorsInfo, setSensorsInfo] = useState({
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
        reason: 'N/A'
      },
      rear: {
        status: 'N/A',
        deviceStatus: 'N/A',
        scanAvailable: 'N/A',
        reason: 'N/A'
      },
      scan: {
        status: 'N/A',
        scanAvailable: 'N/A',
        reason: 'N/A'
      }
    },
    status: 'N/A',
  });

  const fetchSensorsInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token || !refreshToken) {
        console.error('No authentication tokens found');
        return;
      }

      const response = await fetch(serverConfig.SENSORS_INFO_URL, {
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
        throw new Error(`Failed to fetch sensors info: ${response.statusText}`);
      }

      const newToken = response.headers.get('x-new-token');
      if (newToken) {
        localStorage.setItem('token', newToken);
      }

      const data = await response.json();
      setSensorsInfo(data);
    } catch (error) {
      console.error('Error fetching sensors info:', error);
    }
  };

  useEffect(() => {
    fetchSensorsInfo();
    const interval = setInterval(fetchSensorsInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  return { sensorsInfo };
};

export default useSensorsInfo; 