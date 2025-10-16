import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../../config/serverConfig';
import { Map2D } from '../EditMaps/Map_2D/Map_2D';

import './ViewMap.css';
import { Buffer } from "buffer";

const ViewMap = () => {
  const { mapId } = useParams();
  const navigate = useNavigate();
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  console.log("mapId :",mapId);
  useEffect(() => {
    loadMapData();
    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, [mapId]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await apiCallWithRetry(`${SERVER_URL}/api/maps/load/${mapId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          mapId,
          timeout: 30000 
        })
      });

      if (response.success && response.data) {
        setMapData(response.data);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to load map data');
      }
    } catch (error) {
      console.error('Error loading map data:', error);
      setError('Failed to load map data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mapData && canvasRef.current) {
      initializeMap();
    }
  }, [mapData, canvasRef.current]);

  const initializeMap = () => {
    console.log("initializeMap");
    if (mapRef.current) {
      mapRef.current.dispose();
    }

    if (!mapData || !mapData.siteId) {
      console.error('Missing required map data:', mapData);
      setError('Invalid map data: missing site ID');
      return;
    }

    if (!canvasRef.current) {
      console.error('Map container not found');
      setError('Map container not found');
      return;
    }

    try {
      mapRef.current = new Map2D(canvasRef.current);
      mapRef.current.siteId = mapData.siteId;
      mapRef.current.mapId = mapId;
      
      const initSuccess = mapRef.current.initialize();
      
      if (!initSuccess || !mapRef.current.isInitialized) {
        throw new Error('Failed to initialize map');
      }
      
      if (mapData.info) {
        const buffer = Buffer.from(mapData.info.data);
        const bufferMapdata = Buffer.from(mapData.mapData.data);
        console.log("bufferMapdata :",bufferMapdata);
        // Convert buffer to string and split into lines
        const bufferString = buffer.toString('utf-8');
        const lines = bufferString.split('\n');
        
        // Parse each line into key-value pairs
        const mapInfo = {};
        lines.forEach(line => {
          if (!line.trim() || line.trim().startsWith('#')) return;
          
          const [key, ...valueParts] = line.split(':');
          if (!key || !valueParts.length) return;
          
          const value = valueParts.join(':').trim();
          
          switch (key.trim()) {
            case 'width':
            case 'height':
            case 'resolution':
              mapInfo[key.trim()] = parseFloat(value);
              break;
            case 'origin':
              const originValues = value
                .replace(/[\[\]]/g, '')
                .split(',')
                .map(v => parseFloat(v.trim()));
              mapInfo[key.trim()] = {
                position: {
                  x: originValues[0],
                  y: originValues[1]
                },
                orientation: {
                  z: originValues[2] || 0
                }
              };
              break;
            case 'occupied_thresh':
            case 'free_thresh':
            case 'negate':
              mapInfo[key.trim()] = parseFloat(value);
              break;
            case 'image':
              mapInfo[key.trim()] = value;
              break;
            default:
              mapInfo[key.trim()] = value;
          }
        });

        // Process map data buffer
        const mapDataArray = new Uint8Array(bufferMapdata);
        
        // Create a new map data object with parsed info and data
        const updatedMapData = {
          ...mapData,
          info: {
            ...mapData.info,
            ...mapInfo
          },
          mapData: {
            ...mapData.mapData,
            data: mapDataArray
          }
        };
        
        // Update map after initialization
        requestAnimationFrame(() => {
          if (mapRef.current && mapRef.current.isInitialized) {
            mapRef.current.setMapData(updatedMapData);
            mapRef.current.fitCameraToMap();
          }
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please try again.');
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    }
  };

  const handleGoBack = () => {
    if (mapRef.current) {
      mapRef.current.dispose();
    }
    navigate('/setup/maps');
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.fitCameraToMap();
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading map data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={loadMapData}>
          Retry Loading
        </button>
        <button className="go-back-button" onClick={handleGoBack}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="view-map-container">
      <div className="view-map-header">
        <div className="header-title">
          <h2>{mapData?.mapName || 'View Map'}</h2>
          <span className="subtitle">View the map</span>
        </div>
        <button className="go-back-button" onClick={handleGoBack}>
          Go back
        </button>
      </div>
      <div className="view-map-content">
        <div className="map-toolbar">
            <div className="toolbar-left-group"></div>
          <div className="toolbar-right-group">
            <div className="reset-view-button">
              <button 
                className="tool-button" 
                title="Reset View"
                onClick={handleResetView}
              >
                <span className="tool-icon reset-view-icon"></span>
              </button>
            </div>
            <div className="zoom-in-button">
              <button className="tool-button" title="Zoom In" onClick={handleZoomIn}>
                <span className="tool-icon zoom-in-icon"></span>
              </button>
            </div>
            <div className="zoom-out-button">
              <button className="tool-button" title="Zoom Out" onClick={handleZoomOut}>
                <span className="tool-icon zoom-out-icon"></span>
              </button>
            </div>
          </div>
        </div>
        <div className="viewer-map-canvas" ref={canvasRef}></div>
        <div className="map-info-bar">
          <span>Drag the map to move your view or use the zoom-in and -out buttons to zoom</span>
        </div>
      </div>
    </div>
  );
};

export default ViewMap; 