import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DistributorData.css";

import { FaArrowCircleLeft } from "react-icons/fa";
import DistributorDataForm from "./DistributorDataForm";

const DistributorData = () => {
  const navigate = useNavigate();

  const handleGoBackSystemSettings = () => {
    navigate("/system/settings");
  };
  return (
    <div className="detail-distributor-data-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Distributor Data</h2>
          <span className="subtitle">
            Edit data about the distributor selling the robot.
          </span>
        </div>
        <div className="header-actions">
          <button
            className="distributor-data-action-btn go-back-distributor-datas-btn"
            onClick={handleGoBackSystemSettings}
          >
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="distributor-data-private-content">
        <div className="distributor-data-private-main-content">
          <DistributorDataForm
            handleGoBackSystemSettings={handleGoBackSystemSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default DistributorData;
