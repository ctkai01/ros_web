import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChargingAndStaging.css";

import { FaArrowCircleLeft } from "react-icons/fa";
import ChargingAndStagingForm from "./ChargingAndStagingForm";

const ChargingAndStaging = () => {
  const navigate = useNavigate();

  const handleGoBackSystemSettings = () => {
    navigate("/system/settings");
  };
  return (
    <div className="detail-charging-and-staging-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Charging and staging</h2>
          <span className="subtitle">Charging and staging</span>
        </div>
        <div className="header-actions">
          <button
            className="charging-and-staging-action-btn go-back-charging-and-stagings-btn"
            onClick={handleGoBackSystemSettings}
          >
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="charging-and-staging-private-content">
        <div className="charging-and-staging-private-main-content">
          <ChargingAndStagingForm/>
        </div>
      </div>
    </div>
  );
};

export default ChargingAndStaging;
