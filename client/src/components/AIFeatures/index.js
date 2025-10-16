import React from "react";
import AIFeaturesNav from "./AIFeaturesNav";
import { Routes, Route, Navigate } from "react-router-dom";
// import MonitoringNav from './MonitoringNav';
// import HardwareHealth from './hardware-health/HardwareHealth';
// import MissionLog from './MissionLog/MissionLog';
// import ActionLog from './ActionLog/ActionLog';
// import ErrorLog from './ErrorLog/ErrorLog';
// import SystemLog from './SystemLog/SystemLog';
// import SafetySystem from './SafetySystem/SafetySystem';
// import Analytics from './Analytics/Analytics';
import "./AIFeatures.css";
import FollowMe from "./FollowMe";

const AIFeatures = ({ isNavOpen }) => {
  return (
    <div className={`ai-features-container ${isNavOpen ? "nav-expanded" : ""}`}>
      <AIFeaturesNav isNavOpen={isNavOpen} />
      <div className="ai-features-content">
        <Routes>
          <Route path="/" element={<Navigate to="follow-me" replace />} />
          <Route path="follow-me" element={<FollowMe />} />
        </Routes>
      </div>
    </div>
  );
};

export default AIFeatures;
