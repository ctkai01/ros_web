import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../../../config/serverConfig';
import MessageDialog from '../../../../../components/common/MessageDialog';
import { sendChangeSiteCommand } from '../../../../../utils/siteUtils';
import './Sites.css';
import '../../../../../App.css';
import './EditSite.css';

const EditSite = () => {
    const [formData, setFormData] = useState({
        siteName: '',
        isDefault: false
    });
    const [initialFormData, setInitialFormData] = useState({
        siteName: '',
        isDefault: false
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const navigate = useNavigate();
    const { id } = useParams();

    // Load site data on component mount
    useEffect(() => {
        loadSiteData();
    }, [id]);

    const loadSiteData = async () => {
        try {
            setInitialLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const siteData = await apiCallWithRetry(`${SERVER_URL}/api/sites/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const newFormData = {
                siteName: siteData.siteName || siteData.site_name || '',
                isDefault: siteData.isDefault || false
            };
            setFormData(newFormData);
            setInitialFormData(newFormData);
            setError(null);
        } catch (error) {
            console.error('Error loading site:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load site data. Please try again.');
            setMessageData({
                title: 'Error',
                message: 'Failed to load site data. Please try again.'
            });
            setShowMessage(true);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Validate required fields
            if (!formData.siteName.trim()) {
                setError('Please fill in site name');
                setLoading(false);
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/sites/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    siteName: formData.siteName.trim(),
                    isDefault: formData.isDefault
                }
            });

            if (response.success) {
                // Nếu site được đặt làm default và trước đó không phải là default, gửi lệnh CHANGE_SITE
                if (formData.isDefault && !initialFormData.isDefault) {
                    const changeSiteSuccess = await sendChangeSiteCommand(id, formData.siteName.trim());
                    if (!changeSiteSuccess) {
                        console.warn('Failed to send CHANGE_SITE command for updated default site');
                    }
                }
                // Navigate back immediately on success
                navigate('/setup/maps/create/sites');
            } else {
                setError('Failed to update site');
                setMessageData({
                    title: 'Error',
                    message: 'Failed to update site. Please try again.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error updating site:', error);
            setError('Failed to update site. Please try again.');
            setMessageData({
                title: 'Error',
                message: 'Failed to update site. Please try again.'
            });
            setShowMessage(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/setup/maps/create/sites');
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

    if (initialLoading) {
        return (
            <div className="edit-site-page">
                <div className="loading-message">Loading site data...</div>
            </div>
        );
    }

    return (
        <div className="edit-site-page">
            <div className="page-header">
                <div className="header-title">
                    <h2>Edit Site</h2>
                    <span className="subtitle">Update site details below</span>
                </div>
                <div className="header-buttons">
                    <button className="btn-go-back" onClick={handleCancel}>
                        <span className="go-back-icon"></span>
                        Go Back
                    </button>
                </div>
            </div>

            <div className="form-container">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="form-group-container">
                    <span className="form-group-label">
                        Site Name:
                    </span>
                    <input
                        className="form-group-input"
                        type="text"
                        id="siteName"
                        name="siteName"
                        value={formData.siteName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter site name"
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="form-group-container">
                    <div className="form-group-checkbox">
                        <input
                            type="checkbox"
                            id="isDefault"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="isDefault">Set as Default Site</label>
                    </div>
                </div>

               
            </div>
            <div className="form-group-actions">
                    <button 
                        type="button" 
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Updating...
                            </>
                        ) : (
                            <>
                                <span className="save-icon"></span>
                                Update Site
                            </>
                        )}
                    </button>
                    <button 
                        type="button" 
                        className="btn-cancel"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        <span className="cancel-icon"></span>
                        Cancel
                    </button>
                </div>
            {/* Message Dialog */}
            <MessageDialog
                visible={showMessage}
                title={messageData.title}
                message={messageData.message}
                onClose={() => setShowMessage(false)}
            />
        </div>
    );
};

export default EditSite;
