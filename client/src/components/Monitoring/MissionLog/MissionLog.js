import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import './MissionLog.css';
import '../../../App.css';

const MissionLog = () => {
    const [queueItems, setQueueItems] = useState([]);
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

    const loadQueueItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const queueData = await apiCallWithRetry(`${SERVER_URL}/api/mission-logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setQueueItems(Array.isArray(queueData) ? queueData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading mission queue items:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load mission queue items. Please try again.');
            setQueueItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueueItems();
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

            const response = await fetch(`${SERVER_URL}/api/mission-logs/${deleteItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'Mission log item has been deleted successfully.'
                });
                setShowMessage(true);
                loadQueueItems(); // Reload the data
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.message || 'Failed to delete mission log item.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting mission log item:', error);
            setMessageData({
                title: 'Error',
                message: 'An error occurred while deleting mission log item.'
            });
            setShowMessage(true);
        } finally {
            closeDeleteConfirm();
        }
    };

    const handleDeleteAllQueueItems = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/mission-logs`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to delete all queue items');
            }

            setQueueItems([]);
            setMessageData({
                title: 'Success',
                message: 'All mission queue items have been deleted successfully.'
            });
            setShowMessage(true);
            closeDeleteAllConfirm();
        } catch (error) {
            console.error('Error deleting all queue items:', error);
            setMessageData({
                title: 'Error',
                message: 'Failed to delete all queue items. Please try again.'
            });
            setShowMessage(true);
        }
    };

    // Function to highlight search text
    const highlightText = (text, searchTerm) => {
        if (!searchTerm.trim()) return text;

        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
        );
    };

    // Function to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 0:
                return '#17a2b8'; // Blue
            case 1:
                return '#ffc107'; // Yellow
            case 2:
                return '#fd7e14'; // Orange
            case 3:
                return '#28a745'; // Green
            case 4:
                return '#dc3545'; // Red
            case 5:
                return '#6c757d'; // Gray
            default:
                return '#6c757d'; // Gray for unknown status
        }
    };
        // Function to get status text
        const getStatusText = (status) => {
            switch (status) {
                case 0:
                    return 'Pending'; // Blue
                case 1:
                    return 'Running'; // Yellow
                case 2:
                    return 'Paused'; // Orange
                case 3:
                    return 'Completed'; // Green
                case 4:
                    return 'Failed'; // Red
                case 5:
                    return 'Cancelled'; // Gray
                default:
                    return 'Unknown'; // Gray for unknown status
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

    // Function to calculate run time
    const calculateRunTime = (startedAt, completedAt) => {
        try {
            // If no start time, return N/A
            if (!startedAt || !completedAt) return 'N/A';
            
            // If no completion time, calculate from start to now
            const endTime = completedAt ? new Date(completedAt) : new Date();
            const startTime = new Date(startedAt);
            
            // Validate dates
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                return 'Invalid Date';
            }
            
            // Calculate difference in milliseconds
            const diffMs = endTime.getTime() - startTime.getTime();
            
            // If negative (future start time), return N/A
            if (diffMs < 0) return 'N/A';
            
            // Convert to hours, minutes, seconds
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            // Format as hh:mm:ss
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error calculating run time:', error);
            return 'Error';
        }
    };

    // Pagination logic
    const filteredQueueItems = queueItems.filter(item => {
        if (!searchFilter.trim()) return true;

        const searchLower = searchFilter.toLowerCase();

        // Search by ID
        if (item.ID.toString().includes(searchFilter)) return true;

        // Search by mission name
        if (item.missionName && item.missionName.toLowerCase().includes(searchLower)) return true;

        // Search by status
        if (item.Status !== null && item.Status !== undefined) {
            const statusStr = typeof item.Status === 'string' ? item.Status : getStatusText(item.Status);
            if (statusStr && statusStr.toLowerCase().includes(searchLower)) return true;
        }

        // Search by function
        if (item.function && item.function.toLowerCase().includes(searchLower)) return true;

        return false;
    });

    const totalPages = Math.ceil(filteredQueueItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentQueueItems = filteredQueueItems.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearchFilterChange = (e) => {
        setSearchFilter(e.target.value);
        setCurrentPage(1); // Reset về trang 1 khi search
    };

    const handleViewItem = (item) => {
        // Encode timestamps for URL parameters
        const encodedStartedAt = encodeURIComponent(item.StartedAt || '');
        const encodedCompletedAt = encodeURIComponent(item.CompletedAt || '');
        
        // Navigate to ActionLog with mission details
        navigate(`/monitoring/action-log/${item.MissionID}/${encodedStartedAt}/${encodedCompletedAt}`);
    };



    const handleClearFilter = () => {
        setSearchFilter('');
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
            <div className="mission-log-page-container">
                <div className="loading-message">Loading mission queue items...</div>
            </div>
        );
    }

    return (
        <div className="mission-log-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Mission Log</h2>
                    <span className="subtitle">View the mission log.</span>
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

                </div>
            </div>

            <div className="mission-log-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Search by ID, mission name, status, or function..."
                            value={searchFilter}
                            onChange={handleSearchFilterChange}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredQueueItems.length} item(s) found</span>
                    </div>
                    {searchFilter && (
                        <div className="search-hint">
                            <small>Searching in: ID, Mission Name, Status, Function</small>
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

                <div className="mission-log-main-content">
                    <div className="mission-log-list">
                        {currentQueueItems.length === 0 ? (
                            <div className="mission-log-no-logs">
                                {filteredQueueItems.length === 0
                                    ? (searchFilter ? 'No items found matching your search' : 'No mission queue items available')
                                    : 'No items on this page'}
                            </div>
                        ) : (
                            <table className="mission-log-table">
                                <thead>
                                    <tr>
                                        <th className="icon-column"></th>
                                        <th><strong>Mission</strong></th>
                                        <th><strong>Status</strong></th>
                                        <th><strong>Queued At</strong></th>
                                        <th><strong>Started At</strong></th>
                                        <th><strong>Ran For</strong></th>
                                        <th><strong>Function</strong></th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {currentQueueItems.map((item) => (
                                        <tr key={item.ID} className="mission-log-table-row">
                                            <td className="mission-log-icon-cell">
                                                <div className="mission-log-icon-content">
                                                    <div className="mission-log-icon"></div>
                                                </div>
                                            </td>

                                            <td className="mission-log-mission-cell">
                                                {highlightText(item.missionName || `Mission #${item.MissionID}`, searchFilter)}
                                            </td>

                                            <td className="mission-log-status-cell">
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor: getStatusColor(item.Status),
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {highlightText(getStatusText(item.Status) || 'Unknown', searchFilter)}
                                                </span>
                                            </td>
                                            <td className="mission-log-queued-cell">
                                                {formatTimestamp(item.QueuedAt)}
                                            </td>
                                            <td className="mission-log-started-cell">
                                                {formatTimestamp(item.StartedAt)}
                                            </td>
                                            <td className="mission-log-completed-cell">
                                                { calculateRunTime(item.StartedAt, item.CompletedAt)}
                                            </td>
                                            <td className="mission-log-function-cell">
                                                <div className="table-actions">
                                                    <button
                                                        className={`table-action-icon view ${calculateRunTime(item.StartedAt, item.CompletedAt) === 'N/A' ? 'disabled' : ''}`}
                                                        title={calculateRunTime(item.StartedAt, item.CompletedAt) === 'N/A' ? 'No details available' : 'View Details'}
                                                        onClick={() => calculateRunTime(item.StartedAt, item.CompletedAt) !== 'N/A' && handleViewItem(item)}
                                                        disabled={calculateRunTime(item.StartedAt, item.CompletedAt) === 'N/A'}
                                                    >
                                                    </button>
                                                    <button
                                                        className="table-action-icon"
                                                        onClick={() => openDeleteConfirm(item.ID)}
                                                        title="Delete this mission log item"
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
                message={`Are you sure you want to delete mission log item ID ${deleteItemId}? This action cannot be undone.`}
                onConfirm={handleDeleteItem}
                onCancel={closeDeleteConfirm}
                isDelete={true}
            />

            {/* Delete All Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteAllConfirm}
                title="Confirm Delete All"
                message="Are you sure you want to delete ALL mission queue items? This action cannot be undone."
                onConfirm={handleDeleteAllQueueItems}
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

export default MissionLog;
