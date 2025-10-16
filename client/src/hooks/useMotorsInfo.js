import { useState, useEffect } from 'react';
import serverConfig from '../config/serverConfig';

const useMotorsInfo = () => {
  const [motorsInfo, setMotorsInfo] = useState({
    leftMotor: {
      status: 'Unknown',
      speed: 0,
      temperature: 0,
      current: 0
    },
    rightMotor: {
      status: 'Unknown',
      speed: 0,
      temperature: 0,
      current: 0
    },
    status: 'Unknown'
  });

  const fetchMotorsInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token || !refreshToken) {
        console.error('No authentication tokens found');
        return;
      }

      const response = await fetch(serverConfig.MOTORS_INFO_URL, {
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
        throw new Error(`Failed to fetch motors info: ${response.statusText}`);
      }

      const newToken = response.headers.get('x-new-token');
      if (newToken) {
        localStorage.setItem('token', newToken);
      }

      const data = await response.json();
      setMotorsInfo(data);
    } catch (error) {
      console.error('Error fetching motors info:', error);
    }
  };

  useEffect(() => {
    fetchMotorsInfo();
    const interval = setInterval(fetchMotorsInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  return { motorsInfo };
};

export default useMotorsInfo; 