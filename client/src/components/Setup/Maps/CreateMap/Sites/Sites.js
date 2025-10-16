import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { SERVER_URL, apiCallWithRetry } from '../../../../../config/serverConfig';
import ConfirmDialog from '../../../../../components/common/ConfirmDialog';
import MessageDialog from '../../../../../components/common/MessageDialog';
import { sendChangeSiteCommand } from '../../../../../utils/siteUtils';
import './Sites.css';
import '../../../../../App.css';

const Sites = () => {
    const [sites, setSites] = useState([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSetDefaultConfirm, setShowSetDefaultConfirm] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({ title: '', message: '' });
    const [siteToDelete, setSiteToDelete] = useState(null);
    const [siteToSetDefault, setSiteToSetDefault] = useState(null);
    const navigate = useNavigate();

    const loadSites = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const sitesData = await apiCallWithRetry(`${SERVER_URL}/api/sites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setSites(Array.isArray(sitesData) ? sitesData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading sites:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                navigate('/login');
                return;
            }
            setError('Failed to load sites. Please try again.');
            setSites([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSites();
    }, []);

    const handleCreateSite = () => {
        navigate('/setup/sites/create');
    };



    const openDeleteConfirm = (site) => {
        setSiteToDelete(site);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setSiteToDelete(null);
    };

    const handleDeleteSite = async () => {
        if (!siteToDelete) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/sites/${siteToDelete.ID}`, {
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
                throw new Error('Failed to delete site');
            }

            // Nếu site bị xóa là default site, gửi lệnh CHANGE_SITE với site ID = 0 để thông báo
            if (siteToDelete.isDefault) {
                const changeSiteSuccess = await sendChangeSiteCommand(0, 'No Default Site');
                if (!changeSiteSuccess) {
                    console.warn('Failed to send CHANGE_SITE command for deleted default site');
                }
            }

            setSites(sites.filter(site => site.ID !== siteToDelete.ID));
            setMessageData({
                title: 'Success',
                message: `Site "${siteToDelete.siteName}" has been deleted successfully.${siteToDelete.isDefault ? ' Warning: Default site was deleted.' : ''}`
            });
            setShowMessage(true);
            closeDeleteConfirm();
        } catch (error) {
            console.error('Error deleting site:', error);
            setMessageData({
                title: 'Error',
                message: 'Failed to delete site. Please try again.'
            });
            setShowMessage(true);
        }
    };

    const openSetDefaultConfirm = (site) => {
        setSiteToSetDefault(site);
        setShowSetDefaultConfirm(true);
    };

    const closeSetDefaultConfirm = () => {
        setShowSetDefaultConfirm(false);
        setSiteToSetDefault(null);
    };

    const handleSetDefaultSite = async () => {
        if (!siteToSetDefault) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${SERVER_URL}/api/sites/${siteToSetDefault.ID}/default`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to set default site');
            }

            const result = await response.json();
            if (result.success) {
                // Gửi lệnh CHANGE_SITE đến robot
                const changeSiteSuccess = await sendChangeSiteCommand(result.defaultSiteId, result.siteName);
                
                await loadSites(); // Reload sites to get updated default site status
                setMessageData({
                    title: 'Success',
                    message: `Site "${result.siteName}" has been set as default successfully.${changeSiteSuccess ? '' : ' Warning: Failed to notify robot about site change.'}`
                });
                setShowMessage(true);
                closeSetDefaultConfirm();
            } else {
                throw new Error(result.message || 'Failed to set default site');
            }
        } catch (error) {
            console.error('Error setting default site:', error);
            setMessageData({
                title: 'Error',
                message: error.message || 'Failed to set default site. Please try again.'
            });
            setShowMessage(true);
        }
    };

    // Pagination logic
    const filteredSites = sites.filter(site =>
        site.siteName.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSites = filteredSites.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearchFilterChange = (e) => {
        setSearchFilter(e.target.value);
        setCurrentPage(1); // Reset về trang 1 khi search
    };

    const handleBack = () => {
        navigate('/setup/maps/create');
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
            <div className="sites-page-container">
                <div className="loading-message">Loading sites...</div>
            </div>
        );
    }

    return (
        <div className="sites-page-container">
            <div className="page-header">
                <div className="header-title">
                    <h2>Sites</h2>
                    <span className="subtitle">Create and manage sites</span>
                </div>
                <div className="header-actions">
                    <button className="btn-create" onClick={handleCreateSite}>
                        <span className="plus-icon"></span>
                        Create site
                    </button>
                    <button className="btn-go-back" onClick={handleBack}>
                        <span className="go-back-icon"></span>
                        Go Back
                    </button>
                </div>
            </div>

            <div className="sites-content">
                <div className="filter-section">
                    <div className="filter-input">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Write name to filter by..."
                            value={searchFilter}
                            onChange={handleSearchFilterChange}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="items-found">{filteredSites.length} site(s) found</span>
                    </div>

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

                <div className="sites-main-content">
                    <div className="sites-list">
                        {currentSites.length === 0 ? (
                            <div className="sites-no-sites">
                                {filteredSites.length === 0
                                    ? (searchFilter ? 'No sites found matching your search' : 'No sites available')
                                    : 'No sites on this page'}
                            </div>
                        ) : (
                            <table className="sites-table">
                                <thead>
                                    <tr>
                                        <th>Site Name</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSites.map((site) => (
                                        <tr key={site.ID} className="sites-table-row">
                                            <td className="sites-name-cell">
                                                <div className="sites-name-content">
                                                    <img src="/assets/icons/site.png" style={{ width: '20px', height: '20px', marginRight: '8px' }} alt="Site" />
                                                    {site.siteName}
                                                </div>
                                            </td>
                                            <td className="sites-status-cell">
                                                {site.isDefault ? (
                                                    <span className="default-badge">Default Site</span>
                                                ) : (
                                                    <span className="regular-badge">Regular Site</span>
                                                )}
                                            </td>
                                            <td className="sites-actions-cell">
                                                <div className="table-actions">
                                                    <button
                                                        onClick={() => navigate(`/setup/sites/edit/${site.ID}`)}
                                                        className="table-action-icon edit"
                                                        title="Edit site"
                                                    />
                                                    <button
                                                        onClick={() => openDeleteConfirm(site)}
                                                        className="table-action-icon delete"
                                                        title="Delete site"
                                                    />
                                                    {!site.isDefault && (
                                                        <button
                                                            onClick={() => openSetDefaultConfirm(site)}
                                                            className="table-action-icon default"
                                                            title="Set as default"
                                                        >
                                                        </button>
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



            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteConfirm}
                title="Confirm Delete"
                message={`Are you sure you want to delete site "${siteToDelete?.siteName}"? This action cannot be undone.`}
                onConfirm={handleDeleteSite}
                onCancel={closeDeleteConfirm}
            />

            {/* Set Default Confirmation Dialog */}
            <ConfirmDialog
                visible={showSetDefaultConfirm}
                title="Confirm Set Default"
                message={`Are you sure you want to set "${siteToSetDefault?.siteName}" as the default site?`}
                onConfirm={handleSetDefaultSite}
                onCancel={closeSetDefaultConfirm}
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

export default Sites; 