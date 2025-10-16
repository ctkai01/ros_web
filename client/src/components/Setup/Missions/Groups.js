import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import './Groups.css';
import '../../../App.css';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [groupToDelete, setGroupToDelete] = useState(null);
    const navigate = useNavigate();

    // Calculate items per page based on viewport height
    const calculateItemsPerPage = () => {
        const viewportHeight = window.innerHeight;
        const isTablet = window.innerWidth <= 1024;
        const isMobile = window.innerWidth <= 767;
        
        // Adjust heights based on device type
        const headerHeight = 66; // Page header height
        const filterHeight = 73; // Filter section height
        const paginationHeight = 60; // Pagination height
        const tableHeaderHeight = 32; // Table header height
        const rowHeight = 40; // Actual row height (matches CSS)
        
        // Different padding for different devices
        let padding = 20; // Default padding
        if (isMobile) {
            padding = 30; // More padding for mobile
        } else if (isTablet) {
            padding = 20; // Same as desktop since nav is hidden
        }
        
        const availableHeight = viewportHeight - headerHeight - filterHeight - paginationHeight - tableHeaderHeight - padding;
        const calculatedItems = Math.floor(availableHeight / rowHeight);
        
        // Debug log for different devices
        console.log('Groups Pagination Debug:', {
            viewportWidth: window.innerWidth,
            viewportHeight,
            isTablet,
            isMobile,
            headerHeight,
            filterHeight,
            paginationHeight,
            tableHeaderHeight,
            padding,
            availableHeight,
            rowHeight,
            calculatedItems
        });
        
        // Ensure minimum and maximum values, subtract 1 for iPad/tablet
        const finalItems = Math.max(5, Math.min(calculatedItems - 1, 50));
        console.log('Final items per page:', finalItems);
        
        return finalItems;
    };

    const loadGroups = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const groupsData = await apiCallWithRetry(`${SERVER_URL}/api/groups`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setGroups(Array.isArray(groupsData) ? groupsData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading groups:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load groups. Please try again.');
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
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

    const handleCreateGroup = () => {
        navigate('/setup/missions/groups/create');
    };

    const openDeleteConfirm = (group) => {
        setGroupToDelete(group);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setGroupToDelete(null);
    };

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/groups/${groupToDelete.ID}`, {
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
                throw new Error('Failed to delete group');
            }

            setGroups(groups.filter(group => group.ID !== groupToDelete.ID));
            setMessageData({
                title: 'Success',
                message: `Group #${groupToDelete.ID} has been deleted successfully.`
            });
            setShowMessage(true);
            closeDeleteConfirm();
        } catch (error) {
            console.error('Error deleting group:', error);
            setMessageData({
                title: 'Error',
                message: 'Failed to delete group. Please try again.'
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

    // Pagination logic
    const filteredGroups = groups.filter(group => {
        if (!searchFilter.trim()) return true;
        
        const searchLower = searchFilter.toLowerCase();
        
        // Search by ID
        if (group.ID.toString().includes(searchFilter)) return true;
        
        // Search by group name
        if (group.groupName && group.groupName.toLowerCase().includes(searchLower)) return true;
        
        return false;
    });

    const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentGroups = filteredGroups.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearchFilterChange = (e) => {
        setSearchFilter(e.target.value);
        setCurrentPage(1); // Reset về trang 1 khi search
    };

    // Check if group should be disabled (ID <= 12)
    const isGroupDisabled = (groupId) => {
        return groupId <= 12;
    };

    const handleGoBack = () => {
        navigate('/setup/missions');
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
            <div className="groups-page-container">
                <div className="loading-message">Loading groups...</div>
            </div>
        );
    }

    return (
        <div className="groups-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Groups</h2>
                    <span className="subtitle">Create and manage groups</span>
                </div>
                <div className="header-actions">
                    <button className="btn-create" onClick={handleCreateGroup}>
                        <span className="plus-icon"></span>
                        Create group
                    </button>
                    <button className="btn-go-back" onClick={handleGoBack}>
                        <span className="go-back-icon"></span>
                        Go back
                    </button>
                </div>
            </div>

            <div className="groups-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Search by ID or group name..."
                            value={searchFilter}
                            onChange={handleSearchFilterChange}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredGroups.length} group(s) found</span>
                    </div>
                    {searchFilter && (
                        <div className="search-hint">
                            <small>Searching in: Group names</small>
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

                <div className="groups-main-content">
                    <div className="groups-list">
                        {currentGroups.length === 0 ? (
                            <div className="groups-no-groups">
                                {filteredGroups.length === 0
                                    ? (searchFilter ? 'No groups found matching your search' : 'No groups available')
                                    : 'No groups on this page'}
                            </div>
                        ) : (
                            <table className="groups-table">
                                <thead>
                                    <tr>
                                        <th className="icon-column"><strong></strong></th>
                                        <th><strong>Group Name</strong></th>
                                        <th><strong>Actions</strong></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentGroups.map((group) => (
                                        <tr key={group.ID} className="groups-table-row">
                                            <td className="icon-column">
                                                <div className="groups-icon-content">
                                                    <img src="/assets/icons/group.png" style={{ width: '20px', height: '20px' }} alt="Group" />
                                                </div>
                                            </td>
                                            <td className="groups-name-cell">
                                                {highlightText(group.groupName || 'Unnamed Group', searchFilter)}
                                            </td>
                                            <td className="groups-actions-cell">
                                                <div className="table-actions">
                                                    <button
                                                        onClick={() => navigate(`/setup/missions/groups/edit/${group.ID}`)}
                                                        className="table-action-icon edit"
                                                        title="Edit group"
                                                        disabled={isGroupDisabled(group.ID)}
                                                    />
                                                    <button
                                                        onClick={() => openDeleteConfirm(group)}
                                                        className="table-action-icon delete"
                                                        title="Delete group"
                                                        disabled={isGroupDisabled(group.ID)}
                                                    />
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteConfirm}
                title="Confirm Delete"
                message={`Are you sure you want to delete group #${groupToDelete?.ID}? This action cannot be undone.`}
                onConfirm={handleDeleteGroup}
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

export default Groups;
