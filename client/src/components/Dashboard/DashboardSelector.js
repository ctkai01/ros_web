import React, { useState } from 'react';
import Dashboard from './Dashboard';
import './DashboardSelector.css';

const DashboardSelector = ({ isNavOpen }) => {
  const [selectedDashboard, setSelectedDashboard] = useState('EliteAutomation');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');

  const dashboards = [
    'Default Dashboard',
    'EliteAutomation',
    'Warehouse Operations',
    'Maintenance Dashboard'
  ];

  const handleCreateNew = () => {
    if (newDashboardName.trim()) {
      // Logic to create new dashboard
      console.log('Creating dashboard:', newDashboardName);
      setSelectedDashboard(newDashboardName);
      setNewDashboardName('');
      setIsCreatingNew(false);
    }
  };

  const handleDeleteDashboard = (dashboardName) => {
    if (dashboards.length > 1) {
      console.log('Deleting dashboard:', dashboardName);
      // Logic to delete dashboard
    }
  };

  return (
    <div className={`dashboard-selector-container ${isNavOpen ? 'nav-expanded' : ''}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Dashboards</h3>
          <button 
            className="btn-new-dashboard"
            onClick={() => setIsCreatingNew(true)}
          >
            + New
          </button>
        </div>
        
        {isCreatingNew && (
          <div className="new-dashboard-form">
            <input
              type="text"
              placeholder="Dashboard name"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
              autoFocus
            />
            <div className="form-actions">
              <button onClick={handleCreateNew} className="btn-create">Create</button>
              <button onClick={() => setIsCreatingNew(false)} className="btn-cancel">Cancel</button>
            </div>
          </div>
        )}

        <ul className="dashboard-list">
          {dashboards.map((dashboard, index) => (
            <li key={index} className="dashboard-item">
              <button
                className={`dashboard-btn ${selectedDashboard === dashboard ? 'active' : ''}`}
                onClick={() => setSelectedDashboard(dashboard)}
              >
                <span className="dashboard-name">{dashboard}</span>
                {dashboard !== 'Default Dashboard' && (
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDashboard(dashboard);
                    }}
                  >
                    ×
                  </button>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="dashboard-content">
        <Dashboard key={selectedDashboard} dashboardName={selectedDashboard} isNavOpen={isNavOpen} />
      </div>
    </div>
  );
};

export default DashboardSelector; 