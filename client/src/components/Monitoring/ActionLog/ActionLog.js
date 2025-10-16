import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import './ActionLog.css';
import '../../../App.css';

const ActionLog = () => {
    const { missionId, startedAt, completedAt } = useParams();
    const [actionLogs, setActionLogs] = useState([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
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

    const loadActionLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Decode URL parameters
            const decodedStartedAt = decodeURIComponent(startedAt);
            const decodedCompletedAt = decodeURIComponent(completedAt);

            const actionLogsData = await apiCallWithRetry(`${SERVER_URL}/api/action-logs/${missionId}?startedAt=${decodedStartedAt}&completedAt=${decodedCompletedAt}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setActionLogs(Array.isArray(actionLogsData) ? actionLogsData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading action logs:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load action logs. Please try again.');
            setActionLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActionLogs();
    }, [missionId, startedAt, completedAt]);

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

    const openDeleteAllConfirm = () => {
        setShowDeleteAllConfirm(true);
    };

    const closeDeleteAllConfirm = () => {
        setShowDeleteAllConfirm(false);
    };

    const openDeleteConfirm = (itemId) => {
        setDeleteItemId(itemId);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setDeleteItemId(null);
    };

    const handleDeleteItem = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/action-logs/${deleteItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'Action log item has been deleted successfully.'
                });
                setShowMessage(true);
                loadActionLogs(); // Reload the data
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.message || 'Failed to delete action log item.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting action log item:', error);
            setMessageData({
                title: 'Error',
                message: 'An error occurred while deleting action log item.'
            });
            setShowMessage(true);
        } finally {
            closeDeleteConfirm();
        }
    };

    const handleDeleteAllActionLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const decodedStartedAt = decodeURIComponent(startedAt);
            const decodedCompletedAt = decodeURIComponent(completedAt);

            const response = await fetch(`${SERVER_URL}/api/action-logs/${missionId}/delete-all?startedAt=${decodedStartedAt}&completedAt=${decodedCompletedAt}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'All action logs have been deleted successfully.'
                });
                setShowMessage(true);
                loadActionLogs(); // Reload the data
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.message || 'Failed to delete all action logs.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting all action logs:', error);
            setMessageData({
                title: 'Error',
                message: 'An error occurred while deleting all action logs.'
            });
            setShowMessage(true);
        } finally {
            closeDeleteAllConfirm();
        }
    };

    const handleSearchFilterChange = (e) => {
        setSearchFilter(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleClearFilter = () => {
        setSearchFilter('');
        setCurrentPage(1);
    };

    const handleGoBack = () => {
        navigate('/monitoring/mission-log');
    };

    const handleRefresh = () => {
        loadActionLogs();
    };

    // Function to highlight search text
    const highlightText = (text, searchTerm) => {
        if (!searchTerm || !text) return text;

        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
        );
    };

    // Function to get level color
    const getLevelColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'info':
                return '#17a2b8'; // Blue
            case 'warning':
                return '#ffc107'; // Yellow
            case 'error':
                return '#dc3545'; // Red
            case 'debug':
                return '#6c757d'; // Gray
            default:
                return '#6c757d'; // Gray for unknown level
        }
    };

    // Function to format timestamp
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

    // Pagination logic
    const filteredActionLogs = actionLogs.filter(item => {
        if (!searchFilter.trim()) return true;

        const searchLower = searchFilter.toLowerCase();
        return (
            (item.ID && item.ID.toString().includes(searchLower)) ||
            (item.timestamp && formatTimestamp(item.timestamp).toLowerCase().includes(searchLower)) ||
            (item.level && item.level.toLowerCase().includes(searchLower)) ||
            (item.message && item.message.toLowerCase().includes(searchLower))
        );
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredActionLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentActionLogs = filteredActionLogs.slice(startIndex, endIndex);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event) => {
        const newItemsPerPage = parseInt(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
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
            <div className="action-log-page-container">
                <div className="loading-message">Loading action logs...</div>
            </div>
        );
    }

    return (
        <div className="action-log-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Action Log</h2>
                    <span className="subtitle">Mission #{missionId} - {formatTimestamp(startedAt)} to {formatTimestamp(completedAt)}</span>
                </div>
                <div className="header-actions">
                    <button className="btn-delete" onClick={openDeleteAllConfirm}>
                        <span className="delete-icon-white"></span>
                        Delete All
                    </button>
                    <button className="btn-clear" onClick={handleClearFilter}>
                        <span className="clear-icon"></span>
                        Clear Filter
                    </button>
                    <button className="btn-go-back" onClick={handleGoBack}>
                        <span className="go-back-icon"></span>
                        Go back
                    </button>
                </div>
            </div>

            <div className="action-log-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Search by ID, timestamp, level, or message..."
                            value={searchFilter}
                            onChange={handleSearchFilterChange}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredActionLogs.length} item(s) found</span>
                    </div>
                    {searchFilter && (
                        <div className="search-hint">
                            <small>Searching in: ID, Timestamp, Level, Message</small>
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

                <div className="action-log-main-content">
                    <div className="action-log-list">
                        {currentActionLogs.length === 0 ? (
                            <div className="action-log-no-logs">
                                {filteredActionLogs.length === 0
                                    ? (searchFilter ? 'No items found matching your search' : 'No action logs available')
                                    : 'No items on this page'}
                            </div>
                        ) : (
                            <table className="action-log-table">
                                <thead>
                                    <tr>
                                        <th className="icon-column"></th>
                                        <th><strong>ID</strong></th>
                                        <th><strong>Timestamp</strong></th>
                                        <th><strong>Level</strong></th>
                                        <th><strong>Message</strong></th>
                                        <th><strong>Function</strong></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentActionLogs.map((item) => (
                                        <tr key={item.ID} className="action-log-table-row">
                                            <td className="action-log-icon-cell">
                                                <div className="action-log-icon-content">
                                                    <div className="action-log-icon"></div>
                                                </div>
                                            </td>

                                            <td className="action-log-id-cell">
                                                {highlightText(item.ID?.toString() || 'N/A', searchFilter)}
                                            </td>

                                            <td className="action-log-timestamp-cell">
                                                {formatTimestamp(item.timestamp)}
                                            </td>

                                            <td className="action-log-level-cell">
                                                <span
                                                    className="level-badge"
                                                    style={{
                                                        backgroundColor: getLevelColor(item.level),
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {highlightText(item.level || 'Unknown', searchFilter)}
                                                </span>
                                            </td>

                                            <td className="action-log-message-cell">
                                                <div className="message-content">
                                                    {highlightText(item.message || 'No message', searchFilter)}
                                                </div>
                                            </td>

                                            <td className="action-log-function-cell">
                                                <div className="table-actions">
                                                    <button
                                                        className="table-action-icon"
                                                        onClick={() => openDeleteConfirm(item.ID)}
                                                        title="Delete this action log item"
                                                        onKeyDown={handleKeyDown}
                                                    >
                                                        <span className="delete-icon"></span>
                                                    </button>
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
                message={`Are you sure you want to delete action log item ID ${deleteItemId}? This action cannot be undone.`}
                onConfirm={handleDeleteItem}
                onCancel={closeDeleteConfirm}
                isDelete={true}
            />

            {/* Delete All Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteAllConfirm}
                title="Confirm Delete All"
                message="Are you sure you want to delete ALL action logs for this mission? This action cannot be undone."
                onConfirm={handleDeleteAllActionLogs}
                onCancel={closeDeleteAllConfirm}
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

export default ActionLog;
