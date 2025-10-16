import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import './Missions.css';
import '../../../App.css';
import './CreateMission.css';

const CreateMission = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    groupId: '',
    siteId: '',
  });
  const [sites, setSites] = useState([]);
  const [missionGroups, setMissionGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Load sites
      const sitesResponse = await apiCallWithRetry(`${SERVER_URL}/api/sites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      console.log('🔄 CreateMission: sitesResponse:', sitesResponse);
      const sitesArray = Array.isArray(sitesResponse) ? sitesResponse : [];
      setSites(sitesArray);

      // Load mission groups
      const groupsResponse = await apiCallWithRetry(`${SERVER_URL}/api/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : [];
      setMissionGroups(groupsArray);

      // Set default values if available
      if (sitesArray.length > 0 && groupsArray.length > 0) {
        setFormData(prev => ({
          ...prev,
          siteId: sitesArray[0].ID.toString(),
          groupId: groupsArray[0].ID.toString()
        }));
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load required data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔄 CreateMission: formData:', formData);

    // Validate required fields
    if (!formData.name || !formData.groupId || !formData.siteId) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Transform formData to match server expectations
      const requestData = {
        missionName: formData.name,
        description: formData.description,
        missionGroupId: formData.groupId,
        siteId: formData.siteId,
        dataMission: '[]' // Add empty data for new mission
      };

      console.log('🔄 CreateMission: requestData:', JSON.stringify(requestData));
      const token = localStorage.getItem('token');
      const response = await apiCallWithRetry(`${SERVER_URL}/api/missions/site/${formData.siteId}`, {
        method: 'POST',
        body: {
          missionName: formData.name,
          description: formData.description,
          missionGroupId: formData.groupId,
          dataMission: '[]' // Add empty data for new mission
        }, // Remove siteId from body since it's in URL
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.success) {
        // Navigate to the newly created mission detail page
        navigate(`/setup/missions/detail/${response.missionId}`);
      } else {
        setError('Failed to create mission');
      }
    } catch (error) {
      console.error('Error creating mission:', error);
      setError('Failed to create mission');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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

  return (
    <div className="create-mission-page">
      <div className="page-header">
        <div className="header-title">
          <h2>Create New Mission</h2>
          <span className="subtitle">Enter mission details below</span>
        </div>
        <div className="header-buttons">
          <button className="btn-go-back" onClick={handleCancel}>
            <span className="go-back-icon"></span>
            Go Back
          </button>
        </div>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group-container">
          <span className="form-group-label">
            Mission Name:
          </span>
          <input
            className="form-group-input"
            type="text"
            name="name"
            placeholder="Enter the mission's name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={handleKeyDown}
            required
          />
        </div>
        <div className="form-double-container">
          <div className="form-group-container">
            <span className="form-group-label">
              Mission Group:
            </span>
            <div className="site-select-container">
              <select
                className="form-group-input"
                name="groupId"
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                onKeyDown={handleKeyDown}
                required
              >
                <option value="">Select a mission group</option>
                {missionGroups.map(group => (
                  <option key={group.ID} value={group.ID}>
                    {group.groupName}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-create">
                Create/Edit
              </button>
            </div>
          </div>

          <div className="form-group-container">
            <span className="form-group-label">
              Site:
            </span>
            <select
              className="form-group-input"
              name="siteId"
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              onKeyDown={handleKeyDown}
              required
            >
              <option value="">Select a site</option>
              {sites.map(site => (
                <option key={site.ID} value={site.ID}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group-container">
          <span className="form-group-label">
            Description:
          </span>
          <textarea
            className="form-group-input"
            name="description"
            placeholder="Enter mission description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onKeyDown={handleKeyDown}
            rows="3"
          />
        </div>

        <div className="form-group-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating...
              </>
            ) : (
              <>
                <span className="save-icon"></span>
                Create Mission
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            <span className="cancel-icon"></span>
            Cancel
          </button>
        </div>
      </form>

    </div>
  );
};

export default CreateMission; 