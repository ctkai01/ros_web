import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// import MonitoringNav from './MonitoringNav';
// import HardwareHealth from './hardware-health/HardwareHealth';
// import MissionLog from './MissionLog/MissionLog';
// import ActionLog from './ActionLog/ActionLog';
import "./System.css";
import SystemNav from "./SystemNav";
import Settings from "./Settings";
import ChargingAndStaging from "./Settings/ChargingAndStaging/ChargingAndStaging";
import CollisionAvoidance from "./Settings/CollisionAvoidance";
import DistributorData from "./Settings/DistributorData";
import DateAndTime from "./Settings/DateAndTime";
import Advanced from "./Settings/Advanced";

const System = ({ isNavOpen }) => {
  return (
    <div className={`system-container ${isNavOpen ? "nav-expanded" : ""}`}>
      <SystemNav isNavOpen={isNavOpen} />
      <div className="system-content">
        <Routes>
          <Route path="/" element={<Navigate to="settings" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="settings/charging-and-staging"
            element={<ChargingAndStaging />}
          />
          <Route
            path="settings/collision-avoidance"
            element={<CollisionAvoidance />}
          />
          <Route
            path="settings/distributor-data"
            element={<DistributorData />}
          />
          <Route
            path="settings/date-and-time"
            element={<DateAndTime />}
          />
           <Route
            path="settings/advanced"
            element={<Advanced   />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default System;
