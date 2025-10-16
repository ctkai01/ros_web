import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../../../config/serverConfig';
import { sendChangeSiteCommand } from '../../../../../utils/siteUtils';
import './Sites.css';
import '../../../../../App.css';
import './CreateSite.css';

const CreateSite = () => {
    const [formData, setFormData] = useState({
        siteName: '',
        isDefault: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            if (!formData.siteName) {
                setError('Please fill in site name');
                setLoading(false);
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/sites`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    siteName: formData.siteName,
                    isDefault: formData.isDefault
                }
            });

            if (response.success) {
                // Nếu site được tạo với isDefault = true, gửi lệnh CHANGE_SITE
                if (formData.isDefault) {
                    const changeSiteSuccess = await sendChangeSiteCommand(response.siteId, formData.siteName);
                    if (!changeSiteSuccess) {
                        console.warn('Failed to send CHANGE_SITE command for newly created default site');
                    }
                }
                navigate('/setup/maps/create/sites');
            } else {
                setError('Failed to create site');
            }
        } catch (error) {
            console.error('Error creating site:', error);
            setError('Failed to create site. Please try again.');
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
    return (
        <div className="create-site-page">
            <div className="page-header">
                <div className="header-title">
                    <h2>Create New Site</h2>
                    <span className="subtitle">Enter site details below</span>
                </div>
                <div className="header-buttons">
                    <button className="btn-go-back" onClick={handleCancel}>
                        <span className="go-back-icon"></span>
                        Go Back
                    </button>
                </div>
            </div>

            <form className="form-container" onSubmit={handleSubmit}>
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
                        <label htmlFor="isDefault" style={{fontSize: '13px', color: '#6e6868' }}>Set as Default Site</label>
                    </div>
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
                                Create Site
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
            </form>

        </div>
    );
};

export default CreateSite;
