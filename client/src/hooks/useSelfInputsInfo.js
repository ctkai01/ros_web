import { useState, useEffect } from 'react';
import serverConfig from '../config/serverConfig';

const useSelfInputsInfo = () => {
  const [selfInputsInfo, setSelfInputsInfo] = useState({
    lastUpdate: 0,
    data: [],
    status: 'N/A',
    reason: 'N/A'
  });

  const fetchSelfInputsInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token || !refreshToken) {
        console.error('No authentication tokens found');
        return;
      }

      const response = await fetch(serverConfig.SELF_INPUTS_INFO_URL, {
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
        throw new Error(`Failed to fetch self inputs info: ${response.statusText}`);
      }

      const newToken = response.headers.get('x-new-token');
      if (newToken) {
        localStorage.setItem('token', newToken);
      }

      const data = await response.json();
      console.log('Self Inputs API Response:', data);
      setSelfInputsInfo(data);
    } catch (error) {
      console.error('Error fetching self inputs info:', error);
    }
  };

  useEffect(() => {
    fetchSelfInputsInfo();
    const interval = setInterval(fetchSelfInputsInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  return { selfInputsInfo };
};

export default useSelfInputsInfo;
