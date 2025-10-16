import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import './Users.css';
import '../../../App.css';

const Users = () => {
    const [users, setUsers] = useState([]);
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

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await apiCallWithRetry(`${SERVER_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.success) {
                setUsers(response.users || []);
                setError(null);
            } else {
                setError('Failed to load users');
                setUsers([]);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load users. Please try again.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
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

    const handleDeleteUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/users/${deleteItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'User has been deleted successfully.'
                });
                setShowMessage(true);
                loadUsers(); // Reload the data
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.message || 'Failed to delete user.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessageData({
                title: 'Error',
                message: 'An error occurred while deleting user.'
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

    const getStatusColor = (isActive) => {
        return isActive ? '#4caf50' : '#f44336';
    };

    // Filter items based on search
    const filteredItems = users.filter(item => {
        const searchLower = searchFilter.toLowerCase();
        return (
            (item.username && item.username.toLowerCase().includes(searchLower)) ||
            (item.full_name && item.full_name.toLowerCase().includes(searchLower)) ||
            (item.email && item.email.toLowerCase().includes(searchLower)) ||
            (item.group_name && item.group_name.toLowerCase().includes(searchLower)) ||
            (item.id && item.id.toString().includes(searchLower))
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
        loadUsers();
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

    const canEditUser = (userGroupLevel) => {
        if (!currentUser) return false;
        
        // Distributors can edit all users
        if (currentUser.group_level === 4) return true;
        
        // Administrators can edit Users and Operators
        if (currentUser.group_level === 3) {
            return userGroupLevel <= 2; // Users (2) and Operators (1)
        }
        
        // Users and Operators cannot edit any users
        return false;
    };

    const canDeleteUser = (userGroupLevel) => {
        if (!currentUser) return false;
        
        // Only Distributors can delete users
        if (currentUser.group_level === 4) {
            // Cannot delete Distributors
            return userGroupLevel < 4;
        }
        
        return false;
    };

    const handleEdit = (userId) => {
        navigate(`/setup/users/edit/${userId}`);
    };

    if (loading) {
        return (
            <div className="users-page-container">
                <div className="loading-message">Loading users...</div>
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
        <div className="users-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Users</h2>
                    <span className="subtitle">Manage users and their permissions.</span>
                </div>
                <div className="header-actions">
                    <button className="btn-create" onClick={() => navigate('/setup/users/create')}>
                        <span className="add-icon"></span>
                        Create User
                    </button>
                    <button className="btn-clear" onClick={() => setSearchFilter('')}>
                        <span className="clear-icon"></span>
                        Clear Filter
                    </button>
                </div>
            </div>

            <div className="users-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Search by ID, username, full name, email, or group..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredItems.length} item(s) found</span>
                    </div>
                    {searchFilter && (
                        <div className="search-hint">
                            <small>Searching in: ID, Username, Full Name, Email, Group</small>
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

                <div className="users-main-content">
                    <div className="users-list">
                        {currentItems.length === 0 ? (
                            <div className="users-no-users">
                                {filteredItems.length === 0
                                    ? (searchFilter ? 'No items found matching your search' : 'No users available')
                                    : 'No items on this page'}
                            </div>
                        ) : (
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th className="icon-column"></th>
                                        <th><strong>ID</strong></th>
                                        <th><strong>Username</strong></th>
                                        <th><strong>Full Name</strong></th>
                                        <th><strong>Email</strong></th>
                                        <th><strong>Group</strong></th>
                                        <th><strong>Status</strong></th>
                                        <th><strong>Last Login</strong></th>
                                        <th><strong>Function</strong></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((item) => (
                                        <tr key={item.id} className="users-table-row">
                                            <td className="users-icon-cell">
                                                <div className="users-icon-content">
                                                    <div className="users-icon"></div>
                                                </div>
                                            </td>

                                            <td className="users-id-cell">
                                                {item.id}
                                            </td>

                                            <td className="users-username-cell">
                                                <div className="username-content">
                                                    {item.username || 'No username'}
                                                </div>
                                            </td>

                                            <td className="users-fullname-cell">
                                                <div className="fullname-content">
                                                    {item.full_name || 'No name'}
                                                </div>
                                            </td>

                                            <td className="users-email-cell">
                                                <div className="email-content">
                                                    {item.email || 'No email'}
                                                </div>
                                            </td>

                                            <td className="users-group-cell">
                                                <div className="group-content">
                                                    <span 
                                                        className="group-badge"
                                                        style={{ backgroundColor: getStatusColor(item.group_level === 4 ? '#f44336' : '#2196f3') }}
                                                    >
                                                        {item.group_name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="users-status-cell">
                                                <div className="status-content">
                                                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="users-login-cell">
                                                {formatTimestamp(item.last_login)}
                                            </td>

                                            <td className="users-function-cell">
                                                <div className="table-actions">
                                                    {canEditUser(item.group_level) && (
                                                        <button
                                                            className="table-action-icon"
                                                            onClick={() => handleEdit(item.id)}
                                                            title="Edit this user"
                                                            onKeyDown={handleKeyDown}
                                                        >
                                                            <span className="edit-icon"></span>
                                                        </button>
                                                    )}
                                                    {canDeleteUser(item.group_level) && (
                                                        <button
                                                            className="table-action-icon"
                                                            onClick={() => openDeleteConfirm(item.id)}
                                                            title="Delete this user"
                                                            onKeyDown={handleKeyDown}
                                                        >
                                                            <span className="delete-icon"></span>
                                                        </button>
                                                    )}
                                                    {!canEditUser(item.group_level) && !canDeleteUser(item.group_level) && (
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
                message={`Are you sure you want to delete user ID ${deleteItemId}? This action cannot be undone.`}
                onConfirm={handleDeleteUser}
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

export default Users; 