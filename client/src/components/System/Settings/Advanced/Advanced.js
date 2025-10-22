import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Advanced.css";

import { FaArrowCircleLeft } from "react-icons/fa";
import AdvancedSettings from "./AdvancedSettings";

const Advanced = () => {
  const navigate = useNavigate();

  const handleGoBackSystemSettings = () => {
    navigate("/system/settings");
  };
  return (
    <div className="detail-advanced-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Advanced </h2>
          <span className="subtitle">Advanced configuration parameters</span>
        </div>
        <div className="header-actions">
          <button
            className="advanced-action-btn go-back-advanceds-btn"
            onClick={handleGoBackSystemSettings}
          >
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="advanced-private-content">
        <div className="advanced-private-main-content">
          <AdvancedSettings />
        </div>
      </div>
    </div>
  );
};

export default Advanced;
