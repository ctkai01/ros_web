import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import MessageDialog from '../../common/MessageDialog';
import './EditMission.css';
import '../../../App.css';

const EditMission = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const from = location.state?.from;
  const missionId = location.state?.missionId;
  const [formData, setFormData] = useState({
    missionName: '',
    description: '',
    siteId: '',
    missionGroupId: '',
    data: ''
  });
  const [sites, setSites] = useState([]);
  const [missionGroups, setMissionGroups] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [messageData, setMessageData] = useState({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch mission data
        const missionData = await apiCallWithRetry(`${SERVER_URL}/api/missions/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        console.log("missionData", missionData);

        // Fetch sites
        const sitesData = await apiCallWithRetry(`${SERVER_URL}/api/sites`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        // Fetch groups
        const groupsData = await apiCallWithRetry(`${SERVER_URL}/api/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        // Set form data with mission data
        setFormData({
          missionName: missionData.missionName,
          description: missionData.description || '',
          siteId: missionData.IDSite || '',
          missionGroupId: missionData.groupID || '',
          data: missionData.data || ''
        });

        setSites(Array.isArray(sitesData) ? sitesData : []);
        setMissionGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load mission data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.missionName.trim()) {
      setMessageData({
        title: 'Validation Error',
        message: 'Mission name is required.'
      });
      setShowMessage(true);
      return;
    }

    if (!formData.siteId || !formData.missionGroupId) {
      setMessageData({
        title: 'Validation Error',
        message: 'Please select both site and mission group.'
      });
      setShowMessage(true);
      return;
    }

    // Show save dialog to confirm mission name
    setSaveDialogName(formData.missionName);
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async () => {
    if (!saveDialogName.trim()) {
      setMessageData({
        title: 'Validation Error',
        message: 'Mission name is required.'
      });
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);
      setShowSaveDialog(false);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiCallWithRetry(`${SERVER_URL}/api/missions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          siteId: formData.siteId,
          missionName: saveDialogName,
          missionGroupId: formData.missionGroupId,
          description: formData.description,
          dataMission: formData.data
        }
      });

      if (response.success) {
        setMessageData({
          title: 'Success',
          message: 'Mission has been updated successfully.'
        });
        setShowMessage(true);
        setTimeout(() => {
          navigate(from === 'detail' ? `/setup/missions/detail/${missionId}` : '/setup/missions');
        }, 1500);
      } else {
        setMessageData({
          title: 'Error',
          message: response.error || 'Failed to update mission.'
        });
        setShowMessage(true);
      }
    } catch (error) {
      console.error('Error updating mission:', error);
      setMessageData({
        title: 'Error',
        message: 'An error occurred while updating mission.'
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCancel = () => {
    setShowSaveDialog(false);
    setSaveDialogName('');
  };

  const handleCancel = () => {
    navigate(from === 'detail' ? `/setup/missions/detail/${missionId}` : '/setup/missions');
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

  if (loadingData) {
    return (
      <div className="create-mission-page">
        <div className="loading-message">Loading mission data...</div>
      </div>
    );
  }

  return (
    <div className="create-mission-page">
      <div className="page-header">
        <div className="header-title">
          <h2>Edit Mission</h2>
          <span className="subtitle">Modify mission details and settings</span>
        </div>
        <div className="header-buttons">
          <button className="btn-go-back" onClick={handleCancel}>
            <span className="go-back-icon"></span>
            Go Back
          </button>
        </div>
      </div>

      <div className="form-container">
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
            name="missionName"
            placeholder="Enter the mission's name..."
            value={formData.missionName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            required
          />
        </div>

        <div className="form-double-container">
          <div className="form-group-container">
            <span className="form-group-label">
              Mission Group:
            </span>
            <select
              className="form-group-input"
              name="missionGroupId"
              value={formData.missionGroupId}
              onChange={handleInputChange}
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
          </div>

          <div className="form-group-container">
            <span className="form-group-label">
              Site:
            </span>
            <select
              className="form-group-input"
              name="siteId"
              value={formData.siteId}
              onChange={handleInputChange}
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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows="3"
          />
        </div>

        <div className="form-group-actions">
          <button
            type="button"
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Updating...
              </>
            ) : (
              <>
                <span className="save-icon"></span>
                Update Mission
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
      </div>

      <MessageDialog
        visible={showMessage}
        title={messageData.title}
        message={messageData.message}
        onClose={() => setShowMessage(false)}
      />

      {/* Save Mission Dialog */}
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog-modal">
            <div className="response-dialog-header">
              <div className="edit-icon"></div>
              <h3>Save Mission</h3>
            </div>
            
            <div className="dialog-body">
              <div className="dialog-input">
                <label>Mission Name:</label>
                <input
                  type="text"
                  value={saveDialogName}
                  onChange={(e) => setSaveDialogName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter mission name"
                  disabled={loading}
                  className="form-group-input"
                />
                <div className="dialog-help-text">
                  Enter the name for this mission
                </div>
              </div>
            </div>
            
            <div className="dialog-actions">
              <button 
                className="dialog-btn dialog-btn-secondary"
                onClick={handleSaveCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="dialog-btn dialog-btn-primary"
                onClick={handleSaveConfirm}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Mission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditMission; 