//const ROSLIB = require('roslib');
import React, { useState, useEffect, useRef } from 'react';
import useBatteryInfo from '../../hooks/useBatteryInfo';
//import { sendJoystickData } from '../../services/joystickApi';
import DialogRequestField from './DialogRequestField';
import './Header.css';
import joystick from '../../assets/icons/joy.png';
import logo from '../../assets/icons/logo.jpg';
import flag_uk from '../../assets/icons/uk.png';
import { SERVER_URL, apiCallWithRetry, WS_URL } from '../../config/serverConfig';
import StatusIndicator from '../common/StatusIndicator';
import MissionQueueStatusIndicator from '../common/MissionQueueStatusIndicator';
import { useMissionContext } from '../../contexts/MissionContext';

//import { Joystick } from '../../../../src/ros_web_viewer/js/joystick';

const Header = () => {
  const { batteryInfo } = useBatteryInfo();
  const { missionStatus, isLoading, currentMission, sendMissionCommand } = useMissionContext();
  const userName = localStorage.getItem('userName') || 'DISTRIBUTOR';
  
  
  // Function to truncate username for display
  const getDisplayUserName = (name, maxLength = 12) => {
    if (!name) return 'DISTRIBUTOR';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };
  
  // State for mission queue data from MissionQueueStatusIndicator
  const [queueData, setQueueData] = useState(null);
  const [currentRunningMission, setCurrentRunningMission] = useState(null);
   // State for robot status from StatusIndicator
   const [robotStatus, setRobotStatus] = useState('UNKNOWN');
  const [showJoystick, setShowJoystick] = useState(false);
  const [joystickInstance, setJoystickInstance] = useState(null);
  const [protectiveFieldsEnabled, setProtectiveFieldsEnabled] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickBaseRef = useRef(null);
  const joystickStickRef = useRef(null);
  const continuousUpdateRef = useRef(null);
  const wsRef = useRef(null);
  // Removed currentRobotSpeed state since we no longer use odometry data

  // Dialog states
  const [pendingDialogRequest, setPendingDialogRequest] = useState(null);
  const [dialogResponse, setDialogResponse] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  // Dialog polling - check for pending requests every 2 seconds
  useEffect(() => {
    const fetchPendingDialogRequests = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/dialog/variable/pending`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            // Chỉ hiển thị request đầu tiên (FIFO)
            const firstRequest = data.data[0];
            if (!pendingDialogRequest || pendingDialogRequest.request_id !== firstRequest.request_id) {
              setPendingDialogRequest(firstRequest);
              setDialogResponse(''); // Reset response
              setDialogError(''); // Reset error
            }
          } else {
            setPendingDialogRequest(null);
          }
        }
      } catch (error) {
        console.error('Error fetching dialog requests:', error);
      }
    };

    // Fetch ngay lập tức
    fetchPendingDialogRequests();

    // Use longer interval for remote access to reduce network load
    const isRemoteAccess = typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' && 
      !window.location.hostname.startsWith('192.168.');
    
    const intervalMs = isRemoteAccess ? 5000 : 2000; // 5s for remote, 2s for local
    const interval = setInterval(fetchPendingDialogRequests, intervalMs);

    return () => clearInterval(interval);
  }, [pendingDialogRequest]);

  // Set default value và fetch positions nếu cần khi có pendingDialogRequest mới
  useEffect(() => {
    if (pendingDialogRequest && pendingDialogRequest.field_config) {
      
      // Reset error khi có request mới
      setDialogError('');
      
      // Nếu cần fetch positions hoặc markers
      if (pendingDialogRequest.field_config.needsPositions) {
        fetchPositionsForDialog();
      } else if (pendingDialogRequest.field_config.needsMarkers) {
        fetchMarkersForDialog();
      } else {
        const defaultValue = pendingDialogRequest.field_config.defaultValue || '';
        console.log('🔍 DIALOG DEBUG - setting defaultValue:', defaultValue);
        setDialogResponse(defaultValue);
      }
    }
  }, [pendingDialogRequest]);

  // Real-time validation khi dialogResponse thay đổi
  useEffect(() => {
    if (pendingDialogRequest && pendingDialogRequest.field_config && dialogResponse !== '') {
      const validationError = validateDialogResponse(dialogResponse, pendingDialogRequest.field_config);
      setDialogError(validationError || '');
    } else if (dialogResponse === '') {
      setDialogError('');
    }
  }, [dialogResponse, pendingDialogRequest]);

  // Fetch markers for dialog
  const fetchMarkersForDialog = async () => {
    try {
      setIsDialogLoading(true);
      const token = localStorage.getItem('token');
      
      // Sử dụng siteId từ context hoặc localStorage nếu có
      let siteId = localStorage.getItem('currentSiteId');
      
      if (!siteId) {
        // Fallback: Get current site ID nếu chưa có
        const siteResponse = await fetch(`${SERVER_URL}/api/maps/getCurrentSiteId`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!siteResponse.ok) {
          throw new Error('Failed to get current site ID');
        }
        
        const siteData = await siteResponse.json();
        if (!siteData.success) {
          throw new Error('Failed to get current site ID');
        }
        
        siteId = siteData.data;
        localStorage.setItem('currentSiteId', siteId);
      }
      
      
      // Sử dụng API mới hiệu quả hơn - chỉ lấy maps có markers
      const markersResponse = await fetch(`${SERVER_URL}/api/maps/dialog/markers?siteId=${siteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!markersResponse.ok) {
        throw new Error('Failed to fetch markers');
      }
      
      const markersData = await markersResponse.json();
      if (!markersData.success) {
        throw new Error('Failed to fetch markers');
      }
      
      const markersByMap = markersData.data;
      const groupedOptions = [];
      
      // Create grouped options for markers
      Object.keys(markersByMap).forEach(mapId => {
        const mapData = markersByMap[mapId];
        const groupOptions = mapData.markers
          .filter(marker => marker && marker.id != null)
          .map(marker => ({
            value: String(marker.id),
            label: marker.name || `Marker ${marker.id}`
          }));

        if (groupOptions.length > 0) {
          groupedOptions.push({
            label: mapData.mapName || `Map ${mapId}`,
            options: groupOptions
          });
        }
      });
      
      // Update pendingDialogRequest với grouped markers
      setPendingDialogRequest(prev => ({
        ...prev,
        field_config: {
          ...prev.field_config,
          options: groupedOptions,
          needsMarkers: false
        }
      }));
      
      // Set default value - tìm marker ID từ robot message
      let defaultValue = '';
      const markerId = pendingDialogRequest.value;
      console.log('🔍 DIALOG DEBUG - markerId from server:', markerId);
      
      if (markerId) {
        // Verify marker ID exists trong grouped options
        console.log('🔍 DIALOG DEBUG - searching in groupedOptions:', groupedOptions);
        let foundValue = false;
        for (const group of groupedOptions) {
          if (group.options) {
            const foundOption = group.options.find(opt => opt.value === markerId);
            if (foundOption) {
              defaultValue = markerId;
              foundValue = true;
              console.log(`🔍 DIALOG DEBUG - Found marker ID ${markerId} in ${group.label}: ${foundOption.label}`);
              break;
            }
          }
        }
        if (!foundValue) {
          console.log(`🔍 DIALOG DEBUG - Marker ID ${markerId} not found in current site markers`);
        }
      }
      
      console.log('🔍 DIALOG DEBUG - final defaultValue:', defaultValue);
      setDialogResponse(defaultValue);
      
    } catch (error) {
      console.error('Error fetching markers for dialog:', error);
      setDialogError('Failed to load markers');
    } finally {
      setIsDialogLoading(false);
    }
  };

  // Fetch positions for dialog
  const fetchPositionsForDialog = async () => {
    try {
      setIsDialogLoading(true);
      const token = localStorage.getItem('token');
      
      // Get current site ID
      const siteResponse = await fetch(`${SERVER_URL}/api/maps/getCurrentSiteId`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!siteResponse.ok) {
        throw new Error('Failed to get current site ID');
      }
      
      const siteData = await siteResponse.json();
      if (!siteData.success) {
        throw new Error('Failed to get current site ID');
      }
      
      const siteId = siteData.data;
      
      // Get maps for this site
      const mapsResponse = await fetch(`${SERVER_URL}/api/maps/sites/${siteId}/maps`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!mapsResponse.ok) {
        throw new Error('Failed to fetch maps');
      }
      
      const maps = await mapsResponse.json();
      if (!Array.isArray(maps) || maps.length === 0) {
        throw new Error('No maps found for site');
      }
      
      // Get map IDs
      const mapIds = maps.map(map => map.ID);
      
      // Get points for all maps
      const pointsResponse = await fetch(`${SERVER_URL}/api/maps/batch/points-by-map`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mapIds })
      });
      
      if (!pointsResponse.ok) {
        throw new Error('Failed to fetch points');
      }
      
      const pointsData = await pointsResponse.json();
      if (!pointsData.success) {
        throw new Error('Failed to fetch points');
      }
      
      const pointsByMap = pointsData.data;
      const groupedOptions = [];
      
      // Create grouped options giống như MoveAction Settings
      maps.forEach(map => {
        const mapPoints = pointsByMap[map.ID] || [];
        if (mapPoints.length > 0) {
          const groupOptions = mapPoints
            .filter(point => point && point.ID != null)
            .map(point => ({
              value: String(point.ID),
              label: point.PointName || String(point.ID)
            }));

          if (groupOptions.length > 0) {
            groupedOptions.push({
              label: map.mapName || `Map ${map.ID}`,
              options: groupOptions
            });
          }
        }
      });
      
      // Update pendingDialogRequest với grouped positions
      setPendingDialogRequest(prev => ({
        ...prev,
        field_config: {
          ...prev.field_config,
          options: groupedOptions,
          needsPositions: false
        }
      }));
      
      // Set default value - tìm position ID từ robot message
      let defaultValue = '';
      
      if (pendingDialogRequest.field_type === 'position') {
        // Lấy position ID từ server (đã được parse)
        const positionId = pendingDialogRequest.value;
        console.log('🔍 DIALOG DEBUG - positionId from server:', positionId);
        
        if (positionId) {
          // Verify position ID exists trong grouped options
          console.log('🔍 DIALOG DEBUG - searching in groupedOptions:', groupedOptions);
          let foundValue = false;
          for (const group of groupedOptions) {
            if (group.options) {
              const foundOption = group.options.find(opt => opt.value === positionId);
              if (foundOption) {
                defaultValue = positionId;
                foundValue = true;
                console.log(`🔍 DIALOG DEBUG - Found position ID ${positionId} in ${group.label}: ${foundOption.label}`);
                break;
              }
            }
          }
          if (!foundValue) {
            console.log(`🔍 DIALOG DEBUG - Position ID ${positionId} not found in current site positions`);
          }
        }
      } else {
        // For non-position types, use config defaultValue
        defaultValue = pendingDialogRequest.field_config.defaultValue || '';
      }
      
      console.log('🔍 DIALOG DEBUG - final defaultValue:', defaultValue);
      setDialogResponse(defaultValue);
      
    } catch (error) {
      console.error('Error fetching positions for dialog:', error);
      setDialogError('Failed to load positions');
    } finally {
      setIsDialogLoading(false);
    }
  };

  // Handle queue updates from MissionQueueStatusIndicator
  const handleQueueUpdate = (queueData) => {
    setQueueData(queueData);
    
    // Find current running mission
    if (queueData && queueData.missions) {
      const runningMission = queueData.missions.find(m => m.status === 1);
      setCurrentRunningMission(runningMission || null);
    }
  };

  // Handle mission updates from MissionQueueStatusIndicator
  const handleMissionUpdate = (update) => {
   // Update current running mission if this update affects it
    if (update.status === 1) {
      const newRunningMission = {
        name: update.mission_name,
        status: update.status,
        execution_id: update.execution_id
      };
      setCurrentRunningMission(newRunningMission);
    } else if (update.status === 3 || update.status === 4 || update.status === 5) {
      // Mission completed, failed, or cancelled
      setCurrentRunningMission(null);
    }
  };

  useEffect(() => {
    // Initialize joystick when modal is shown
    if (showJoystick && !joystickInstance) {
      const enableJoystick = async () => {
        try {
          console.log('Enabling joystick...');
          const response = await fetch(`${SERVER_URL}/api/joystick/enable`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const data = await response.json();
          if (data.success) {
            console.log('Joystick enabled successfully');
            // Initialize ROS joystick instance if needed
            // const joystick = new Joystick(ros);
            // setJoystickInstance(joystick);
          } else {
            console.error('Failed to enable joystick:', data.error);
            // Show error to user
            alert('Failed to enable joystick: ' + data.error);
            setShowJoystick(false);
          }
        } catch (error) {
          console.error('Error enabling joystick:', error);
          alert('Error enabling joystick: ' + error.message);
          setShowJoystick(false);
        }
      };
      
      enableJoystick();
    }
    
    // Disable joystick when modal is closed
    if (!showJoystick && joystickInstance) {
      const disableJoystick = async () => {
        try {
          console.log('Disabling joystick...');
          const response = await fetch(`${SERVER_URL}/api/joystick/disable`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const data = await response.json();
          if (data.success) {
            console.log('Joystick disabled successfully');
            setJoystickInstance(null);
          } else {
            console.error('Failed to disable joystick:', data.error);
          }
        } catch (error) {
          console.error('Error disabling joystick:', error);
        }
      };
      
      disableJoystick();
    }
  }, [showJoystick, joystickInstance]);

  // Throttle joystick data to reduce network load
  const lastJoystickDataRef = useRef(null);
  const lastSendTimeRef = useRef(0);
  
  const sendJoystickData = async (data) => {
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;
    
    // Only send if data has changed significantly or enough time has passed
    const hasSignificantChange = !lastJoystickDataRef.current || 
      Math.abs(data.position.x - lastJoystickDataRef.current.position.x) > 0.02 ||
      Math.abs(data.position.y - lastJoystickDataRef.current.position.y) > 0.02;
    
    const minInterval = 50; // Minimum 50ms between sends (20Hz max)
    
    if (!hasSignificantChange && timeSinceLastSend < minInterval) {
      return; // Skip this update
    }
    
    // console.log('Sending joystick data:', data); // Disabled for performance
    lastJoystickDataRef.current = { ...data };
    lastSendTimeRef.current = now;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${SERVER_URL}/api/joystick/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error sending joystick data:', error);
      throw error;
    }
  }; 
  // Calculate linear and angular velocities from joystick position
  const calculateVelocities = (x, y) => {
    // Use adaptive velocity calculation based on current robot speed
    return calculateAdaptiveVelocities(x, y);
  };

  // Initialize joystick elements
  useEffect(() => {
    if (showJoystick) {
      initializeJoystickElements();
    }
  }, [showJoystick]);

  // Reset joystick position when modal is closed
  useEffect(() => {
    if (!showJoystick) {
      setJoystickPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setIsJoystickActive(false);
      // Stop continuous updates
      if (continuousUpdateRef.current) {
        clearInterval(continuousUpdateRef.current);
        continuousUpdateRef.current = null;
      }
    }
  }, [showJoystick]);

  // Continuous update when joystick is active
  useEffect(() => {
    if (isJoystickActive && (joystickPosition.x !== 0 || joystickPosition.y !== 0)) {
      // console.log('Starting continuous joystick updates at position:', joystickPosition); // Disabled for performance
      // Use adaptive interval based on network conditions
      const isRemoteAccess = typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' && 
        !window.location.hostname.startsWith('192.168.');
      
      const intervalMs = isRemoteAccess ? 100 : 50; // 100ms for remote (10Hz), 50ms for local (20Hz)
      
      // Start continuous updates
      continuousUpdateRef.current = setInterval(async () => {
        const velocities = calculateVelocities(joystickPosition.x, joystickPosition.y);
        try {
          await sendJoystickData({
            position: joystickPosition,
            velocities: velocities
          });
        } catch (error) {
          console.error('Error in continuous joystick update:', error);
        }
      }, intervalMs);
    } else {
      // Stop continuous updates
      if (continuousUpdateRef.current) {
        console.log('Stopping continuous joystick updates');
        clearInterval(continuousUpdateRef.current);
        continuousUpdateRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (continuousUpdateRef.current) {
        clearInterval(continuousUpdateRef.current);
        continuousUpdateRef.current = null;
      }
    };
  }, [isJoystickActive, joystickPosition]);

  const initializeJoystickElements = () => {
    if (joystickBaseRef.current && joystickStickRef.current) {
      // Set initial position
      joystickStickRef.current.style.transform = 'translate(-50%, -50%)';
      
      // Add mouse event listeners only (touch events handled by JSX)
      joystickBaseRef.current.addEventListener('mouseenter', handleStickHover);
      joystickBaseRef.current.addEventListener('mouseleave', handleStickEnd);
    }
  };

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      if (joystickBaseRef.current) {
        joystickBaseRef.current.removeEventListener('touchstart', handleTouchStart);
        joystickBaseRef.current.removeEventListener('touchmove', handleTouchMove);
        joystickBaseRef.current.removeEventListener('touchend', handleTouchEnd);
        joystickBaseRef.current.removeEventListener('mouseenter', handleStickHover);
        joystickBaseRef.current.removeEventListener('mouseleave', handleStickEnd);
      }
    };
  }, []);

  // Cleanup joystick when component unmounts
  useEffect(() => {
    return () => {
      if (showJoystick) {
        const disableJoystick = async () => {
          try {
            const response = await fetch(`${SERVER_URL}/api/joystick/disable`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            console.log('Joystick disabled on component unmount');
          } catch (error) {
            console.error('Error disabling joystick on unmount:', error);
          }
        };
        disableJoystick();
      }
      
      // Cleanup continuous updates
      if (continuousUpdateRef.current) {
        clearInterval(continuousUpdateRef.current);
        continuousUpdateRef.current = null;
      }
    };
  }, [showJoystick]);

  // Xác định trạng thái pin
  const getBatteryStatus = () => {
    if (batteryInfo?.chargeCurrent > 0) {
      return '⚡';
    }
    if (batteryInfo?.remainBattery <= 20) {
      return '⚠️ Low';
    }
    return '🔋';
  };

  // Xác định màu cho % pin
  const getBatteryColor = () => {
    if (batteryInfo?.remainBattery <= 20) {
      return '#dc3545'; // Đỏ khi pin yếu
    }
    if (batteryInfo?.remainBattery <= 50) {
      return '#ffc107'; // Vàng khi pin trung bình
    }
    return '#28a745'; // Xanh khi pin cao
  };

  // Tính toán dòng điện từ công suất và điện áp
  const calculateCurrent = () => {
    return batteryInfo?.voltage ? (batteryInfo.batteryPower / batteryInfo.voltage).toFixed(1) : '0.0';
  };

  // Format nhiệt độ
  const getTemperatureInfo = () => {
    if (batteryInfo?.temperature1 && Array.isArray(batteryInfo.temperature1)) {
      const temps1 = batteryInfo.temperature1;
      const temps2 = batteryInfo.temperature2;
      const temps3 = batteryInfo.mosTemperature;
      return `Battery 1: ${temps1?.toFixed(1) || 0}°C | Battery 2: ${temps2?.toFixed(1) || 0}°C | MOS: ${temps3?.toFixed(1) || 0}°C`;
    }
    return 'Temperature data not available';
  };

  
  const handleJoystickClick = () => {
    setShowJoystick(!showJoystick);
    setActiveItem(showJoystick ? null : 'joystick');
  };

  const toggleProtectiveFields = () => {
    setProtectiveFieldsEnabled(!protectiveFieldsEnabled);
  };

  const handleItemClick = (itemId) => {
    setActiveItem(activeItem === itemId ? null : itemId);
  };

  // Handle joystick movement
  const handleStickMove = async (event) => {
    if (!isDragging) return;
    
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate position relative to center (-1 to 1)
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    
    // Clamp values between -1 and 1
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    
    setJoystickPosition({ x: clampedX, y: clampedY });
    
    // Check if joystick is at non-zero position
    if (clampedX !== 0 || clampedY !== 0) {
      setIsJoystickActive(true);
    } else {
      setIsJoystickActive(false);
    }
  };

  const handleStickHover = async (event) => {
    if (!isDragging) return;
    
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate position relative to center (-1 to 1)
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    
    // Clamp values between -1 and 1
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    
    setJoystickPosition({ x: clampedX, y: clampedY });
    
    // Check if joystick is at non-zero position
    if (clampedX !== 0 || clampedY !== 0) {
      setIsJoystickActive(true);
    } else {
      setIsJoystickActive(false);
    }
  };

  const handleStickStart = () => {
    setIsDragging(true);
  };

  const handleStickEnd = () => {
    setIsDragging(false);
    setIsJoystickActive(false);
    // Reset position when released
    setJoystickPosition({ x: 0, y: 0 });
    // Send zero position and velocities to stop movement
    sendJoystickData({
      position: { x: 0, y: 0 },
      velocities: { linear: 0, angular: 0 }
    }).catch(console.error);
  };

  // Touch event handlers for joystick
  const handleTouchStart = (e) => {
    try {
      e.preventDefault();
    } catch (error) {
      // Ignore passive event listener error
      console.warn('Cannot preventDefault on passive event:', error);
    }
    // Only handle single touch
    if (e.touches.length === 1) {
      handleStickStart();
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !joystickBaseRef.current) return;
    
    // Only handle single touch
    if (e.touches.length === 1) {
      try {
        e.preventDefault(); // Prevent scrolling
      } catch (error) {
        // Ignore passive event listener error
        console.warn('Cannot preventDefault on passive event:', error);
      }
      const touch = e.touches[0];
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate position relative to center (-1 to 1)
      const x = (touch.clientX - centerX) / (rect.width / 2);
      const y = (touch.clientY - centerY) / (rect.height / 2);
      
      // Clamp values between -1 and 1
      const clampedX = Math.max(-1, Math.min(1, x));
      const clampedY = Math.max(-1, Math.min(1, y));
      
      setJoystickPosition({ x: clampedX, y: clampedY });
      
      // Check if joystick is at non-zero position
      if (clampedX !== 0 || clampedY !== 0) {
        setIsJoystickActive(true);
      } else {
        setIsJoystickActive(false);
      }
    }
  };

  const handleTouchEnd = () => {
    handleStickEnd();
  };

  // No longer need WebSocket connection for odometry data since we calculate velocities directly

  // Calculate velocities directly from joystick input without odometry dependency
  const calculateAdaptiveVelocities = (x, y) => {
    // Base velocity constants (maximum velocities)
    const MAX_LINEAR_VELOCITY = 0.4;  // m/s
    const MAX_ANGULAR_VELOCITY = 0.6; // rad/s
    
    // Calculate joystick magnitude for dead zone and acceleration curves
    const joystickMagnitude = Math.sqrt(x * x + y * y);
    const DEAD_ZONE_RADIUS = 0.1;
    
    // Apply dead zone
    if (joystickMagnitude < DEAD_ZONE_RADIUS) {
      return { linear: 0, angular: 0 };
    }
    
    // Normalize joystick input (0 to 1) after dead zone
    const normalizedMagnitude = Math.min(1, (joystickMagnitude - DEAD_ZONE_RADIUS) / (1 - DEAD_ZONE_RADIUS));
    
    // Apply acceleration curve for smoother control
    // Using square root for more linear feel in lower ranges
    const accelerationCurve = Math.sqrt(normalizedMagnitude);
    
    // Calculate velocities directly from joystick input
    const linearVelocity = -y * MAX_LINEAR_VELOCITY * accelerationCurve;
    const angularVelocity = -x * MAX_ANGULAR_VELOCITY * accelerationCurve;
    
    // Safety limits (shouldn't be needed but good practice)
    const clampedLinearVelocity = Math.max(-MAX_LINEAR_VELOCITY, Math.min(MAX_LINEAR_VELOCITY, linearVelocity));
    const clampedAngularVelocity = Math.max(-MAX_ANGULAR_VELOCITY, Math.min(MAX_ANGULAR_VELOCITY, angularVelocity));
    
    return {
      linear: clampedLinearVelocity,
      angular: clampedAngularVelocity
    };
  };

  // Update mission icon based on status
  useEffect(() => {
    const updateMissionIcon = (status) => {
      const missionIcon = document.querySelector('.mission-icon');
      if (!missionIcon) return;

      switch (status) {
        case 'IDLE':
          missionIcon.style.backgroundImage = 'url("../../assets/icons/play.png")';
          break;
        case 'RUNNING':
          missionIcon.style.backgroundImage = 'url("../../assets/icons/pause.png")';
          break;
        case 'PAUSED':
          missionIcon.style.backgroundImage = 'url("../../assets/icons/resume.png")';
          break;
        default:
          missionIcon.style.backgroundImage = 'url("../../assets/icons/play.png")';
      }
    };

    updateMissionIcon(missionStatus);
  }, [missionStatus]);

  const handleMissionStartStop = async () => {
    console.log('Mission start/stop - Current status:', missionStatus);
    
    if (isLoading) return;
    
    let command = '';
    switch (missionStatus) {
      case 'IDLE':
        command = 'START';
        break;
      case 'RUNNING':
        command = 'PAUSE';
        break;
      case 'PAUSED':
        command = 'RESUME';
        break;
      default:
        console.log('Unknown mission status:', missionStatus);
        return;
    }

    await sendMissionCommand(command);
  };

  // Dialog validation
  const validateDialogResponse = (value, fieldConfig) => {
    if (!fieldConfig) return null;
    
    const { type, min, max, required, readOnly } = fieldConfig;
    
    // Skip validation for read-only fields (like message type)
    if (readOnly) return null;
    
    if (required && (!value || value.trim() === '')) {
      return 'This field is required';
    
    }
    console.log('🔍 DIALOG DEBUG - value:', value, 'fieldConfig:', fieldConfig);

    // Validate number types
    if (type === 'int' || type === 'double' || type === 'time' || type === 'iterations' || type === 'usergroupid' || type === 'idmission' || type === 'value') {
      // Check for comma instead of dot in decimal numbers
      if (type === 'double' && value.includes(',')) {
        return 'Please use dot (.) instead of comma (,) for decimal numbers';
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return 'Please enter a valid number';
      if (min !== null && min !== undefined && numValue < min) return `Value must be at least ${min}`;
      if (max !== null && max !== undefined && numValue > max) return `Value must be at most ${max}`;
    }
    
    // Special validation for time type
    if (type === 'time') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return 'Please enter a valid time';
      if (numValue < 0) return 'Time cannot be negative';
      if (min !== null && min !== undefined && numValue < min) return `Time must be at least ${min} seconds`;
      if (max !== null && max !== undefined && numValue > max) return `Time must be at most ${max} seconds`;
    }
    
    // Validate combobox selection
    if (type === 'combobox') {
      if (!value || value === '') return 'Please select an option';
    }
    
    // Validate text types
    if (type === 'text' && required && (!value || value.trim() === '')) {
      return 'This field is required';
    }
    
    // Skip validation for message type (read-only error message)
    if (type === 'message') {
      return null;
    }
    
    return null;
  };

  // Handle dialog response
  const handleDialogResponse = async () => {
    if (!pendingDialogRequest) return;

    const validationError = validateDialogResponse(dialogResponse, pendingDialogRequest.field_config);
    if (validationError) {
      setDialogError(validationError);
      return;
    }

    setIsDialogLoading(true);
    setDialogError('');

    try {
      const response = await fetch(`${SERVER_URL}/api/dialog/variable/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          request_id: pendingDialogRequest.request_id,
          response: JSON.stringify({
            value: dialogResponse,
            accepted: true
          })
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Dialog response sent successfully');
          setPendingDialogRequest(null);
          setDialogResponse('');
        } else {
          setDialogError(data.error || 'Failed to send response');
        }
      } else {
        setDialogError('Failed to send response');
      }
    } catch (error) {
      console.error('Error sending dialog response:', error);
      setDialogError('Failed to send response');
    } finally {
      setIsDialogLoading(false);
    }
  };

  // Handle dialog cancel
  const handleDialogCancel = async () => {
    if (!pendingDialogRequest) return;

    try {
      // Send structured response with accepted: false
      await fetch(`${SERVER_URL}/api/dialog/variable/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          request_id: pendingDialogRequest.request_id,
          response: JSON.stringify({
            value: '',
            accepted: false
          })
        })
      });
    } catch (error) {
      console.error('Error cancelling dialog request:', error);
    }

    setPendingDialogRequest(null);
    setDialogResponse('');
    setDialogError('');
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="robot-name"><img
          src={logo}
          alt="Data Design Engineering"

        />
        </div>

      </div>

      <div className="header-right">
      <div className="mission-tools">
                <button className="tool-button" title="Mission start/stop"
                 onClick={handleMissionStartStop}
                >
                  <span className="tool-icon mission-icon"></span>
                </button>
              </div>
      <div className="status-container">
                <span className="mission-name">
          { (robotStatus === 'PENDING' || robotStatus === 'READY')
            ? 'No Mission Running'
            : currentRunningMission 
              ? currentRunningMission.name
              : (queueData && queueData.totalCount > 0)
                ? `${queueData.pendingCount} pending, ${queueData.runningCount} running`
                : (currentMission ? currentMission.name : 'No Mission Running')
          }
        </span>
        <div className="status-indicators">
          <StatusIndicator onStatusChange={setRobotStatus} />
          <MissionQueueStatusIndicator 
            onQueueUpdate={handleQueueUpdate}
            onMissionUpdate={handleMissionUpdate}
          />
        </div>
      </div>
        <ul className="header-items">
          <li 
            className={`header-item ${activeItem === 'all-ok' ? 'active' : ''}`}
            onClick={() => handleItemClick('all-ok')}
          >
            <span className="checkmark">✓</span>
            ALL OK
          </li>
          <li 
            className={`header-item ${activeItem === 'language' ? 'active' : ''}`}
            onClick={() => handleItemClick('language')}
          >
            <span className="flag-uk"> 
              <img 
                src={flag_uk} 
                alt="joystick"
                width={30} height={20}
              />
            </span>
            ENGLISH
          </li>
          <li 
            className={`header-item ${activeItem === 'user' ? 'active' : ''}`}
            onClick={() => handleItemClick('user')}
          >
            <span className="user-icon">👤</span>
            {getDisplayUserName(userName)}
          </li>
          <li 
            className={`header-item ${activeItem === 'joystick' ? 'active' : ''}`}
            onClick={handleJoystickClick}
          >
            <a 
              id='joystick-button' 
              name='joystick-button' 
              className='joystick-button' 
            >
              <img 
                src={joystick} 
                alt="joystick"
                width={20} height={20}
              />
            </a>
          </li>
          <li 
            className={`header-item battery ${activeItem === 'battery' ? 'active' : ''}`}
            onClick={() => handleItemClick('battery')}
            style={{ color: getBatteryColor() }}
            title={`Voltage: ${batteryInfo?.voltage?.toFixed(1) || 0}V | Current: ${calculateCurrent()}A | Power: ${batteryInfo?.batteryPower?.toFixed(1) || 0}W | ${getTemperatureInfo()}`}
          >
            <span className="battery-status">{getBatteryStatus()}</span>
            <span className="battery-percent">{batteryInfo?.remainBattery || 0}%</span>
          </li>
        </ul>
      </div>

      {showJoystick && (
        <div className="joystick-modal">
          <div className="joystick-modal-content">
            <div className="joystick-container">
              <div 
                ref={joystickBaseRef}
                className="joystick-base"
                onMouseMove={handleStickMove}
                onMouseDown={handleStickStart}
                onMouseUp={handleStickEnd}
                onMouseLeave={handleStickEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }} // Prevent default touch behaviors
              >
                <div 
                  ref={joystickStickRef}
                  className="joystick-stick"
                  style={{
                    transform: isDragging 
                      ? `translate(calc(-50% + ${joystickPosition.x * 50}px), calc(-50% + ${joystickPosition.y * 50}px))`
                      : 'translate(-50%, -50%)',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                  }}
                ></div>
              </div>
              <div className="joystick-info">
                <div className="protective-fields-container">
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      id="protective-fields-toggle" 
                      checked={protectiveFieldsEnabled}
                      onChange={toggleProtectiveFields}
                    />
                    <label htmlFor="protective-fields-toggle" className="toggle-label">
                      <span className="toggle-inner"></span>
                      <span className="toggle-switch"></span>
                    </label>
                  </div>
                  <div className="protective-fields-label">Muted Protective Fields</div>
                </div>
                
                {/* Joystick Speed Display */}
               
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Overlay - hiển thị khi có pending request */}
      {pendingDialogRequest && (
        <>
          {console.log('🔍 DEBUG - pendingDialogRequest:', pendingDialogRequest)}
          {console.log('🔍 DEBUG - field_config type:', pendingDialogRequest.field_config?.type)}
          <div className="dialog-overlay">
          <div className="dialog-modal">
            {pendingDialogRequest.field_config?.type === 'message' ? (
              // Message dialog - chỉ hiển thị message (read-only)
              <>
                <div className="response-dialog-header">
                  <div className="edit-icon"></div>
                  <h3>{pendingDialogRequest.title || 'Message'}</h3>
                </div>
                
                <div className="dialog-body">
                  <div className="description-message">
                    {pendingDialogRequest.field_config?.defaultValue || 'No message available'}
                  </div>
                </div>
                
                <div className="dialog-actions">
                  <button 
                    className="btn-confirm"
                    onClick={handleDialogResponse}
                    disabled={isDialogLoading}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              // Normal dialog - có input field
              <>
                <div className="response-dialog-header">
                  <div className="edit-icon"></div>
                  <h3>Please response...</h3>
                </div>
                
                <div className="dialog-body">
                  <div className="subtitle">
                    Text about mission variable.
                  </div>
                  
                  <div className="dialog-input">
                    {pendingDialogRequest.field_config?.needsPositions && isDialogLoading ? (
                      <div className="dialog-loading">Loading positions...</div>
                    ) : (
                      <DialogRequestField
                        fieldName="dialog-response"
                        label={pendingDialogRequest.field_config?.label || 'Your Response'}
                        defaultValue={pendingDialogRequest.field_config?.defaultValue || ''}
                        placeholder={pendingDialogRequest.field_config?.placeholder || 'Enter your response...'}
                        field={{ value: dialogResponse, defaultValue: pendingDialogRequest.field_config?.defaultValue }}
                        onChange={(fieldName, value) => setDialogResponse(value)}
                        type={pendingDialogRequest.field_config?.type || 'text'}
                        min={pendingDialogRequest.field_config?.min}
                        max={pendingDialogRequest.field_config?.max}
                        options={pendingDialogRequest.field_config?.options || []}
                        helpText={pendingDialogRequest.field_config?.helpText || ''}
                        readOnly={pendingDialogRequest.field_config?.readOnly || false}
                        disabled={isDialogLoading}
                        error={dialogError}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !pendingDialogRequest.field_config?.readOnly) {
                            handleDialogResponse();
                          }
                        }}
                      />
                    )}
                  </div>
                  
                  {dialogError && (
                    <div className="dialog-error">{dialogError}</div>
                  )}
                </div>
                
                <div className="dialog-actions">
                  <button 
                    className="btn-confirm"
                    onClick={handleDialogResponse}
                    disabled={isDialogLoading || (!pendingDialogRequest.field_config?.readOnly && !dialogResponse.trim() && pendingDialogRequest.field_config?.required !== false)}
                  >
                    {isDialogLoading ? 'Sending...' : (pendingDialogRequest.field_config?.readOnly ? 'Close' : 'OK')}
                  </button>
                  
                  <button 
                    className="btn-cancel"
                    onClick={handleDialogCancel}
                    disabled={isDialogLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </>
      )}
    </header>
  );
};

export default Header; 