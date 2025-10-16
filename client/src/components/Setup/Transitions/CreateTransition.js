import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import MessageDialog from '../../common/MessageDialog';
import './Transitions.css';
import '../../../App.css';

const CreateTransition = () => {
    const [formData, setFormData] = useState({
        SiteID: '',
        StartPositionID: '',
        GoalPositionID: '',
        MissionID: '',
        CreatedBy: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [mappingData, setMappingData] = useState({ sites: {} });
    const navigate = useNavigate();

    useEffect(() => {
        loadMappingData();
    }, []);

    const loadMappingData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const mappingData = await apiCallWithRetry(`${SERVER_URL}/api/transitions/mapping`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setMappingData(mappingData);
        } catch (error) {
            console.error('Error loading mapping data:', error);
        }
    };

    const getPointDisplayName = (pointId) => {
        if (!pointId || !formData.SiteID || !mappingData.sites[formData.SiteID]) {
            return '';
        }

        for (const mapId in mappingData.sites[formData.SiteID].maps) {
            const map = mappingData.sites[formData.SiteID].maps[mapId];
            if (map.points[pointId]) {
                return `${map.points[pointId].name}${map.name}`;
            }
        }
        return `Position ${pointId}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'SiteID') {
            // Reset position and mission selections when site changes
            setFormData(prev => ({
                ...prev,
                [name]: value,
                StartPositionID: '',
                GoalPositionID: '',
                MissionID: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.SiteID || !formData.StartPositionID || !formData.GoalPositionID || !formData.MissionID) {
            setError('Please fill in all required fields');
            setMessageData({ title: 'Error', message: 'Please fill in all required fields' });
            setShowMessage(true);
            return;
        }

        if (formData.StartPositionID === formData.GoalPositionID) {
            setError('Start position and goal position cannot be the same');
            setMessageData({ title: 'Error', message: 'Start position and goal position cannot be the same' });
            setShowMessage(true);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/transitions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    CreatedBy: localStorage.getItem('username') || 'Unknown'
                })
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            const result = await response.json();

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'Transition created successfully!'
                });
                setShowMessage(true);
                setTimeout(() => {
                    navigate('/setup/transitions');
                }, 1500);
            } else {
                const errorMessage = result.error || 'Failed to create transition';
                if (response.status === 409) {
                    setMessageData({
                        title: 'Error',
                        message: 'A transition with this configuration already exists.'
                    });
                } else if (response.status === 400) {
                    setMessageData({
                        title: 'Error',
                        message: errorMessage
                    });
                } else {
                    setMessageData({
                        title: 'Error',
                        message: errorMessage
                    });
                }
                setShowMessage(true);
                return;
            }
        } catch (error) {
            console.error('Error creating transition:', error);
            setError('Failed to create transition. Please try again.');
            setMessageData({
                title: 'Error',
                message: 'Failed to create transition. Please try again.'
            });
            setShowMessage(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/setup/transitions');
    };

    const handleKeyDown = (e) => {
        // Prevent Enter key from submitting form and refreshing page
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          
          // On mobile, blur the input to hide virtual keyboard
          if (e.target && typeof e.target.blur === 'function') {
            e.target.blur();
          }
        }
      };
    return (
        <div className="create-transition-page">
            <div className="page-header">
                <div className="header-title">
                    <h2>Create Transition</h2>
                    <span className="subtitle">Add a new transition</span>
                </div>
                <div className="header-buttons">
                    <button className="btn-go-back" onClick={() => navigate('/setup/transitions')}>
                        <span className="go-back-icon"></span>
                        Go Back
                    </button>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-container">
                    <div className="form-group-container">
                        <span className="form-group-label">Site:</span>
                        <select
                            id="SiteID"
                            name="SiteID"
                            value={formData.SiteID}
                            onChange={handleInputChange}
                            className="form-group-input"
                            required
                            onKeyDown={handleKeyDown}
                        >
                            <option value="">Select a site...</option>
                            {Object.values(mappingData.sites).map(site => (
                                <option key={site.id} value={site.id}>
                                    {site.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-double-container">
                        <div className="form-group-container">
                            <span className="form-group-label">Start Position:</span>
                            <select
                                id="StartPositionID"
                                name="StartPositionID"
                                value={formData.StartPositionID}
                                onChange={handleInputChange}
                                className="form-group-input"
                                required
                                disabled={!formData.SiteID}
                                onKeyDown={handleKeyDown}
                            >
                                {formData.StartPositionID && (
                                    <option value={formData.StartPositionID} style={{ display: 'none' }}>
                                        {getPointDisplayName(formData.StartPositionID)}
                                    </option>
                                )}
                                <option value="">Select start position...</option>
                                {formData.SiteID && mappingData.sites[formData.SiteID] &&
                                    Object.values(mappingData.sites[formData.SiteID].maps).map(map => (
                                        <React.Fragment key={map.id}>
                                            <option disabled style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                                {map.name}
                                            </option>
                                            {Object.values(map.points).map(point => (
                                                <option key={point.id} value={point.id} style={{ paddingLeft: '20px' }}>
                                                    {point.name}
                                                </option>
                                            ))}
                                        </React.Fragment>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="form-group-container">
                            <span className="form-group-label">Goal Position:</span>
                            <select
                                id="GoalPositionID"
                                name="GoalPositionID"
                                value={formData.GoalPositionID}
                                onChange={handleInputChange}
                                className="form-group-input"
                                required
                                disabled={!formData.SiteID}
                                onKeyDown={handleKeyDown}
                            >
                                {formData.GoalPositionID && (
                                    <option value={formData.GoalPositionID} style={{ display: 'none' }}>
                                        {getPointDisplayName(formData.GoalPositionID)}
                                    </option>
                                )}
                                <option value="">Select goal position...</option>
                                {formData.SiteID && mappingData.sites[formData.SiteID] &&
                                    Object.values(mappingData.sites[formData.SiteID].maps).map(map => (
                                        <React.Fragment key={map.id}>
                                            <option disabled style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                                {map.name}
                                            </option>
                                            {Object.values(map.points).map(point => (
                                                <option key={point.id} value={point.id} style={{ paddingLeft: '20px' }}>
                                                    {point.name}
                                                </option>
                                            ))}
                                        </React.Fragment>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    <div className="form-group-container">
                        <span className="form-group-label">Mission:</span>
                        <select
                            id="MissionID"
                            name="MissionID"
                            value={formData.MissionID}
                            onChange={handleInputChange}
                            className="form-group-input"
                            required
                            disabled={!formData.SiteID}
                            onKeyDown={handleKeyDown}
                        >
                            <option value="">Select a mission...</option>
                            {formData.SiteID && mappingData.sites[formData.SiteID] &&
                                mappingData.sites[formData.SiteID].missions &&
                                Object.values(mappingData.sites[formData.SiteID].missions).map(mission => (
                                    <option key={mission.id} value={mission.id}>
                                        {mission.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="form-group-actions">
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span className="save-icon"></span>
                                    Create Transition
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            <span className="go-back-icon"></span>
                            Cancel
                        </button>
                    </div>
                </div>
            </form>

            <MessageDialog
                visible={showMessage}
                title={messageData.title}
                message={messageData.message}
                onClose={() => setShowMessage(false)}
            />
        </div>
    );
};

export default CreateTransition;
