import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import MessageDialog from '../../common/MessageDialog';
import './Groups.css';
import '../../../App.css';

const CreateGroup = () => {
    const [formData, setFormData] = useState({
        groupName: ''
    });
    const [loading, setLoading] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/groups`, {
                method: 'POST',
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
                message: `Group "${formData.groupName}" has been created successfully.`
            });
            setShowMessage(true);

            // Reset form
            setFormData({ groupName: '' });

        } catch (error) {
            console.error('Error creating group:', error);

            let errorMessage = 'Failed to create group. Please try again.';

            if (error.message.includes('409')) {
                errorMessage = 'Group name already exists. Please choose a different name.';
            } else if (error.message.includes('400')) {
                errorMessage = 'Invalid data provided. Please check your input.';
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
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/setup/missions/groups');
    };

    return (
        <div className="create-group-page">
            <div className="page-header">
                <div className="header-title">
                    <h2>Create Group</h2>
                    <span className="subtitle">Add a new group</span>
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
                        <span className="form-group-label">Group Name *</span>
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
                            disabled={loading}
                        />
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
                                Create Group
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleCancel}
                        disabled={loading}
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

export default CreateGroup;
