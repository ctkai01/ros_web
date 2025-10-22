import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

import { FaPlus } from "react-icons/fa";
import SettingsGrid from "./SettingsGrid";

const Settings = () => {
  const navigate = useNavigate();


  const handleNavigateSetting = (url) => {
    navigate(url);
  };
  return (
    <div className="detail-settings-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Settings</h2>
          <span className="subtitle">
            What and edit settings for the robot?
          </span>
        </div>
      </div>

      <div className="settings-private-content">
        <div className="settings-private-main-content">
          <SettingsGrid handleNavigateSetting={handleNavigateSetting}/>
        </div>
      </div>
    </div>
  );
};

export default Settings;
