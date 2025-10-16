import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry  } from '../../../config/serverConfig';
import { SafetySystemVisualizer } from './SafetySystemVisualizer';
import useSelfInputsInfo from '../../../hooks/useSelfInputsInfo';
import './SafetySystem.css';
import '../../../App.css';

const SafetySystem = () => {
    const navigate = useNavigate();
    const visualizerRef = useRef(null);
    const containerRef = useRef(null);
    const [footprint, setFootprint] = useState(null);
    const [tfData, setTfData] = useState(null);
    const [robotCenter, setRobotCenter] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [visualizer, setVisualizer] = useState(null);
    const [containerReady, setContainerReady] = useState(false);
    const [wsConnection, setWsConnection] = useState(null);
    const [brakeStatus, setBrakeStatus] = useState(false); // false = Released, true = Pressed
    const { selfInputsInfo } = useSelfInputsInfo();

    // Console log self inputs data
    useEffect(() => {
        if (selfInputsInfo.data && selfInputsInfo.data.length > 0) {
            console.log('Self Inputs Array (0-24):', selfInputsInfo.data);
            console.log('Array length:', selfInputsInfo.data.length);
            console.log('Status:', selfInputsInfo.status);
        }
    }, [selfInputsInfo]);

    // Load robot footprint and tf data from database
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                // Load footprint
                const footprintResponse = await apiCallWithRetry(`${SERVER_URL}/api/settings/footprint`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                console.log("Footprint API Response:", footprintResponse);

                if (footprintResponse.success && footprintResponse.data && footprintResponse.data.properties) {
                    const footprintData = footprintResponse.data.properties;
                    console.log("Setting footprint state:", footprintData);
                    setFootprint(footprintData);
                    
                    // Calculate center point from footprint
                    if (footprintData.Footprint && Array.isArray(footprintData.Footprint)) {
                        const points = footprintData.Footprint.map(point => ({
                            x: parseFloat(point[0]),
                            y: parseFloat(point[1])
                        }));
                        
                        // Calculate center
                        const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
                        const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
                        
                        setRobotCenter({ x: centerX, y: centerY });
                    }
                } else {
                    console.warn('No footprint data found, using default center');
                    setRobotCenter({ x: 0, y: 0 });
                }

                // Load tf_laser_to_base
                const tfResponse = await apiCallWithRetry(`${SERVER_URL}/api/settings/tf_laser_to_base`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                console.log("TF API Response:", tfResponse);

                if (tfResponse.success && tfResponse.data && tfResponse.data.properties) {
                    const tfData = tfResponse.data.properties;
                    console.log("Setting tf data state:", tfData);
                    setTfData(tfData);
                } else {
                    console.warn('No tf_laser_to_base data found');
                }

            } catch (error) {
                console.error('Error loading data:', error);
                setRobotCenter({ x: 0, y: 0 });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Initialize WebSocket connection for laser scan data
    useEffect(() => {
        if (!loading && visualizer) {
            const initWebSocket = () => {
                try {
                    // Use serverConfig for consistent WebSocket URL
                    const serverConfig = require('../../../config/serverConfig').default;
                    const wsUrl = serverConfig.WS_URL;
                    console.log('Connecting to WebSocket:', wsUrl);
                    
                    const ws = new WebSocket(wsUrl);
                    
                    ws.onopen = () => {
                        console.log('WebSocket connected for SafetySystem');
                        setWsConnection(ws);
                    };

                    ws.onmessage = (event) => {
                        try {
                            const message = JSON.parse(event.data);
                            
                            // Handle laser scan updates
                            if (message.type === 'scan_update' && visualizer) {
                                const scanData = message.data;
                                visualizer.updateScan(scanData);
                            }
                            // Handle brake status updates
                            else if (message.type === 'brake_update') {
                                const brakeData = message.data;
                                setBrakeStatus(brakeData.data); // Update brake status
                            }
                        } catch (error) {
                            console.error('Error parsing WebSocket message:', error);
                        }
                    };

                    ws.onerror = (error) => {
                        console.error('WebSocket error:', error);
                    };

                    ws.onclose = () => {
                        console.log('WebSocket disconnected');
                        setWsConnection(null);
                        // Try to reconnect after 10 seconds to reduce network load
                        setTimeout(() => {
                            if (!loading) {
                                initWebSocket();
                            }
                        }, 10000);
                    };

                } catch (error) {
                    console.error('Error initializing WebSocket:', error);
                }
            };

            initWebSocket();
        }

        // Cleanup WebSocket on unmount
        return () => {
            if (wsConnection) {
                wsConnection.close();
                setWsConnection(null);
            }
        };
    }, [loading, visualizer]);

    // Check if container is ready after loading is complete
    useEffect(() => {
        if (!loading && containerRef.current && !containerReady) {
            console.log("Container is ready after loading:", containerRef.current);
            setContainerReady(true);
        }
    }, [loading, containerReady]);

    // Initialize Three.js visualizer when container is ready
    useEffect(() => {
        console.log("Initializing visualizer, containerReady:", containerReady, "containerRef.current:", containerRef.current);
        if (containerReady && containerRef.current && !visualizer) {
            console.log("Creating new SafetySystemVisualizer");
            const newVisualizer = new SafetySystemVisualizer(containerRef.current);
            setVisualizer(newVisualizer);
        }

        // Cleanup on unmount
        return () => {
            if (visualizer) {
                visualizer.dispose();
            }
        };
    }, [containerReady, visualizer]);

    // Monitor brakeStatus changes
    useEffect(() => {
        console.log('brakeStatus changed to:', brakeStatus);
        console.log('Emergency button should show:', brakeStatus ? 'Pressed (Red)' : 'Released (Green)');
    }, [brakeStatus]);

    // Debug footprint and visualizer states
    useEffect(() => {
        console.log("Debug - Current states:");
        console.log("  - visualizer:", visualizer);
        console.log("  - footprint:", footprint);
        console.log("  - tfData:", tfData);
        console.log("  - loading:", loading);
        console.log("  - containerReady:", containerReady);
        console.log("  - wsConnection:", !!wsConnection);
        console.log("  - brakeStatus:", brakeStatus);
    }, [visualizer, footprint, tfData, loading, containerReady, wsConnection, brakeStatus]);

    // Load footprint and tf data into visualizer when both are ready
    useEffect(() => {
        console.log("useEffect for passing data - visualizer:", !!visualizer, "footprint:", !!footprint, "tfData:", !!tfData);
        if (visualizer && footprint) {
            console.log('Passing footprint and tf data to visualizer:', { footprint, tfData });
            // Truyền footprint và tf data vào visualizer
            visualizer.loadFootprint(footprint, tfData);
        }
    }, [visualizer, footprint, tfData]);

    return (
        <div className="safety-system-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Safety system</h2>
                    <span className="subtitle">See what the laser scanners are seeing.</span>
                </div>

            </div>

            <div className="safety-system-content">
                {/* Status Indicators */}
                <div className="safety-status-indicators">
                    <div className="status-box">
                        {console.log('Rendering emergency button with brakeStatus:', brakeStatus)}
                        <div className={`status-color-block ${brakeStatus ? 'status-red' : 'status-green'}`}>
                            <span className="status-icon">{brakeStatus ? '!' : '✓'}</span>
                        </div>
                        <div className="status-info">
                            <div className="status-title">Emergency stop button</div>
                            <div className="status-value">{brakeStatus ? 'Pressed' : 'Released'}</div>
                        </div>
                    </div>
                    
                    <div className="status-box">
                        <div className="status-color-block status-green">
                            <span className="status-icon">✓</span>
                        </div>
                        <div className="status-info">
                            <div className="status-title">Front scanner</div>
                            <div className="status-value">Free</div>
                        </div>
                    </div>
                    
                    <div className="status-box">
                        <div className="status-color-block status-green">
                            <span className="status-icon">✓</span>
                        </div>
                        <div className="status-info">
                            <div className="status-title">Rear scanner</div>
                            <div className="status-value">Free</div>
                        </div>
                    </div>
                </div>

                <div className="safety-system-main-content">
                    {/* Device Visualization */}
                    <div className="device-visualization">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Loading robot data...</p>
                            </div>
                        ) : (
                            <div className="threejs-container" ref={containerRef}>
                                {/* Three.js canvas will be inserted here */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetySystem;
