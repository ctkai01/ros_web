import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DateAndTime.css";

import { FaArrowCircleLeft } from "react-icons/fa";
import DateTimeSettings from "./DateTimeSettings";

const DateAndTime = () => {
  const navigate = useNavigate();

  const handleGoBackSystemSettings = () => {
    navigate("/system/settings");
  };
  return (
    <div className="detail-date-and-time-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Date & time </h2>
          <span className="subtitle">Set date and time for the robot.</span>
        </div>
        <div className="header-actions">
          <button
            className="date-and-time-action-btn go-back-date-and-times-btn"
            onClick={handleGoBackSystemSettings}
          >
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="date-and-time-private-content">
        <div className="date-and-time-private-main-content">
          <DateTimeSettings />
        </div>
      </div>
    </div>
  );
};

export default DateAndTime;
