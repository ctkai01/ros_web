import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateElevator.css";
import CreateElevatorForm from "./CreateElevatorForm";
import { FaArrowCircleLeft, FaPlus } from "react-icons/fa";

function CreateElevator() {
  const [currentPage, setCurrentPage] = useState(1);
  //   const [groupRobotData, setGroupRobotData] = useState(myRobotData);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // const widgetsRef = useRef(widgets);
  const handleEditClick = () => {
    alert("Edit button clicked!");
  };

  const handleGoBackElevator = () => {
    // Logic to create a new elevator
    navigate("/setup/elevators");
  };

  return (
    <div className="detail-elevator-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Create elevator</h2>
          <span className="subtitle">Create a new elevators</span>
        </div>
        <div className="header-actions">
          <button
            className="elevator-action-btn go-back-elevator-btn"
            onClick={handleGoBackElevator}
          >
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="elevators-private-content">
        <div className="elevators-private-main-content">
          <CreateElevatorForm />
        </div>
      </div>
    </div>
  );
}

export default CreateElevator;
