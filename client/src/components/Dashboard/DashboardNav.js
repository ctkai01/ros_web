import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import serverConfig from '../../config/serverConfig';
import './DashboardNav.css';

const DashboardNav = ({ isNavOpen }) => {
  const location = useLocation();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  // Listen for dashboard creation events
  useEffect(() => {
    const handleDashboardCreated = () => {
      console.log('🔄 DashboardNav: Reloading dashboards after creation');
      fetchDashboards();
    };

    window.addEventListener('dashboardCreated', handleDashboardCreated);

    return () => {
      window.removeEventListener('dashboardCreated', handleDashboardCreated);
    };
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboards');
      }
      const data = await response.json();
      // Sắp xếp theo ID tăng dần để giữ thứ tự trong database
      const sortedDashboards = data.sort((a, b) => a.id - b.id);
      setDashboards(sortedDashboards);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  };

  return (
          <div className={`dashboard-nav nav-common ${isNavOpen ? 'nav-expanded' : ''}`}>
      <h2>Dashboard</h2>
      <nav>
        <ul>
          {/* Default Dashboard button */}
          <li>
            <Link 
              to="/dashboard/list" 
              className={isActive('/dashboard/list') ? 'active' : ''}
            >
              Dashboard
              <span className="arrow">›</span>
            </Link>
          </li>
          
          {/* Dynamic dashboard buttons from database */}
          {loading ? (
            <li className="loading-item">
              <span>Loading dashboards...</span>
            </li>
          ) : (
            dashboards.map((dashboard) => (
              <li key={dashboard.id}>
                <Link 
                  to={`/dashboard/view/${dashboard.id}`} 
                  className={isActive(`/dashboard/view/${dashboard.id}`) ? 'active' : ''}
                >
                  {dashboard.name}
                  <span className="arrow">›</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </nav>
    </div>
  );
};

export default DashboardNav; 