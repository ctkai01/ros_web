import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardNav from './DashboardNav';
import DashboardHome from './DashboardHome';
import DashboardSelector from './DashboardSelector';
import CreateDashboard from './CreateDashboard';
import EditDashboard from './EditDashboard';
import DesignDashboard from './DesignDashboard/DesignDashboard';
import ViewDashboard from './ViewDashboard';
import './Dashboard.css';

// Placeholder components for dashboard sections
const Templates = () => <div>Templates Content</div>;
const Widgets = () => <div>Widgets Content</div>;
const Settings = () => <div>Settings Content</div>;

const Dashboard = ({ isNavOpen }) => {
  return (
    <div className={`dashboard-container ${isNavOpen ? 'nav-expanded' : ''}`}>
      <DashboardNav isNavOpen={isNavOpen} />
      <div className="dashboard-content">
        <Routes>
          <Route path="/list" element={<DashboardHome />} />
          <Route path="/create" element={<CreateDashboard />} />
          <Route path="/edit/:id" element={<EditDashboard />} />
          <Route path="/view/:id" element={<ViewDashboard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/widgets" element={<Widgets />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/design/:id" element={<DesignDashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard; 