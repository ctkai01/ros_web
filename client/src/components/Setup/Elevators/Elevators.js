import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Elevators.css";

import { FaPlus } from "react-icons/fa";
import ElevatorItem from "./ElevatorItem";
import CreateElevator from "./CreateElevator";
import Modal from "../../common/Modal";

const elevatorData = [
  {
    id: 1,
    title: "Test",
    status: "Inactive",
    ip: "192.168.17.106",
    connected: "Disconnected",
    hasControl: "False",
    door1: "Closed",
    door2: "Closed",
    floor: 0,
  },
  {
    id: 2,
    title: "Elevator A",
    status: "Active",
    ip: "192.168.17.107",
    connected: "Connected",
    hasControl: "True",
    door1: "Closed",
    door2: "Closed",
    floor: 0,
  },
];

const Elevators = () => {
  const [currentPage, setCurrentPage] = useState(1);
  //   const [groupRobotData, setGroupRobotData] = useState(myRobotData);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // const widgetsRef = useRef(widgets);

  const handleEditClick = (id) => {
    navigate(`/setup/elevators/edit/${id}`);
  };
  const handleCreateElevator = () => {
    // Logic to create a new elevator
    navigate("/setup/elevators/create");
  };
  return (
    <div className="detail-elevator-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Elevators</h2>
          <span className="subtitle">Create and edit elevators</span>
        </div>
        <div className="header-actions">
          <button
            className="elevator-action-btn add-elevators-btn"
            onClick={handleCreateElevator}
          >
            <FaPlus />
            Create elevator
          </button>
        </div>
      </div>

      <div className="elevators-private-content">
        <div className="elevators-private-main-content">
          <div className="elevator-list">
            {elevatorData.map((elevator, index) => {
              return (
                <ElevatorItem
                  key={index}
                  data={elevator}
                  onEdit={() => handleEditClick(elevator.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Elevators;
