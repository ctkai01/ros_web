import React, { useEffect, useState, useRef } from 'react';
import serverConfig from '../../config/serverConfig';
import './StatusIndicator.css';

const StatusIndicator = ({ className = '', onStatusChange = null }) => {
  const [robotStatus, setRobotStatus] = useState({
    status: 'UNKNOWN',
    color: '#f2f2f2',
    lastUpdated: null
  });
  
  const wsRef = useRef(null);
  const prevStatusRef = useRef('UNKNOWN');

  // WebSocket connection for robot status
  useEffect(() => {
    // Load initial status from API
    loadInitialStatus();
    
    // Initialize WebSocket connection
    const ws = new WebSocket(serverConfig.WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Handle robot status messages
        if (message.type === 'robotStatus') {
          
          const newStatus = message.data.systemStatus || 'UNKNOWN';
          const newColor = message.data.systemStatusColor || '#f2f2f2';
          
          // Only update if status actually changed to prevent unnecessary re-renders
          setRobotStatus(prevStatus => {
            if (prevStatus.status !== newStatus || prevStatus.color !== newColor) {
              const newRobotStatus = {
                status: newStatus,
                color: newColor,
                lastUpdated: message.data.lastUpdated
              };
              
              return newRobotStatus;
            }
            return prevStatus; // No change, don't re-render
          });
        }
        
      } catch (error) {
        console.error('StatusIndicator: Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('StatusIndicator: WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('StatusIndicator: WebSocket closed');
    };

    // Cleanup function
    return () => {
      if (wsRef.current) {
        console.log('StatusIndicator: Closing WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Call onStatusChange when robotStatus changes
  useEffect(() => {
    if (onStatusChange && robotStatus.status !== prevStatusRef.current) {
      prevStatusRef.current = robotStatus.status;
      onStatusChange(robotStatus.status);
    }
  }, [robotStatus.status, onStatusChange]);

  // Load initial robot status from API
  const loadInitialStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('StatusIndicator: No token found for loading robot status');
        return;
      }

      const response = await fetch(`${serverConfig.SERVER_URL}/api/robot/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('StatusIndicator: Loaded initial robot status:', result.data);
        
        const newStatus = result.data.systemStatus || 'UNKNOWN';
        const newColor = result.data.systemStatusColor || '#f2f2f2';
        
        setRobotStatus(prevStatus => {
          if (prevStatus.status !== newStatus || prevStatus.color !== newColor) {
            const newRobotStatus = {
              status: newStatus,
              color: newColor,
              lastUpdated: result.data.lastUpdated
            };
            
            return newRobotStatus;
          }
          return prevStatus;
        });
      }
    } catch (error) {
      console.error('StatusIndicator: Error loading initial robot status:', error);
    }
  };

  return (
    <div 
      className={`status-indicator ${className}`}
      style={{ backgroundColor: robotStatus.color }}
      title={`Status: ${robotStatus.status}${robotStatus.lastUpdated ? ' | Updated: ' + new Date(robotStatus.lastUpdated).toLocaleTimeString() : ''}`}
    >
      {robotStatus.status}
    </div>
  );
};

export default StatusIndicator; 