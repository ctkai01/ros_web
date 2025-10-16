import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import './Transitions.css';
import '../../../App.css';

const Transitions = () => {
    const [transitions, setTransitions] = useState([]);
    const [mappingData, setMappingData] = useState({ sites: {} });
    const [searchFilter, setSearchFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [transitionToDelete, setTransitionToDelete] = useState(null);
    const navigate = useNavigate();

    const loadMappingData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const mappingData = await apiCallWithRetry(`${SERVER_URL}/api/transitions/mapping`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setMappingData(mappingData);
        } catch (error) {
            console.error('Error loading mapping data:', error);
        }
    };

    const loadTransitions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const transitionsData = await apiCallWithRetry(`${SERVER_URL}/api/transitions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setTransitions(Array.isArray(transitionsData) ? transitionsData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading transitions:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load transitions. Please try again.');
            setTransitions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMappingData();
        loadTransitions();
    }, []);

    const handleCreateTransition = () => {
        navigate('/setup/transitions/create');
    };

    const openDeleteConfirm = (transition) => {
        setTransitionToDelete(transition);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setTransitionToDelete(null);
    };

    const handleDeleteTransition = async () => {
        if (!transitionToDelete) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/transitions/${transitionToDelete.ID}`, {
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
                throw new Error('Failed to delete transition');
            }

            setTransitions(transitions.filter(transition => transition.ID !== transitionToDelete.ID));
            setMessageData({
                title: 'Success',
                message: `Transition #${transitionToDelete.ID} has been deleted successfully.`
            });
            setShowMessage(true);
            closeDeleteConfirm();
        } catch (error) {
            console.error('Error deleting transition:', error);
            setMessageData({
                title: 'Error',
                message: 'Failed to delete transition. Please try again.'
            });
            setShowMessage(true);
        }
    };

    // Helper functions for mapping data
    const getPointName = (pointId) => {
        for (const siteId in mappingData.sites) {
            const site = mappingData.sites[siteId];
            for (const mapId in site.maps) {
                const map = site.maps[mapId];
                if (map.points[pointId]) {
                    return `${map.points[pointId].name}${map.name}`;
                }
            }
        }
        return `Position ${pointId}`;
    };

    const getPointNameOnly = (pointId) => {
        for (const siteId in mappingData.sites) {
            const site = mappingData.sites[siteId];
            for (const mapId in site.maps) {
                const map = site.maps[mapId];
                if (map.points[pointId]) {
                    return map.points[pointId].name;
                }
            }
        }
        return `Position ${pointId}`;
    };

    const getMapName = (pointId) => {
        for (const siteId in mappingData.sites) {
            const site = mappingData.sites[siteId];
            for (const mapId in site.maps) {
                const map = site.maps[mapId];
                if (map.points[pointId]) {
                    return map.name;
                }
            }
        }
        return '';
    };

    const getMissionName = (missionId) => {
        // Search for mission in all sites
        for (const siteId in mappingData.sites) {
            const site = mappingData.sites[siteId];
            if (site.missions && site.missions[missionId]) {
                return site.missions[missionId].name;
            }
        }
        return `Mission ${missionId}`;
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
    const filteredTransitions = transitions.filter(transition => {
        if (!searchFilter.trim()) return true;
        
        const searchLower = searchFilter.toLowerCase();
        
        // Search by ID
        if (transition.ID.toString().includes(searchFilter)) return true;
        
        // Search by Start Position name (position name only)
        const startPositionName = getPointNameOnly(transition.StartPositionID).toLowerCase();
        if (startPositionName.includes(searchLower)) return true;
        
        // Search by Goal Position name (position name only)
        const goalPositionName = getPointNameOnly(transition.GoalPositionID).toLowerCase();
        if (goalPositionName.includes(searchLower)) return true;
        
        // Search by Start Position map name
        const startMapName = getMapName(transition.StartPositionID).toLowerCase();
        if (startMapName.includes(searchLower)) return true;
        
        // Search by Goal Position map name
        const goalMapName = getMapName(transition.GoalPositionID).toLowerCase();
        if (goalMapName.includes(searchLower)) return true;
        
        // Search by Mission name
        const missionName = getMissionName(transition.MissionID).toLowerCase();
        if (missionName.includes(searchLower)) return true;
        
        // Search by Created By
        if (transition.CreatedBy && transition.CreatedBy.toLowerCase().includes(searchLower)) return true;
        
        return false;
    });

    const totalPages = Math.ceil(filteredTransitions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransitions = filteredTransitions.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearchFilterChange = (e) => {
        setSearchFilter(e.target.value);
        setCurrentPage(1); // Reset về trang 1 khi search
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
            <div className="transitions-page-container">
                <div className="loading-message">Loading transitions...</div>
            </div>
        );
    }

    return (
        <div className="transitions-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Transitions</h2>
                    <span className="subtitle">Create and manage transitions</span>
                </div>
                <div className="header-actions">
                    <button className="btn-create" onClick={handleCreateTransition}>
                        <span className="plus-icon"></span>
                        Create transition
                    </button>
                </div>
            </div>

            <div className="transitions-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Search by ..."
                            value={searchFilter}
                            onChange={handleSearchFilterChange}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredTransitions.length} transition(s) found</span>
                    </div>
                    {searchFilter && (
                        <div className="search-hint">
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

                <div className="transitions-main-content">
                    <div className="transitions-list">
                        {currentTransitions.length === 0 ? (
                            <div className="transitions-no-transitions">
                                {filteredTransitions.length === 0
                                    ? (searchFilter ? 'No transitions found matching your search' : 'No transitions available')
                                    : 'No transitions on this page'}
                            </div>
                        ) : (
                            <table className="transitions-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Start</th>
                                        <th>Goal</th>
                                        <th>Mission</th>
                                        <th>Created By</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTransitions.map((transition) => (
                                        <tr key={transition.ID} className="transitions-table-row">
                                            <td className="transitions-icon-cell">
                                                <div className="transitions-icon-content">
                                                    <img src="/assets/icons/transition.png" style={{ width: '20px', height: '20px' }} alt="Transition" />
                                                </div>
                                            </td>
                                                                                         <td className="transitions-start-cell">
                                                 <div className="transitions-name-content">
                                                     <div className="position-name">{highlightText(getPointNameOnly(transition.StartPositionID), searchFilter)}</div>
                                                     <div className="map-name">{highlightText(getMapName(transition.StartPositionID), searchFilter)}</div>
                                                 </div>
                                             </td>
                                            
                                             <td className="transitions-goal-cell">
                                                 <div className="transitions-name-content">
                                                     <div className="position-name">{highlightText(getPointNameOnly(transition.GoalPositionID), searchFilter)}</div>
                                                     <div className="map-name">{highlightText(getMapName(transition.GoalPositionID), searchFilter)}</div>
                                                 </div>
                                             </td>
                                             <td className="transitions-mission-cell">
                                                 {highlightText(getMissionName(transition.MissionID), searchFilter)}
                                             </td>
                                            <td className="transitions-created-cell">
                                            {transition.CreatedBy || 'System'}
                                            </td>
                                            <td className="transitions-actions-cell">
                                                <div className="table-actions">
                                                    <button
                                                        onClick={() => navigate(`/setup/transitions/edit/${transition.ID}`)}
                                                        className="table-action-icon edit"
                                                        title="Edit transition"
                                                    />
                                                    <button
                                                        onClick={() => openDeleteConfirm(transition)}
                                                        className="table-action-icon delete"
                                                        title="Delete transition"
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
                message={`Are you sure you want to delete transition #${transitionToDelete?.ID}? This action cannot be undone.`}
                onConfirm={handleDeleteTransition}
                onCancel={closeDeleteConfirm}
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

export default Transitions;
