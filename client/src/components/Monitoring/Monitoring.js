import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MonitoringNav from './MonitoringNav';
import HardwareHealth from './hardware-health/HardwareHealth';
import MissionLog from './MissionLog/MissionLog';
import ActionLog from './ActionLog/ActionLog';
import ErrorLog from './ErrorLog/ErrorLog';
import SystemLog from './SystemLog/SystemLog';
import SafetySystem from './SafetySystem/SafetySystem';
import Analytics from './Analytics/Analytics';
import './Monitoring.css';

const Monitoring = ({ isNavOpen }) => {
  return (
    <div className={`monitoring-container ${isNavOpen ? 'nav-expanded' : ''}`}>
      <MonitoringNav isNavOpen={isNavOpen} />
      <div className="monitoring-content">
        <Routes>
          <Route path="/" element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="system-log" element={<SystemLog />} />
          <Route path="error-logs" element={<ErrorLog />} />
          <Route path="hardware-health" element={<HardwareHealth />} />
          <Route path="safety-system" element={<SafetySystem />} />
          <Route path="mission-log" element={<MissionLog />} />
          <Route path="action-log/:missionId/:startedAt/:completedAt" element={<ActionLog />} />
        </Routes>
      </div>
    </div>
  );
};

export default Monitoring; 