import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { SERVER_URL, apiCallWithRetry } from '../../../../config/serverConfig';
import './CreateMap.css';
import '../../../../App.css';

const CreateMap = () => {
  const [mapName, setMapName] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const sitesData = await apiCallWithRetry(`${SERVER_URL}/api/sites`);
      if (Array.isArray(sitesData)) {
        setSites(sitesData);
        // Set default selected site if there's a default one
        const defaultSite = sitesData.find(site => site.isDefault);
        if (defaultSite) {
          setSelectedSite(defaultSite.ID);
        }
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    if (!mapName || !selectedSite) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Check for duplicate map name
      const existingMaps = await apiCallWithRetry(`${SERVER_URL}/api/sites/${selectedSite}/maps`);

      if (existingMaps && existingMaps.some(map => map.mapName.toLowerCase() === mapName.toLowerCase())) {
        alert('A map with this name already exists in the selected site. Please choose a different name.');
        return;
      }

      const userName = localStorage.getItem('userName');
      const response = await apiCallWithRetry(`${SERVER_URL}/api/maps`, {
        method: 'POST',
        data: {
          mapName,
          IDSite: selectedSite,
          createdBy: userName || 'Unknown User'
        }
      });

      // Ưu tiên các trường phổ biến: ID, id, mapId
      const newMapId = response?.ID || response?.id || response?.mapId;
      if (newMapId) {
        localStorage.removeItem('editMapData'); // Clear old map data
        navigate(`/setup/maps/edit/${newMapId}`);
      } else {
        // Nếu không có mapId, fallback về trang maps
        navigate('/setup/maps');
      }
    } catch (error) {
      console.error('Error creating map:', error);
      alert(`Error creating map: ${error.message}`);
    }
  };

  const handleCancel = () => {
    navigate('/setup/maps');
  };

  const handleManageSites = () => {
    navigate('/setup/maps/create/sites');
  };

  const handleBack = () => {
    navigate('/setup/maps');
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
    <div className="create-map-page">
      <div className="page-header">
        <div className="header-title">
          <h2>Create New Map</h2>
          <span className="subtitle">Enter map details below</span>
        </div>
        <div className="header-buttons">
          <button className="btn-go-back" onClick={handleBack}>
            <span className="go-back-icon"></span>
            Go Back
          </button>
        </div>
      </div>
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group-container">
          <span className="form-group-label">
            Map Name:
          </span>
          <input className="form-group-input"
            type="text"
            id="mapName"
            name="mapName"
            placeholder="Enter map name"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            required
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="form-group-container">
          <span className="form-group-label">
            Site:
          </span>
          <div className="site-select-container">
            <select className="form-group-input"
              id="mapSite"
              name="mapSite"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
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
            <button
              type="button"
              className="btn-create"
              onClick={handleManageSites}
            >
              Create/Edit
            </button>
          </div>
        </div>
        <div className="form-group-actions">
          <button type="submit" className="btn-submit">
            <span className="save-icon"></span>
            Create
          </button>
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            <span className="cancel-icon"></span>
            Cancel
          </button>
        </div>
      </form>

    </div>
  );
};

export default CreateMap; 