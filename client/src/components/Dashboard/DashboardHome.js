import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import serverConfig from '../../config/serverConfig';
import ConfirmDialog from '../common/ConfirmDialog';
import './DashboardHome.css';
import '../../App.css';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [activeDashboardId, setActiveDashboardId] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [measuredRowHeight, setMeasuredRowHeight] = useState(null);

  const dashboardsContentRef = useRef(null);
  const filterSectionRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const theadRef = useRef(null);
  const firstRowRef = useRef(null);

  console.log('serverConfig.SERVER_URL', serverConfig.SERVER_URL);

  // Fetch dashboards from API
  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching dashboards...'); // Test webpack rebuild
      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboards');
      }
      const data = await response.json();
      // Sắp xếp theo ID tăng dần để giữ thứ tự trong database
      const sortedDashboards = data.sort((a, b) => a.id - b.id);
      setDashboards(sortedDashboards);
      
      // Set first dashboard as active if no active dashboard is set
      if (sortedDashboards.length > 0 && !activeDashboardId) {
        setActiveDashboardId(sortedDashboards[0].id);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboards:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter]);

  const recomputeItemsPerPage = useCallback(() => {
    const contentEl = dashboardsContentRef.current;
    const filterEl = filterSectionRef.current;
    const thead = theadRef.current;

    // Fallbacks
    if (!contentEl) return;

    const contentRect = contentEl.getBoundingClientRect();
    const filterHeight = filterEl ? filterEl.getBoundingClientRect().height : 0;

    const styles = window.getComputedStyle(contentEl);
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;

    // Available viewport space from top of content to bottom of window
    const viewportAvailable = Math.max(0, window.innerHeight - contentRect.top - 12); // small margin
    // Deduct filter area and container paddings to get table area height
    const tableAreaHeight = Math.max(0, viewportAvailable - filterHeight - paddingTop - paddingBottom);

    // Deduct table header
    const headerHeight = thead ? thead.getBoundingClientRect().height : 0;
    const bodyHeight = Math.max(0, tableAreaHeight - headerHeight);

    const rowHeight = measuredRowHeight || 48; // default estimate
    const computed = Math.max(1, Math.floor(bodyHeight / rowHeight));
    setItemsPerPage(computed);
  }, [measuredRowHeight]);

  // Recompute when viewport resizes
  useEffect(() => {
    const onResize = () => recomputeItemsPerPage();
    window.addEventListener('resize', onResize);
    // Initial compute
    recomputeItemsPerPage();
    return () => window.removeEventListener('resize', onResize);
  }, [recomputeItemsPerPage]);

  // Listen for dashboard events (create, delete, update)
  useEffect(() => {
    const handleDashboardEvent = (event) => {
      if (event.detail && (event.detail.action === 'delete' || event.type === 'dashboardDeleted')) {
        // Reload dashboards when a dashboard is deleted
        fetchDashboards();
      }
    };

    window.addEventListener('dashboardCreated', handleDashboardEvent);
    window.addEventListener('dashboardDeleted', handleDashboardEvent);
    
    return () => {
      window.removeEventListener('dashboardCreated', handleDashboardEvent);
      window.removeEventListener('dashboardDeleted', handleDashboardEvent);
    };
  }, []);

  // Measure first row height when it renders
  useEffect(() => {
    if (firstRowRef.current) {
      const h = firstRowRef.current.getBoundingClientRect().height;
      if (h && h > 0 && h !== measuredRowHeight) {
        setMeasuredRowHeight(h);
      }
    }
  }, [filteredDashboards, currentPage, itemsPerPage, measuredRowHeight]);

  const handleCreateDashboard = () => {
    navigate('/dashboard/create');
  };

  const handleEditDashboard = (dashboardId) => {
    navigate(`/dashboard/edit/${dashboardId}`);
  };

  const handleDesignDashboard = (dashboardId) => {
    navigate(`/dashboard/design/${dashboardId}`);
  };

  const handleDeleteDashboard = async (dashboardId) => {
    setDashboardToDelete(dashboardId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!dashboardToDelete) return;

    try {
      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards/${dashboardToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete dashboard');
      }

      // Reload dashboard navigation after successful delete
      await fetchDashboards();
      // Notify other parts (e.g., DashboardNav) to refresh via the same event pattern used on create
      window.dispatchEvent(new CustomEvent('dashboardCreated', {
        detail: { dashboardId: dashboardToDelete, action: 'delete' }
      }));
      
      // If deleted dashboard was active, set first remaining dashboard as active
      if (dashboardToDelete === activeDashboardId) {
        const remainingDashboards = dashboards.filter(d => d.id !== dashboardToDelete);
        setActiveDashboardId(remainingDashboards.length > 0 ? remainingDashboards[0].id : null);
      }
      setShowDeleteDialog(false);
      setDashboardToDelete(null);
    } catch (err) {
      console.error('Error deleting dashboard:', err);
      alert('Failed to delete dashboard');
      setShowDeleteDialog(false);
      setDashboardToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDashboardToDelete(null);
  };

  const handleDuplicateDashboard = async (dashboard) => {
    try {
      // Get current user from localStorage
      const currentUser = localStorage.getItem('userName') || 'Unknown User';
      
      const response = await fetch(`${serverConfig.SERVER_URL}/api/dashboards/${dashboard.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy: currentUser
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate dashboard');
      }

      const duplicatedDashboard = await response.json();
      setDashboards([duplicatedDashboard, ...dashboards]);
    } catch (err) {
      console.error('Error duplicating dashboard:', err);
      alert('Failed to duplicate dashboard');
    }
  };

  const handleSetActive = (dashboardId) => {
    setActiveDashboardId(dashboardId);
    // TODO: Save active dashboard to localStorage or user preferences
    localStorage.setItem('activeDashboardId', dashboardId);
  };

  // Load active dashboard from localStorage on component mount
  useEffect(() => {
    const savedActiveDashboardId = localStorage.getItem('activeDashboardId');
    if (savedActiveDashboardId) {
      setActiveDashboardId(parseInt(savedActiveDashboardId));
    }
  }, []);

  if (loading) {
    return (
      <div className="dashboard-home-container">
        <div className="loading-state">
          <p>Loading dashboards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-home-container">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={fetchDashboards}>Retry</button>
        </div>
      </div>
    );
  }

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredDashboards.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  if (safeCurrentPage !== currentPage) {
    // Clamp if total pages decreased
    // Avoid setState during render by scheduling microtask
    Promise.resolve().then(() => setCurrentPage(safeCurrentPage));
  }
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const pageItems = filteredDashboards.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="dashboard-home-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Dashboards</h2>
          <span className="subtitle">Create and edit dashboards for the robot.</span>
        </div>
        <div className="header-actions">
            <button className="btn-create" onClick={handleCreateDashboard}>
              <span className="plus-icon"></span> Create Dashboard
            </button>
            <button className="btn-clear" onClick={() => setSearchFilter('')}>
              <span className="clear-icon"></span> Clear filters
            </button>
          </div>
      </div>

      <div className="dashboards-content" ref={dashboardsContentRef}>
        <div className="filter-section" ref={filterSectionRef}>
          <div className="filter-input">
            <label>Filter:</label>
            <input
              type="text"
              placeholder="Write name to filter by..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            <span className="items-found">{filteredDashboards.length} item(s) found</span>
          </div>

          <div className="pagination">
            <div className="pagination-controls">
              <div className="prev-last-button">
                <button className="prev-button" onClick={() => setCurrentPage(1)} ></button>
                <span className="tool-icon prev-last-icon-button"></span>
              </div>
              <div className="prev-button">
                <button className="prev-button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} ></button>
                <span className="tool-icon prev-icon-button"></span>
              </div>
              <span>Page {safeCurrentPage} of {totalPages}</span>
              <div className="next-button">
                <button className="next-button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} ></button>
                <span className="tool-icon next-icon-button"></span>
              </div>
              <div className="last-button">
                <button className="last-button" onClick={() => setCurrentPage(totalPages)} ></button>
                <span className="tool-icon last-icon-button"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrapper" ref={tableWrapperRef}>
          <table className="dashboard-table">
            <thead ref={theadRef}>
              <tr>
                <th className="icon-column"><strong></strong></th>
                <th><strong>Name</strong></th>
                <th><strong>Created by</strong></th>
                <th><strong>Functions</strong></th>
              </tr>
            </thead>
            <tbody>
              {filteredDashboards.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">
                    <p>No dashboards found</p>
                  </td>
                </tr>
              ) : (
                pageItems.map((dashboard, index) => (
                  <tr key={dashboard.id} className="dashboard-row" ref={index === 0 ? firstRowRef : null}>
                    <td className="icon-cell">
                      <span className="dashboard-icon"></span>
                    </td>
                    <td className="name-cell">
                      <span className="dashboard-title">
                        {dashboard.name}
                      </span>
                    </td>
                    <td className="creator-cell">
                      {dashboard.createdBy}
                    </td>
                    <td className="actions-cell">
                      <div className="dashboard-actions">
                        <button 
                          className="action-icon design"
                          onClick={() => handleDesignDashboard(dashboard.id)}
                          title="Design"
                        >
                          <span className="design-icon"></span>
                        </button>
                        <button 
                          className="action-icon edit"
                          onClick={() => handleEditDashboard(dashboard.id)}
                          title="Edit"
                        >
                          <span className="edit-icon"></span>
                        </button>
                        <button 
                          className="action-icon delete"
                          onClick={() => handleDeleteDashboard(dashboard.id)}
                          title="Delete"
                        >
                          <span className="delete-icon"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Dashboard"
        message={`Are you sure you want to delete dashboard "${dashboardToDelete ? dashboards.find(d => d.id === dashboardToDelete)?.name : ''}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmButtonText="Delete"
      />
    </div>
  );
};

export default DashboardHome; 