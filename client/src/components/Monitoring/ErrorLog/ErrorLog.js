import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import './ErrorLog.css';
import '../../../App.css';

const ErrorLog = () => {
    const [errorItems, setErrorItems] = useState([]);
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

    const loadErrorItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const errorData = await apiCallWithRetry(`${SERVER_URL}/api/error-logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setErrorItems(Array.isArray(errorData) ? errorData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading error log items:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load error log items. Please try again.');
            setErrorItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadErrorItems();
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

    const handleDeleteErrorItem = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/error-logs/${deleteItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'Error log item has been deleted successfully.'
                });
                setShowMessage(true);
                loadErrorItems(); // Reload the data
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.error || 'Failed to delete error log item.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting error log item:', error);
            setMessageData({
                title: 'Error',
                message: 'An error occurred while deleting error log item.'
            });
            setShowMessage(true);
        } finally {
            closeDeleteConfirm();
        }
    };

    const handleDeleteAllErrorItems = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/error-logs/delete-all`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessageData({
                    title: 'Success',
                    message: 'All error log items have been deleted successfully.'
                });
                setShowMessage(true);
                loadErrorItems(); // Reload the data
            } else {
                const errorData = await response.json();
                setMessageData({
                    title: 'Error',
                    message: errorData.error || 'Failed to delete all error log items.'
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting all error log items:', error);
            setMessageData({
                title: 'Error',
                message: 'An error occurred while deleting all error log items.'
            });
            setShowMessage(true);
        } finally {
            closeDeleteAllConfirm();
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

    const getLevelColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'error':
                return 'error-level';
            case 'info':
                return 'info-level';
            default:
                return 'default-level';
        }
    };

    // Filter items based on search
    const filteredItems = errorItems.filter(item => {
        const searchLower = searchFilter.toLowerCase();
        return (
            (item.message && item.message.toLowerCase().includes(searchLower)) ||
            (item.level && item.level.toLowerCase().includes(searchLower)) ||
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
        loadErrorItems();
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
            <div className="error-log-page-container">
                <div className="loading-message">Loading error log items...</div>
            </div>
        );
    }

    return (
        <div className="error-log-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Error Log</h2>
                    <span className="subtitle">View the error log.</span>
                </div>
                <div className="header-actions">
                    <button className="btn-delete" onClick={openDeleteAllConfirm}>
                        <span className="delete-icon-white"></span>
                        Delete All
                    </button>
                    <button className="btn-clear" onClick={() => setSearchFilter('')}>
                        <span className="clear-icon"></span>
                        Clear Filter
                    </button>

                </div>
            </div>

            <div className="error-log-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Search by ID, level, or message..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredItems.length} item(s) found</span>
                    </div>
                    {searchFilter && (
                        <div className="search-hint">
                            <small>Searching in: ID, Level, Message</small>
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

                <div className="error-log-main-content">
                    <div className="error-log-list">
                        {currentItems.length === 0 ? (
                            <div className="error-log-no-logs">
                                {filteredItems.length === 0
                                    ? (searchFilter ? 'No items found matching your search' : 'No error log items available')
                                    : 'No items on this page'}
                            </div>
                        ) : (
                            <table className="error-log-table">
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
                                    {currentItems.map((item) => (
                                        <tr key={item.id} className="error-log-table-row">
                                            <td className="error-log-icon-cell">
                                                <div className="error-log-icon-content">
                                                    <div className="error-log-icon"></div>
                                                </div>
                                            </td>

                                            <td className="error-log-id-cell">
                                                {item.id}
                                            </td>

                                            <td className="error-log-timestamp-cell">
                                                {formatTimestamp(item.timestamp)}
                                            </td>

                                            <td className="error-log-level-cell">
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor: getLevelColor(item.level) === 'error-level' ? '#dc3545' : 
                                                                       getLevelColor(item.level) === 'info-level' ? '#17a2b8' : '#6c757d',
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {item.level || 'Unknown'}
                                                </span>
                                            </td>

                                            <td className="error-log-message-cell" >
                                                <div className="message-content">
                                                    {item.message || 'No message'}
                                                </div>
                                            </td>

                                            <td className="error-log-function-cell" >
                                                <div className="table-actions" >
                                                    <button
                                                        className="table-action-icon"
                                                        onClick={() => openDeleteConfirm(item.id)}
                                                        title="Delete this error log"
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

            {/* Delete All Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteAllConfirm}
                title="Confirm Delete All"
                message="Are you sure you want to delete ALL error log items? This action cannot be undone."
                onConfirm={handleDeleteAllErrorItems}
                onCancel={closeDeleteAllConfirm}
                isDelete={true}
            />

            {/* Delete Single Item Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteConfirm}
                title="Confirm Delete"
                message={`Are you sure you want to delete error log item ID ${deleteItemId}? This action cannot be undone.`}
                onConfirm={handleDeleteErrorItem}
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

export default ErrorLog;
