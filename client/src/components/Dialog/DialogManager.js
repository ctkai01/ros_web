import React, { useState, useEffect } from 'react';
import { SERVER_URL } from '../../config/serverConfig.js';
import './DialogManager.css';

const DialogManager = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Field types
    const FIELD_TYPES = {
        TEXT: 'text',
        INT: 'int',
        DOUBLE: 'double',
        COMBOBOX: 'combobox',
        POSITION: 'position',
        COMPARE: 'compare',
        TIME: 'time'
    };

    // Polling để lấy pending requests
    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${SERVER_URL}/api/dialog/variable/pending`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPendingRequests(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };

        // Fetch immediately
        fetchPendingRequests();

        // Use longer interval for remote access to reduce network load
        const isRemoteAccess = typeof window !== 'undefined' && 
          window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1' && 
          !window.location.hostname.startsWith('192.168.');
        
        const intervalMs = isRemoteAccess ? 5000 : 2000; // 5s for remote, 2s for local
        const interval = setInterval(fetchPendingRequests, intervalMs);

        return () => clearInterval(interval);
    }, []);

    const validateResponse = (value, fieldConfig) => {
        if (!fieldConfig) return true;
        
        const { type, min, max, required } = fieldConfig;
        
        if (required && (!value || value.trim() === '')) {
            return 'This field is required';
        }
        
        if (type === FIELD_TYPES.INT) {
            const intValue = parseInt(value);
            if (isNaN(intValue)) return 'Please enter a valid integer';
            if (min !== null && intValue < min) return `Value must be at least ${min}`;
            if (max !== null && intValue > max) return `Value must be at most ${max}`;
        }
        
        if (type === FIELD_TYPES.DOUBLE) {
            const doubleValue = parseFloat(value);
            if (isNaN(doubleValue)) return 'Please enter a valid number';
            if (min !== null && doubleValue < min) return `Value must be at least ${min}`;
            if (max !== null && doubleValue > max) return `Value must be at most ${max}`;
        }
        
        return null;
    };

    const handleSendResponse = async () => {
        if (!selectedRequest) {
            setError('Please select a request');
            return;
        }

        const validationError = validateResponse(response, selectedRequest.field_config);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const responseData = await fetch(`${SERVER_URL}/api/dialog/variable/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    request_id: selectedRequest.request_id,
                    response: response.trim()
                })
            });

            if (responseData.ok) {
                const result = await responseData.json();
                console.log('Response sent successfully:', result);
                
                // Remove the responded request from the list
                setPendingRequests(prev => 
                    prev.filter(req => req.request_id !== selectedRequest.request_id)
                );
                
                // Reset form
                setSelectedRequest(null);
                setResponse('');
                setError('');
            } else {
                const errorData = await responseData.json();
                setError(errorData.error || 'Failed to send response');
            }
        } catch (error) {
            console.error('Error sending response:', error);
            setError('Failed to send response. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${SERVER_URL}/api/dialog/variable/request/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Remove from list
                setPendingRequests(prev => 
                    prev.filter(req => req.request_id !== requestId)
                );
                
                // Clear selection if this was the selected request
                if (selectedRequest && selectedRequest.request_id === requestId) {
                    setSelectedRequest(null);
                    setResponse('');
                }
            }
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        // Format as UTC to match database time
        return date.toLocaleString('en-GB', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (pendingRequests.length === 0) {
        return (
            <div className="dialog-manager">
                <div className="dialog-header">
                    <h3>Robot Dialog Manager</h3>
                </div>
                <div className="dialog-content">
                    <p className="no-requests">No pending dialog requests from robot</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dialog-manager">
            <div className="dialog-header">
                <h3>Robot Dialog Manager</h3>
                <span className="request-count">
                    {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="dialog-content">
                <div className="requests-list">
                    <h4>Pending Requests:</h4>
                    {pendingRequests.map((request) => (
                        <div 
                            key={request.request_id} 
                            className={`request-item ${selectedRequest?.request_id === request.request_id ? 'selected' : ''}`}
                            onClick={() => setSelectedRequest(request)}
                        >
                            <div className="request-header">
                                <span className="request-id">ID: {request.request_id}</span>
                                <span className="request-time">{formatTimestamp(request.timestamp)}</span>
                            </div>
                            <div className="request-message">{request.message}</div>
                            <div className="request-actions">
                                <button 
                                    className="btn-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRequest(request.request_id);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedRequest && (
                    <div className="response-section">
                        <h4>Send Response:</h4>
                        <div className="selected-request">
                            <strong>Request ID:</strong> {selectedRequest.request_id}
                            <br />
                            <strong>Message:</strong> {selectedRequest.message}
                        </div>
                        
                        <div className="response-input">
                            <label htmlFor="response">
                                {selectedRequest.field_config?.label || 'Your Response'}:
                            </label>
                            
                            {selectedRequest.field_config?.type === FIELD_TYPES.COMBOBOX ? (
                                <select
                                    id="response"
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">{selectedRequest.field_config?.placeholder || 'Select...'}</option>
                                    {selectedRequest.field_config?.options?.map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={selectedRequest.field_config?.type === FIELD_TYPES.INT || selectedRequest.field_config?.type === FIELD_TYPES.DOUBLE ? 'number' : 'text'}
                                    id="response"
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder={selectedRequest.field_config?.placeholder || 'Enter your response...'}
                                    min={selectedRequest.field_config?.min}
                                    max={selectedRequest.field_config?.max}
                                    step={selectedRequest.field_config?.type === FIELD_TYPES.DOUBLE ? '0.1' : '1'}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendResponse();
                                        }
                                    }}
                                />
                            )}
                            
                            {selectedRequest.field_config?.helpText && (
                                <div className="help-text">{selectedRequest.field_config.helpText}</div>
                            )}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="response-actions">
                            <button 
                                className="btn-send"
                                onClick={handleSendResponse}
                                disabled={loading || (!response.trim() && selectedRequest.field_config?.required !== false)}
                            >
                                {loading ? 'Sending...' : 'Send Response'}
                            </button>
                            <button 
                                className="btn-cancel"
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setResponse('');
                                    setError('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DialogManager;
