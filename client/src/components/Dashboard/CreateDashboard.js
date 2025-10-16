import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import serverConfig from '../../config/serverConfig';
import './CreateDashboard.css';
import '../../App.css';

const CreateDashboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);

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

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Dashboard name is required');
      return;
    }

    try {
      setLoading(true);

      // Get current user from localStorage
      const currentUser = localStorage.getItem('userName') || 'Unknown User';
      
      const dashboardData = {
        name: formData.name.trim(),
        createdBy: currentUser,
        properties: {
          layout: 'grid',
          theme: 'default',
          widgets: [],
          created: new Date().toISOString()
        }
      };

      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboardData),
      });

      if (!response.ok) {
        throw new Error('Failed to create dashboard');
      }

      const createdDashboard = await response.json();
      
      // Emit custom event để reload dashboard list
      window.dispatchEvent(new CustomEvent('dashboardCreated', {
        detail: { dashboardId: createdDashboard.id }
      }));
      
      // Navigate to dashboard design page
      navigate(`/dashboard/design/${createdDashboard.id}`);
    } catch (err) {
      console.error('Error creating dashboard:', err);
      alert('Failed to create dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/list');
  };

  return (
    <div className="create-dashboard-page">
      <div className="page-header">
        <div className="header-title">
          <h2>Create New Dashboard</h2>
          <span className="subtitle">Enter dashboard details below</span>
        </div>
        <div className="header-buttons">
          <button className="btn-go-back" onClick={handleBack}>
            <span className="go-back-icon"></span>
            Go Back
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
            placeholder="Enter dashboard name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div className="form-group-actions">
          <button 
            className="btn-submit" 
            onClick={handleCreate}
            disabled={loading || !formData.name.trim()}
          >
            <span className="save-icon"></span>
            {loading ? 'Creating...' : 'Create Dashboard'}
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

export default CreateDashboard; 