import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditSound.css";

import { FaArrowCircleLeft, FaPlus } from "react-icons/fa";
import EditSoundForm from "./EditSoundForm";

const EditSound = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleGoBackEditSounds = () => {
    // Logic to create a new elevator
    navigate("/setup/sounds");
  };
  return (
    <div className="detail-edit-sound-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Edit sound</h2>
          <span className="subtitle">Edit data of an existing sound.</span>
        </div>
        <div className="header-actions">
          <button
            className="edit-sound-action-btn go-back-edit-sounds-btn"
            onClick={handleGoBackEditSounds}
          >
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="edit-sound-private-content">
        <div className="edit-sound-private-main-content">
          {/* <div className="elevator-list">ok</div> */}
          <EditSoundForm />
        </div>
      </div>
    </div>
  );
};

export default EditSound;
