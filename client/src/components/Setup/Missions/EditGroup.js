import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import MessageDialog from '../../common/MessageDialog';
import './Groups.css';
import '../../../App.css';

const EditGroup = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        groupName: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadGroup();
    }, [id]);

    const loadGroup = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const groupData = await apiCallWithRetry(`${SERVER_URL}/api/groups/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setFormData({
                groupName: groupData.groupName || ''
            });
            setError(null);
        } catch (error) {
            console.error('Error loading group:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            } else if (error.message.includes('404')) {
                setError('Group not found');
            } else {
                setError('Failed to load group. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!formData.groupName.trim()) {
            setMessageData({
                title: 'Validation Error',
                message: 'Group name is required.'
            });
            setShowMessage(true);
            return;
        }

        // Check if group ID <= 12 (protected groups)
        if (parseInt(id) <= 12) {
            setMessageData({
                title: 'Access Denied',
                message: 'Cannot modify protected groups (ID <= 12).'
            });
            setShowMessage(true);
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/groups/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    groupName: formData.groupName.trim()
                })
            });

            setMessageData({
                title: 'Success',
                message: `Group "${formData.groupName}" has been updated successfully.`
            });
            setShowMessage(true);

        } catch (error) {
            console.error('Error updating group:', error);

            let errorMessage = 'Failed to update group. Please try again.';

            if (error.message.includes('409')) {
                errorMessage = 'Group name already exists. Please choose a different name.';
            } else if (error.message.includes('400')) {
                errorMessage = 'Invalid data provided. Please check your input.';
            } else if (error.message.includes('403')) {
                errorMessage = 'Cannot modify protected groups (ID <= 12).';
            } else if (error.message.includes('404')) {
                errorMessage = 'Group not found.';
            } else if (error.message.includes('401')) {
                navigate('/login');
                return;
            }

            setMessageData({
                title: 'Error',
                message: errorMessage
            });
            setShowMessage(true);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/setup/missions/groups');
    };

    const handleGoBack = () => {
        navigate('/setup/missions/groups');
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

    if (loading) {
        return (
            <div className="edit-group-page">
                <div className="loading-message">Loading group...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="edit-group-page">
                <div className="error-message">{error}</div>
                <button onClick={() => navigate('/setup/missions/groups')} className="btn-cancel">
                    Back to Groups
                </button>
            </div>
        );
    }

    return (
        <div className="edit-group-page">
            <div className="page-header">
                <div className="header-title">
                    <h2>Edit Group</h2>
                    <span className="subtitle">Modify group information</span>
                </div>
                <div className="header-actions">
                    <button className="btn-go-back" onClick={handleGoBack}>
                        <span className="go-back-icon"></span>
                        Go back
                    </button>
                </div>
            </div>
            <form onSubmit={handleSubmit}>

                <div className="form-container">
                    <div className="form-group-container">
                        <span className="form-group-label">Group Name:</span>
                        <input
                            type="text"
                            id="groupName"
                            name="groupName"
                            value={formData.groupName}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="form-group-input"
                            placeholder="Enter group name"
                            required
                            disabled={saving || parseInt(id) <= 12}
                        />
                        {parseInt(id) <= 12 && (
                            <small className="form-hint">
                                This is a protected group and cannot be modified.
                            </small>
                        )}
                    </div>
                </div>
                <div className="form-group-actions">
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={saving || !formData.groupName.trim() || parseInt(id) <= 12}
                    >
                        {saving ? (
                            <>
                                <span className="loading-spinner"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="save-icon"></span>
                                Save Changes
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        <span className="go-back-icon"></span>
                        Cancel
                    </button>
                </div>
            </form>


            {/* Message Dialog */}
            <MessageDialog
                visible={showMessage}
                title={messageData.title}
                message={messageData.message}
                onClose={() => {
                    setShowMessage(false);
                    if (messageData.title === 'Success') {
                        navigate('/setup/missions/groups');
                    }
                }}
            />
        </div>
    );
};

export default EditGroup;
