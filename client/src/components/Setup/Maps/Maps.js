import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import './Maps.css';

const Maps = () => {
  const [searchFilter, setSearchFilter] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [sites, setSites] = useState([]);
  const [collapsedSites, setCollapsedSites] = useState(new Set());
  const [deleteDialog, setDeleteDialog] = useState({ show: false, mapId: null, mapName: '', siteId: null });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [totalMapsCount, setTotalMapsCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Load sites when component mounts
  useEffect(() => {
    console.log('Component mounted, loading sites...');
    loadSites();
  }, []);

  // Load sites when route changes to maps
  useEffect(() => {
    console.log('Route changed to maps, loading sites...');
    if (location.pathname === '/setup/maps') {
      loadSites();
    }
  }, [location.pathname]);

  const loadSites = async () => {
    try {
      console.log('Loading sites from:', `${SERVER_URL}/api/sites`);
      const sitesData = await apiCallWithRetry(`${SERVER_URL}/api/sites`);
      console.log('Sites loaded:', sitesData);
      
      if (Array.isArray(sitesData)) {
        setSites(sitesData);
        // Expand all sites by default
        const siteIds = sitesData.map(site => site.ID);
        setCollapsedSites(new Set());
      } else {
        console.error('Invalid sites data received:', sitesData);
        setSites([]);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('Authentication failed, redirecting to login');
        navigate('/login');
        return;
      }
      setSites([]);
    }
  };

  const loadMapsForSite = async (siteId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            navigate('/login');
            return [];
        }

        console.log('Loading maps for site:', `${SERVER_URL}/api/sites/${siteId}/maps`);
        const maps = await apiCallWithRetry(`${SERVER_URL}/api/sites/${siteId}/maps`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return Array.isArray(maps) ? maps : [];
    } catch (error) {
        console.error(`Error loading maps for site ${siteId}:`, error);
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('Authentication failed, redirecting to login');
            navigate('/login');
        }
        return [];
    }
  };


  const handleCreateMap = () => {
    // Clear any temporary map data (nếu có)
    localStorage.removeItem('editMapData');
    // Chuyển sang trang tạo map (form nhập tên, chọn site)
    navigate('/setup/maps/create');
  };

  const handleImportSite = () => {
    // Handle import site functionality
  };

  // Pagination logic
  const filteredSites = sites.filter(site => {
    // Check if site name matches
    const siteNameMatch = site.siteName.toLowerCase().includes(searchFilter.toLowerCase());
    
    // If site name matches, include this site
    if (siteNameMatch) {
      return true;
    }
    
    // If search filter is empty, include all sites
    if (searchFilter === '') {
      return true;
    }
    
    // For map name search, we'll include all sites and let SiteMaps component handle the filtering
    // This ensures we can search across all maps regardless of which site they belong to
    return true;
  });

  // Calculate total maps count for display
  useEffect(() => {
    const calculateTotalMaps = async () => {
      let totalMaps = 0;
      for (const site of filteredSites) {
        try {
          const maps = await loadMapsForSite(site.ID);
          totalMaps += maps.length;
        } catch (error) {
          console.error(`Error loading maps for site ${site.ID}:`, error);
        }
      }
      setTotalMapsCount(totalMaps);
    };

    if (filteredSites.length > 0) {
      calculateTotalMaps();
    } else {
      setTotalMapsCount(0);
    }
  }, [filteredSites, searchFilter]);

  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSites = filteredSites.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSearchFilter('');
    setCurrentPage(1); // Reset to first page when clearing filters
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

  const handleDeleteMap = async (mapId, mapName, siteId) => {
    setDeleteDialog({ show: true, mapId, mapName, siteId });
  };

  const confirmDelete = async () => {
    try {
      // Check if the map to delete is the current map by checking the site's current map
      console.log('Deleting map:', deleteDialog.mapId, 'for site:', deleteDialog.siteId);
      const siteResponse = await apiCallWithRetry(`${SERVER_URL}/api/sites/${deleteDialog.siteId}`, {
        method: 'GET'
      });

      console.log('Site response:', siteResponse);


      if (siteResponse && 
          siteResponse.IDCurrentMap === deleteDialog.mapId) {
        // If deleting current map, stop robot navigation first
        console.log('Deleting current map, stopping robot navigation...');
        await apiCallWithRetry(`${SERVER_URL}/api/robot/stop-navigation`, {
          method: 'POST'
        });
        
        // Update current map ID to -1 to indicate no current map
        console.log('Updating current map ID to -1...');
        await apiCallWithRetry(`${SERVER_URL}/api/maps/update-current-map`, {
          method: 'POST',
          data: {
            siteId: deleteDialog.siteId,
            currentMapId: -1
          }
        });
      }
      else {
        console.log('Deleting map:', deleteDialog.mapId, 'for site:', deleteDialog.siteId);
      }

      // Delete the map
      await apiCallWithRetry(`${SERVER_URL}/api/maps/${deleteDialog.mapId}`, {
        method: 'DELETE'
      });

      // Close dialog and reload data
      setDeleteDialog({ show: false, mapId: null, mapName: '', siteId: null });
      
      // Trigger reload of both sites and maps
      await loadSites();
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting map:', error);
      setDeleteDialog({ show: false, mapId: null, mapName: '', siteId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ show: false, mapId: null, mapName: '', siteId: null });
  };

  const handleEditMap = (mapId, siteId, mapName) => {
    navigate(`/setup/maps/edit/${mapId}?mapName=${mapName}`);
    

  };

  const handleViewMap = (mapId, siteId, mapName) => {
    navigate(`/setup/maps/view/${mapId}`);
  };

  const toggleSiteCollapse = (siteId) => {
    setCollapsedSites(prevState => {
      const newState = new Set(prevState);
      if (newState.has(siteId)) {
        newState.delete(siteId);
      } else {
        newState.add(siteId);
      }
      return newState;
    });
  };

  return (
    <>
      <div className="maps-page-container">
        <div className="page-header">
          <div className="header-title">
            <h2>Maps</h2>
            <span className="subtitle">Create and edit maps.</span>
          </div>
          <div className="header-actions">
            <button className="btn-create" onClick={handleCreateMap}>
              <span className="plus-icon"></span>
              Create map
            </button>
            <button className="btn-import" onClick={handleImportSite}>
              <span className="import-icon"></span>
              Import site
            </button>
            <button className="btn-clear" onClick={handleClearFilters}>
              <span className="clear-icon"></span>
              Clear filters
            </button>
          </div>
        </div>

        <div className="maps-content">
          <div className="filter-section">
            <div className="filter-input">
              <label>Filter:</label>
              <input 
                type="text" 
                placeholder="Write name to filter by..."
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                onKeyDown={handleKeyDown}
              />
              <span className="items-found">{totalMapsCount} map(s) found</span>
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

          <table className="maps-table">
            <thead>
              <tr>
                <th className="icon-column"><strong></strong></th>
                <th><strong>Name</strong></th>
                <th><strong>Created by</strong></th>
                <th><strong>Functions</strong></th>
              </tr>
            </thead>
            <tbody id="sitesTableBody">
              {currentSites.map((site) => (
                <React.Fragment key={site.ID}>
                  <tr className="site-row parent-row">
                    <td colSpan="4" className="site-cell">
                      <div className="site-content">
                        <div className="site-left">
                          <span 
                            className="expand-icon" 
                            onClick={() => toggleSiteCollapse(site.ID)}
                          >
                            {collapsedSites.has(site.ID) ? <img src="assets/icons/right-arrow.png" alt="Expand" style={{ width: '16px', height: '16px' }} /> : <img src="assets/icons/down-arrow.png" alt="Collapse" style={{ width: '16px', height: '16px' }} />}
                          </span>
                          <span className="site-name">{site.siteName}</span>
                          {site.isDefault && (
                            <span className="active-badge">
                              <span className="check-icon"></span>
                              <span>ACTIVE</span>
                            </span>
                          )}
                        </div>
                        <div className="site-right">
                          <button className="export-button">
                            <span className="export-icon"></span>
                            Export
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className={`site-maps-row ${collapsedSites.has(site.ID) ? 'collapsed' : ''}`}>
                    <td colSpan="4">
                      <SiteMaps 
                        key={`${site.ID}-${reloadTrigger}`}
                        siteId={site.ID} 
                        searchFilter={searchFilter}
                        loadMapsForSite={loadMapsForSite} 
                        onDeleteMap={handleDeleteMap}
                        onEditMap={handleEditMap}
                        onViewMap={handleViewMap}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteDialog.show && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-title">Delete Map</div>
            <div className="confirm-dialog-message">
              Are you sure you want to delete map "{deleteDialog.mapName}"?
            </div>
            <div className="confirm-dialog-buttons">
              <button className="confirm-dialog-button cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-dialog-button confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Sub-component for site maps
const SiteMaps = ({ siteId, searchFilter, loadMapsForSite, onDeleteMap, onEditMap, onViewMap }) => {
  const [maps, setMaps] = useState([]);
  const [currentMapId, setCurrentMapId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMaps = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load maps for the site
      const mapsData = await apiCallWithRetry(`${SERVER_URL}/api/sites/${siteId}/maps`);
      
      // Load site data to get current map ID
      const siteData = await apiCallWithRetry(`${SERVER_URL}/api/sites/${siteId}`);
      
      setCurrentMapId(siteData.IDCurrentMap);
      setMaps(Array.isArray(mapsData) ? mapsData : []);
    } catch (error) {
      console.error('Error loading maps:', error);
      setError(error.message);
      setMaps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Loading maps for site:', siteId);
    loadMaps();
  }, [siteId]);

  const handleDeleteMap = async (mapId, mapName) => {
    try {
      await onDeleteMap(mapId, mapName, siteId);
    } catch (error) {
      console.error('Error in handleDeleteMap:', error);
    }
  };

  if (loading) {
    return (
      <div className="child-maps-container">
        <div className="loading-message">Loading maps...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="child-maps-container">
        <div className="error-message">
          Error loading maps. Please try again later.
          <button onClick={loadMaps} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter maps based on search filter
  const filteredMaps = maps.filter(map =>
    map.mapName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!maps || maps.length === 0) {
    return (
      <div className="child-maps-container">
        <div className="empty-message">No maps available</div>
      </div>
    );
  }

  // If search filter is applied and no maps match, show message
  if (searchFilter && filteredMaps.length === 0) {
    return (
      <div className="child-maps-container">
        <div className="empty-message">No maps found matching "{searchFilter}"</div>
      </div>
    );
  }

  return (
    <div className="child-maps-container">
      {filteredMaps.map((map) => (
        <div 
          key={map.ID} 
          className="map-row" 
          data-id={map.ID} 
          data-site-id={map.IDSite} 
          data-name={map.mapName}
        >
          <div className="map-content">
            <div className="map-icon">
            </div>
            <div className="map-info">
              <div className="map-name-container">
                <span className="map-title" style={{ fontWeight: map.ID === currentMapId ? 'bold' : 'normal' }}>{map.mapName}</span>
                {map.ID === currentMapId && (
                  <div className="active-badge">
                    <span className="check-icon"> </span>
                    <span>ACTIVE</span>
                  </div>
                )}
              </div>
            </div>
            <div className="map-creator">
              {map.createdBy || 'System'}
            </div>
            <div className="table-actions">
              <button 
                className="table-action-icon view" 
                title="View" 
                onClick={() => onViewMap(map.ID, siteId, map.mapName)}
              />
              <button 
                className="table-action-icon edit" 
                title="Edit" 
                onClick={() => onEditMap(map.ID, siteId, map.mapName)}
              />
              <button 
                className="table-action-icon delete" 
                title="Delete" 
                onClick={() => handleDeleteMap(map.ID, map.mapName)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Maps; 