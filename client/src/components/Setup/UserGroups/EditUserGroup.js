import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import MessageDialog from '../../common/MessageDialog';
import './EditUserGroup.css';
import '../../../App.css';

const EditUserGroup = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        level: 1,
        is_active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [isEditMode, setIsEditMode] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            loadUserGroup();
        } else {
            setIsEditMode(false);
            setLoading(false);
        }
    }, [id]);

    const loadUserGroup = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/users/groups/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.success) {
                setFormData({
                    name: response.group.name || '',
                    description: response.group.description || '',
                    level: response.group.level || 1,
                    is_active: response.group.is_active !== undefined ? response.group.is_active : true
                });
            } else {
                setError('Failed to load user group');
            }
        } catch (error) {
            console.error('Error loading user group:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load user group. Please try again.');
        } finally {
            setLoading(false);
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

        if (!formData.name.trim()) {
            setMessageData({
                title: 'Validation Error',
                message: 'Group name is required.'
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

            const url = isEditMode
                ? `${SERVER_URL}/api/users/groups/${id}`
                : `${SERVER_URL}/api/users/groups`;

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: `User group has been ${isEditMode ? 'updated' : 'created'} successfully.`
                });
                setShowMessage(true);
                setTimeout(() => {
                    navigate('/setup/user-groups');
                }, 1500);
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} user group.`
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error saving user group:', error);
            setMessageData({
                title: 'Error',
                message: `An error occurred while ${isEditMode ? 'updating' : 'creating'} user group.`
            });
            setShowMessage(true);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        navigate('/setup/user-groups');
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

    const getLevelName = (level) => {
        switch (level) {
            case 1: return 'Operators';
            case 2: return 'Users';
            case 3: return 'Administrators';
            case 4: return 'Distributors';
            default: return 'Unknown';
        }
    };

    if (loading) {
        return (
            <div className="create-mission-page">
                <div className="loading-message">Loading user group...</div>
            </div>
        );
    }

    return (
        <div className="create-mission-page">
            <div className="page-header">
                <div className="header-title">
                    <h2>{isEditMode ? 'Edit User Group' : 'Create User Group'}</h2>
                    <span className="subtitle">
                        {isEditMode ? 'Modify user group details and permissions.' : 'Create a new user group with specific permissions.'}
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
                        Group Name:
                    </span>
                    <input
                        className="form-group-input"
                        type="text"
                        placeholder="Enter the group's name..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="form-group-container">
                    <span className="form-group-label">
                        Access Level:
                    </span>
                    <select
                        className="form-group-input"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                        required
                        onKeyDown={handleKeyDown}
                    >
                        <option value={1}>1 - Operators</option>
                        <option value={2}>2 - Users</option>
                        <option value={3}>3 - Administrators</option>
                        <option value={4}>4 - Distributors</option>
                    </select>
                </div>

                <div className="form-group-container">
                    <span className="form-group-label">
                        Description:
                    </span>
                    <textarea
                        className="form-group-input"
                        placeholder="Enter group description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        onKeyDown={handleKeyDown}
                    />
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
                            Active (Inactive groups cannot be assigned to new users)
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
                                {isEditMode ? 'Update Group' : 'Create Group'}
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

export default EditUserGroup;
