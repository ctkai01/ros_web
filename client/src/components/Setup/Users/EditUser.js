import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import MessageDialog from '../../common/MessageDialog';
import './EditUser.css';
import '../../../App.css';

const EditUser = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        group_id: '',
        pincode: '',
        is_active: true
    });
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [isEditMode, setIsEditMode] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        loadUserGroups();
        if (id) {
            setIsEditMode(true);
            loadUser();
        } else {
            setIsEditMode(false);
            setLoading(false);
        }
    }, [id]);

    const loadUserGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/users/groups`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.success) {
                setUserGroups(response.groups || []);
                // Set default group if available
                if (response.groups && response.groups.length > 0 && !isEditMode) {
                    setFormData(prev => ({
                        ...prev,
                        group_id: response.groups[0].id.toString()
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            setError('Failed to load user groups');
        }
    };

    const loadUser = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.success) {
                setFormData({
                    username: response.user.username || '',
                    password: '', // Don't load password
                    full_name: response.user.full_name || '',
                    email: response.user.email || '',
                    group_id: response.user.group_id ? response.user.group_id.toString() : '',
                    pincode: response.user.pincode || '',
                    is_active: response.user.is_active !== undefined ? response.user.is_active : true
                });
            } else {
                setError('Failed to load user');
            }
        } catch (error) {
            console.error('Error loading user:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username.trim()) {
            setMessageData({
                title: 'Validation Error',
                message: 'Username is required.'
            });
            setShowMessage(true);
            return;
        }

        if (!isEditMode && !formData.password.trim()) {
            setMessageData({
                title: 'Validation Error',
                message: 'Password is required for new users.'
            });
            setShowMessage(true);
            return;
        }

        if (!formData.group_id) {
            setMessageData({
                title: 'Validation Error',
                message: 'User group is required.'
            });
            setShowMessage(true);
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Prepare data for API
            const requestData = {
                username: formData.username,
                full_name: formData.full_name,
                email: formData.email,
                group_id: parseInt(formData.group_id),
                is_active: formData.is_active
            };

            // Only include password if provided (for new users or password changes)
            if (formData.password.trim()) {
                requestData.password = formData.password;
            }

            // Only include pincode if provided
            if (formData.pincode.trim()) {
                requestData.pincode = formData.pincode;
            }

            const url = isEditMode 
                ? `${SERVER_URL}/api/users/${id}`
                : `${SERVER_URL}/api/users`;
            
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: `User has been ${isEditMode ? 'updated' : 'created'} successfully.`
                });
                setShowMessage(true);
                setTimeout(() => {
                    navigate('/setup/users');
                }, 1500);
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} user.`
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            setMessageData({
                title: 'Error',
                message: `An error occurred while ${isEditMode ? 'updating' : 'creating'} user.`
            });
            setShowMessage(true);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        navigate('/setup/users');
    };

    if (loading) {
        return (
            <div className="create-mission-page">
                <div className="loading-message">Loading user...</div>
            </div>
        );
    }

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
        <div className="create-mission-page">
            <div className="page-header">
                <div className="header-title">
                    <h2>{isEditMode ? 'Edit User' : 'Create User'}</h2>
                    <span className="subtitle">
                        {isEditMode ? 'Modify user details and permissions.' : 'Create a new user with specific permissions.'}
                    </span>
                </div>
                <div className="header-buttons">
                    <button className="btn-go-back" onClick={handleBack}>
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
                        Username:
                    </span>
                    <input
                        className="form-group-input"
                        type="text"
                        placeholder="Enter username..."
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="form-group-container">
                    <span className="form-group-label">
                        Password:
                    </span>
                    <input
                        className="form-group-input"
                        type="password"
                        placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password..."}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!isEditMode}
                        onKeyDown={handleKeyDown}
                    />
                    {isEditMode && (
                        <small className="form-help">
                            Leave blank to keep the current password
                        </small>
                    )}
                </div>

                <div className="form-double-container">
                    <div className="form-group-container">
                        <span className="form-group-label">
                            Full Name:
                        </span>
                        <input
                            className="form-group-input"
                            type="text"
                            placeholder="Enter full name..."
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="form-group-container">
                        <span className="form-group-label">
                            Email:
                        </span>
                        <input
                            className="form-group-input"
                            type="email"
                            placeholder="Enter email address..."
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                <div className="form-double-container">
                    <div className="form-group-container">
                        <span className="form-group-label">
                            User Group:
                        </span>
                        <select
                            className="form-group-input"
                            value={formData.group_id}
                            onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                            required
                            onKeyDown={handleKeyDown}
                        >
                            <option value="">Select a user group</option>
                            {userGroups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.name} (Level {group.level})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group-container">
                        <span className="form-group-label">
                            Pincode:
                        </span>
                        <input
                            className="form-group-input"
                            type="text"
                            placeholder="Enter pincode (optional)..."
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                        <small className="form-help">
                            Optional: Allows login with pincode instead of password
                        </small>
                    </div>
                </div>

                <div className="form-group-container">
                    <div className="form-group-checkbox">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            onKeyDown={handleKeyDown}
                        />
                        <label htmlFor="is_active">
                            Active (Inactive users cannot log in)
                        </label>
                    </div>
                </div>

                <div className="form-group-actions">
                    <button
                        type="button"
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={saving}
                        onKeyDown={handleKeyDown}
                    >
                        {saving ? (
                            <>
                                <span className="loading-spinner"></span>
                                {isEditMode ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <span className="save-icon"></span>
                                {isEditMode ? 'Update User' : 'Create User'}
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleBack}
                        disabled={saving}
                        onKeyDown={handleKeyDown}
                    >
                        <span className="cancel-icon"></span>
                        Cancel
                    </button>
                </div>
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

export default EditUser;
