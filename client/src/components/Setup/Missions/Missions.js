import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import './Missions.css';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import MissionQueueWidgetComponent from '../../Dashboard/DesignDashboard/MissionQueueWidget/MissionQueueWidgetComponent';
import '../../../App.css';

const Missions = () => {
  const [allMissions, setAllMissions] = useState([]); // Danh sách gốc
  const [filteredMissions, setFilteredMissions] = useState([]); // Danh sách đã lọc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSiteId, setCurrentSiteId] = useState(null);
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [showMessage, setShowMessage] = useState(false);
  const [messageData, setMessageData] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [missionGroups, setMissionGroups] = useState([]);

  // Pagination states
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const listContainerRef = useRef(null);

  useEffect(() => {
    loadMissions();
  }, []);



  // Calculate items per page based on actual container height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (!listContainerRef.current) return;

      const containerHeight = listContainerRef.current.clientHeight;
      const containerPadding = 30; // 15px top + 15px bottom padding
      const availableHeight = containerHeight - containerPadding;

      // Each mission item: 54px height + 8px padding + 8px gap = 70px
      const itemHeight = 60;

      const calculatedItems = Math.floor(availableHeight / itemHeight);
      const minItems = 3; // Minimum items to show

      // Trừ đi 1 hàng như yêu cầu
      const finalItems = Math.max(minItems, calculatedItems);


      setItemsPerPage(finalItems);
    };

    // Calculate when container is available and on resize
    const timer = setTimeout(calculateItemsPerPage, 100);

    const handleResize = () => {
      setTimeout(calculateItemsPerPage, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [allMissions, filteredMissions]); // Recalculate when missions load

  const getCurrentSiteId = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return null;
      }

      const response = await fetch(`${SERVER_URL}/api/maps/getCurrentSiteId`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setCurrentSiteId(data.data);
        return data.data;
      } else {
        console.warn('No current site ID found');
        return null;
      }
    } catch (error) {
      console.error('Error getting current site ID:', error);
      return null;
    }
  };

  const loadMissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }

      // Get current site ID first
      const siteId = await getCurrentSiteId();
      if (!siteId) {
        setError('Failed to get current site ID');
        return;
      }

      // load mission groups
      const missionGroupsData = await apiCallWithRetry(`${SERVER_URL}/api/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setMissionGroups(Array.isArray(missionGroupsData) ? missionGroupsData : []);

      // Load missions for the current site using query parameter
      const missionsData = await apiCallWithRetry(`${SERVER_URL}/api/missions/list/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Load site information to get site name
      const siteData = await apiCallWithRetry(`${SERVER_URL}/api/sites/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Add site name to each mission
      const missionsWithSiteName = Array.isArray(missionsData) ? missionsData.map(mission => ({
        ...mission,
        siteName: siteData.siteName || siteData.site_name || 'Default site'
      })) : [];

      setAllMissions(missionsWithSiteName); // Lưu danh sách gốc với site name
      setFilteredMissions(missionsWithSiteName); // Ban đầu, danh sách đã lọc giống danh sách gốc
      setError(null);
    } catch (error) {
      console.error('Error loading missions:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        navigate('/login');
        return;
      }
      setError('Failed to load missions. Please try again.');
      setAllMissions([]);
      setFilteredMissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = () => {
    navigate('create');
  };

  const openDeleteMissionConfirm = (missionId, missionName) => {
    setConfirmData({
      title: "Confirm Delete",
      message: `Are you sure you want to delete mission "${missionName}"?`,
      onConfirm: () => {
        handleDeleteMission(missionId, missionName);
        setShowConfirm(false);
      },
    });
    setShowConfirm(true);
  };

  const handleDeleteMission = async (missionId, missionName) => {
    try {
      const response = await apiCallWithRetry(`${SERVER_URL}/api/missions/${missionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.success) {
        setMessageData({
          title: "Success",
          message: `Mission "${missionName}" has been deleted successfully.`,
        });
        setShowMessage(true);
        loadMissions();
      } else {
        setMessageData({
          title: "Error",
          message: "Failed to delete mission. Please try again.",
        });
        setShowMessage(true);
      }
    } catch (error) {
      console.error('Error deleting mission:', error);
      setMessageData({
        title: "Error",
        message: "An error occurred while deleting the mission.",
      });
      setShowMessage(true);
    }
  };


  const handleFilterChange = (e) => {
    const selectedGroupId = e.target.value;
    setSelectedFilter(selectedGroupId);
    setCurrentPage(1); // Reset về trang 1 khi filter

    if (selectedGroupId === 'all') {
      setFilteredMissions(allMissions); // Khôi phục lại toàn bộ danh sách
      return;
    }

    // Lọc từ danh sách gốc
    const filtered = allMissions.filter(mission =>
      mission.groupID === parseInt(selectedGroupId)
    );
    setFilteredMissions(filtered);
  };

  // Combine group filter and search filter
  const getFilteredMissions = () => {
    let filtered = filteredMissions;

    // Apply search filter
    if (searchFilter.trim()) {
      filtered = filtered.filter(mission =>
        mission.missionName.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    return filtered;
  };

  // Pagination logic
  const finalFilteredMissions = getFilteredMissions();
  const totalPages = Math.ceil(finalFilteredMissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMissions = finalFilteredMissions.slice(startIndex, endIndex);

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

  const handleViewDetails = (missionId) => {
    navigate(`/setup/missions/detail/${missionId}`);
  };

  const handleQueueMission = async (missionId) => {
    try {
      console.log('🔄 Adding mission to queue:', missionId);
      
      const response = await fetch(`${SERVER_URL}/api/missions/queue/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          missionId: missionId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageData({
          title: "Success",
          message: `Mission has been added to queue successfully.`,
        });
        setShowMessage(true);
        console.log('✅ Mission added to queue successfully');
      } else {
        console.error('❌ Failed to add mission to queue:', data);
        setMessageData({
          title: "Error",
          message: data.message || "Failed to add mission to queue. Please try again.",
        });
        setShowMessage(true);
      }
    } catch (error) {
      console.error('❌ Error adding mission to queue:', error);
      setMessageData({
        title: "Error",
        message: "An error occurred while adding mission to queue.",
      });
      setShowMessage(true);
    }
  };

  return (
    <div className="missions-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Missions</h2>
          <span className="subtitle">Create and edit missions</span>
        </div>
        <div className="header-actions">
          <button className="btn-create" onClick={handleCreateMission}>
            <span className="plus-icon"></span>
            Create mission
          </button>
        </div>
      </div>

      <div className="missions-private-content">
        <div className="missions-private-filters">
          <div className="missions-private-filter-dropdown">
            <span>Show missions:</span>
            <select
              value={selectedFilter}
              onChange={handleFilterChange}
              onKeyDown={handleKeyDown}
              className="missions-private-select"
            >
              <option value="all">All missions</option>
              {missionGroups.map(group => (
                <option key={group.ID} value={group.ID}>
                  {group.groupName || 'Unnamed Group'}
                </option>
              ))}
            </select>
          </div>
          <button 
            className="missions-private-create-edit-groups-btn"
            onClick={() => navigate('/setup/missions/groups')}
          >
            Create / Edit groups
          </button>
          {/* Search Filter */}
          <div className="filter-input">
            <label>Filter:</label>
            <input
              type="text"
              placeholder="Write name to filter by..."
              value={searchFilter}
              onChange={handleSearchFilterChange}
              onKeyDown={handleKeyDown}
            />
            <span className="items-found">{finalFilteredMissions.length} item(s) found</span>
          </div>

          {/* Pagination */}
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

        <div className="missions-private-main-content">

          <div className="missions-content-wrapper">
            <div className="missions-private-list" ref={listContainerRef}>
              {currentMissions.length === 0 ? (
                <div className="missions-private-no-missions">
                  {finalFilteredMissions.length === 0
                    ? (searchFilter ? 'No missions found matching your search' : 'No missions available')
                    : 'No missions on this page'}
                </div>
              ) : (
                currentMissions.map((mission) => (
                  <div key={mission.ID} className="missions-private-item">
                    <div className="missions-private-icon">
                      <img src="/assets/icons/target-white.png" alt="Mission" />
                    </div>
                    <div className="missions-private-details">
                      <div className="missions-private-name">{mission.missionName}</div>
                      <div className="missions-private-site">{mission.siteName || mission.site_name || 'Default site'}</div>
                    </div>
                    <div className="table-actions">
                      <button
                        onClick={() => handleViewDetails(mission.ID)}
                        className="table-action-icon edit"
                        title="Edit mission"
                      />
                      <button
                        onClick={() => openDeleteMissionConfirm(mission.ID, mission.missionName)}
                        className="table-action-icon delete"
                        title="Delete mission"
                      />
                      <button
                        onClick={() => handleQueueMission(mission.ID)}
                        className="table-action-icon queue"
                        title="Queue mission"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="missions-private-queue">
              <h3>Mission queue</h3>
              <div className="missions-private-queue-embed">
                <MissionQueueWidgetComponent
                  widget={{
                    id: 'embedded-mission-queue',
                    displayMode: 'display',
                    title: 'Mission Queue',
                    settings: '',
                    properties: {},
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        visible={showConfirm}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onCancel={() => setShowConfirm(false)}
        isDelete={confirmData.title?.toLowerCase().includes('delete')}
      />
      <MessageDialog
        visible={showMessage}
        title={messageData.title}
        message={messageData.message}
        onClose={() => setShowMessage(false)}
      />
    </div>
  );
};

export default Missions; 