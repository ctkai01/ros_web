import { useState, useEffect } from 'react';
import serverConfig from '../config/serverConfig';

const useComputerInfo = () => {
  const [computerInfo, setComputerInfo] = useState({
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
  });

  const fetchComputerInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token || !refreshToken) {
        console.error('No authentication tokens found');
        return;
      }

      const response = await fetch(serverConfig.COMPUTER_INFO_URL, {
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
        throw new Error(`Failed to fetch computer info: ${response.statusText}`);
      }

      const newToken = response.headers.get('x-new-token');
      if (newToken) {
        localStorage.setItem('token', newToken);
      }

      const data = await response.json();
      setComputerInfo(data);
    } catch (error) {
      console.error('Error fetching computer info:', error);
    }
  };

  useEffect(() => {
    fetchComputerInfo();
    const interval = setInterval(fetchComputerInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  return { computerInfo };
};

export default useComputerInfo; 