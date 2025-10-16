import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import serverConfig from '../../config/serverConfig';
import './EditDashboard.css';

const EditDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboard();
  }, [id]);

  const fetchDashboard = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      const data = await response.json();
      setFormData({
        name: data.name
      });
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      alert('Failed to load dashboard');
      navigate('/dashboard/list');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBack = () => {
    navigate('/dashboard/list');
  };

  const handleSaveChanges = async () => {
    if (!formData.name.trim()) {
      alert('Dashboard name is required');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update dashboard');
      }

      navigate('/dashboard/list');
    } catch (err) {
      console.error('Error updating dashboard:', err);
      alert('Failed to update dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDesign = () => {
    navigate(`/dashboard/design/${id}`);
  };

  const handleCancel = () => {
    navigate('/dashboard/list');
  };

  if (fetchLoading) {
    return (
      <div className="edit-dashboard-container">
        <div className="loading-state">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-dashboard-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Edit Dashboard</h2>
          <span className="subtitle">Edit the dashboard in the Robot.</span>
        </div>
        <div className="header-actions">
          <button className="btn-cancel" onClick={handleBack}>
            <span className="back-icon"></span> Back to the list
          </button>
        </div>
      </div>

      <div className="form-container">
        <div className="form-group-container">
          <span className="form-group-label">
            Dashboard Name:
          </span>
          <input
            className="form-group-input"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter dashboard name"
            disabled={loading}
          />
        </div>

        <div className="form-group-actions">
          <button 
            className="btn-save" 
            onClick={handleSaveChanges}
            disabled={loading || !formData.name.trim()}
          >
            <span className="save-icon"></span>
            {loading ? 'Saving...' : 'Save Dashboard'}
          </button>
          <button 
            className="btn-design" 
            onClick={handleDesign}
            disabled={loading}
          >
            <span className="design-icon"></span>
            Design
          </button>
          <button 
            className="btn-cancel" 
            onClick={handleCancel}
            disabled={loading}
          >
            <span className="cancel-icon"></span>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDashboard; 