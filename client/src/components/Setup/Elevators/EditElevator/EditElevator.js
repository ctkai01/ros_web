import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditElevator.css";
import { FaArrowCircleLeft, FaPlus } from "react-icons/fa";
import { RiCloseLargeFill } from "react-icons/ri";
import UpdateElevatorForm from "./UpdateElevatorForm";
import Modal from "../../../common/Modal";
import DeleteConfirmation from "./DeleteConfirmation";

function EditElevator() {
  const [isOpenDeleteElevatorModal, setIsOpenDeleteElevatorModal] = useState(false)
  //   const [groupRobotData, setGroupRobotData] = useState(myRobotData);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // const widgetsRef = useRef(widgets);


  const handleGoBackElevator = () => {
    // Logic to create a new elevator
    navigate("/setup/elevators");
  };

  const handleOpenDeleteElevatorModal = () => {
    setIsOpenDeleteElevatorModal(true)
  }

  const handleDeleteElevator = () => {
    // Logic to delete the elevator
    alert("Elevator deleted!");
    setIsOpenDeleteElevatorModal(false)
    navigate("/setup/elevators");
  }

  return (
    <div className="detail-elevator-private-container">
      <Modal isOpen={isOpenDeleteElevatorModal} onClose={() => setIsOpenDeleteElevatorModal(false)}   >
        <DeleteConfirmation onClose={() => setIsOpenDeleteElevatorModal(false)} onConfirm={handleDeleteElevator} />
      </Modal>
      <div className="page-header">
        <div className="header-title">
          <h2>Edit elevator</h2>
          <span className="subtitle">Edit an existing elevator</span>
        </div>
        <div className="header-actions">
          <button
            className="elevator-action-btn delete-elevator-btn"
            onClick={handleOpenDeleteElevatorModal}
          >
            <RiCloseLargeFill />
            Delete
          </button>
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
          {/* <EditElevatorForm /> */}
          <UpdateElevatorForm />
        </div>
      </div>
    </div>
  );
}

export default EditElevator;
