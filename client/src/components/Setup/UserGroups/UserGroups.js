import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import './UserGroups.css';
import '../../../App.css';

const UserGroups = () => {
    const [userGroups, setUserGroups] = useState([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [userPermissions, setUserPermissions] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    // Calculate items per page based on viewport height
    const calculateItemsPerPage = () => {
        const viewportHeight = window.innerHeight;
        const headerHeight = 76; // Page header height
        const filterHeight = 73; // Filter section height
        const paginationHeight = 60; // Pagination height
        const tableHeaderHeight = 32; // Table header height
        const rowHeight = 40; // Approximate row height
        const padding = 10; // Additional padding

        const availableHeight = viewportHeight - headerHeight - filterHeight - paginationHeight - tableHeaderHeight - padding;
        const calculatedItems = Math.floor(availableHeight / rowHeight);

        // Ensure minimum and maximum values
        return Math.max(5, Math.min(calculatedItems, 50));
    };

    const loadUserGroups = async () => {
        try {
            setLoading(true);
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
                setError(null);
            } else {
                setError('Failed to load user groups');
                setUserGroups([]);
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load user groups. Please try again.');
            setUserGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserGroups();
        loadUserInfo();
    }, []);

    // Update items per page when viewport changes
    useEffect(() => {
        const updateItemsPerPage = () => {
            const newItemsPerPage = calculateItemsPerPage();
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1); // Reset to first page when changing items per page
        };

        // Set initial value
        updateItemsPerPage();

        // Add event listener for window resize
        window.addEventListener('resize', updateItemsPerPage);

        // Cleanup
        return () => window.removeEventListener('resize', updateItemsPerPage);
    }, []);



    const openDeleteConfirm = (itemId) => {
        setDeleteItemId(itemId);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setDeleteItemId(null);
    };

    const handleDeleteUserGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/users/groups/${deleteItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'User group has been deleted successfully.'
                });
                setShowMessage(true);
                loadUserGroups(); // Reload the data
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.error || 'Failed to delete user group.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting user group:', error);
            setMessageData({
                title: 'Error',
                message: 'An error occurred while deleting user group.'
            });
            setShowMessage(true);
        } finally {
            closeDeleteConfirm();
        }
    };



    const closeMessage = () => {
        setShowMessage(false);
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-GB', {
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
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

    const getLevelColor = (level) => {
        switch (level) {
            case 1: return '#ff9800'; // Orange for Operators
            case 2: return '#2196f3'; // Blue for Users
            case 3: return '#4caf50'; // Green for Administrators
            case 4: return '#f44336'; // Red for Distributors
            default: return '#666';
        }
    };

    // Filter items based on search
    const filteredItems = userGroups.filter(item => {
        const searchLower = searchFilter.toLowerCase();
        return (
            (item.name && item.name.toLowerCase().includes(searchLower)) ||
            (item.description && item.description.toLowerCase().includes(searchLower)) ||
            (item.id && item.id.toString().includes(searchLower)) ||
            (getLevelName(item.level) && getLevelName(item.level).toLowerCase().includes(searchLower))
        );
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredItems.slice(startIndex, endIndex);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event) => {
        const newItemsPerPage = parseInt(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    };

    const handleRefresh = () => {
        loadUserGroups();
    };

    const loadUserInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Get current user info
            const userResponse = await apiCallWithRetry(`${SERVER_URL}/api/auth/user-info`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (userResponse.success) {
                setCurrentUser(userResponse.user);
            }

            // Get user permissions
            const permissionsResponse = await apiCallWithRetry(`${SERVER_URL}/api/auth/permissions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (permissionsResponse.success) {
                setUserPermissions(permissionsResponse.permissions || []);
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    };

    const hasPermission = (module, action) => {
        return userPermissions.some(permission => 
            permission.module === module && permission.action === action
        );
    };

    const canEditGroup = (groupLevel) => {
        if (!currentUser) return false;
        
        // Distributors can edit all groups
        if (currentUser.group_level === 4) return true;
        
        // Administrators can edit Users and Operators
        if (currentUser.group_level === 3) {
            return groupLevel <= 2; // Users (2) and Operators (1)
        }
        
        // Users and Operators cannot edit any groups
        return false;
    };

    const canDeleteGroup = (groupLevel) => {
        if (!currentUser) return false;
        
        // Only Distributors can delete groups
        if (currentUser.group_level === 4) {
            // Cannot delete Distributors group
            return groupLevel < 4;
        }
        
        return false;
    };

    const handleEdit = (groupId) => {
        navigate(`/setup/user-groups/edit/${groupId}`);
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
            <div className="user-groups-page-container">
                <div className="loading-message">Loading user groups...</div>
            </div>
        );
    }

    return (
        <div className="user-groups-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>User Groups</h2>
                    <span className="subtitle">Manage user groups and permissions.</span>
                </div>
                <div className="header-actions">
                    <button className="btn-create" onClick={() => navigate('/setup/user-groups/create')}>
                        <span className="add-icon"></span>
                        Create Group
                    </button>
                    <button className="btn-clear" onClick={() => setSearchFilter('')}>
                        <span className="clear-icon"></span>
                        Clear Filter
                    </button>
                </div>
            </div>

            <div className="user-groups-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Search by ID, name, description, or level..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredItems.length} item(s) found</span>
                    </div>
                    {searchFilter && (
                        <div className="search-hint">
                            <small>Searching in: ID, Name, Description, Level</small>
                        </div>
                    )}

                    <div className="pagination">
                        <div className="pagination-controls">
                            <div className="prev-last-button">
                                <button
                                    className="prev-button"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                ></button>
                                <span className="tool-icon prev-last-icon-button"></span>
                            </div>
                            <div className="prev-button">
                                <button
                                    className="prev-button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                ></button>
                                <span className="tool-icon prev-icon-button"></span>
                            </div>
                            <span>Page {currentPage} of {totalPages || 1}</span>
                            <div className="next-button">
                                <button
                                    className="next-button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                ></button>
                                <span className="tool-icon next-icon-button"></span>
                            </div>
                            <div className="last-button">
                                <button
                                    className="last-button"
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                ></button>
                                <span className="tool-icon last-icon-button"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="user-groups-main-content">
                    <div className="user-groups-list">
                        {currentItems.length === 0 ? (
                            <div className="user-groups-no-groups">
                                {filteredItems.length === 0
                                    ? (searchFilter ? 'No items found matching your search' : 'No user groups available')
                                    : 'No items on this page'}
                            </div>
                        ) : (
                            <table className="user-groups-table">
                                <thead>
                                    <tr>
                                        <th className="icon-column"></th>
                                        <th><strong>ID</strong></th>
                                        <th><strong>Name</strong></th>
                                        <th><strong>Description</strong></th>
                                        <th><strong>Level</strong></th>
                                        <th><strong>Status</strong></th>
                                        <th><strong>Created</strong></th>
                                        <th><strong>Function</strong></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((item) => (
                                        <tr key={item.id} className="user-groups-table-row">
                                            <td className="user-groups-icon-cell">
                                                <div className="user-groups-icon-content">
                                                    <div className="user-groups-icon"></div>
                                                </div>
                                            </td>

                                            <td className="user-groups-id-cell">
                                                {item.id}
                                            </td>

                                            <td className="user-groups-name-cell">
                                                <div className="name-content">
                                                    {item.name || 'No name'}
                                                </div>
                                            </td>

                                            <td className="user-groups-description-cell">
                                                <div className="description-content">
                                                    {item.description || 'No description'}
                                                </div>
                                            </td>

                                            <td className="user-groups-level-cell">
                                                <div className="level-content">
                                                    <span 
                                                        className="level-badge"
                                                        style={{ backgroundColor: getLevelColor(item.level) }}
                                                    >
                                                        {getLevelName(item.level)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="user-groups-status-cell">
                                                <div className="status-content">
                                                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="user-groups-created-cell">
                                                {formatTimestamp(item.created_at)}
                                            </td>

                                            <td className="user-groups-function-cell">
                                                <div className="table-actions">
                                                    {canEditGroup(item.level) && (
                                                        <button
                                                            className="table-action-icon"
                                                            onClick={() => handleEdit(item.id)}
                                                            title="Edit this user group"
                                                            onKeyDown={handleKeyDown}
                                                        >
                                                            <span className="edit-icon"></span>
                                                        </button>
                                                    )}
                                                    {canDeleteGroup(item.level) && (
                                                        <button
                                                            className="table-action-icon"
                                                            onClick={() => openDeleteConfirm(item.id)}
                                                            title="Delete this user group"
                                                            onKeyDown={handleKeyDown}
                                                        >
                                                            <span className="delete-icon"></span>
                                                        </button>
                                                    )}
                                                    {!canEditGroup(item.level) && !canDeleteGroup(item.level) && (
                                                        <span className="no-permission">No actions</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Single Item Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteConfirm}
                title="Confirm Delete"
                message={`Are you sure you want to delete user group ID ${deleteItemId}? This action cannot be undone.`}
                onConfirm={handleDeleteUserGroup}
                onCancel={closeDeleteConfirm}
                isDelete={true}
            />

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

export default UserGroups;
