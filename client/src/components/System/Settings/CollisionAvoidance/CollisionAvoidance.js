import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CollisionAvoidance.css";

import { FaArrowCircleLeft } from "react-icons/fa";
import CollisionAvoidanceForm from "./CollisionAvoidanceForm";

const CollisionAvoidance = () => {
  const navigate = useNavigate();

  const handleGoBackSystemSettings = () => {
    navigate("/system/settings");
  };
  return (
    <div className="detail-collision-avoidance-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Collision avoidance</h2>
          <span className="subtitle">
            Synchronize the fleet robots footprints and positions and ensure
            they do not collide
          </span>
        </div>
        <div className="header-actions">
          <button
            className="collision-avoidance-action-btn go-back-collision-avoidances-btn"
            onClick={handleGoBackSystemSettings}
          >
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="collision-avoidance-private-content">
        <div className="collision-avoidance-private-main-content">
          <CollisionAvoidanceForm handleGoBackSystemSettings={handleGoBackSystemSettings}/>
        </div>
      </div>
    </div>
  );
};

export default CollisionAvoidance;
