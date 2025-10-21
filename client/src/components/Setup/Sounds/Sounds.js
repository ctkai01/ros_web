import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GrClear } from "react-icons/gr";
import { FaPlus, FaCloudUploadAlt } from "react-icons/fa";
import SoundList from "./SoundList";
import "./Sounds.css";

const Sounnds = () => {
  const [searchFilter, setSearchFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 1;

  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleEditClick = (id) => {
    navigate(`/setup/elevators/edit/${id}`);
  };
  const handleCreateElevator = () => {
    // Logic to create a new elevator
    navigate("/setup/elevators/create");
  };
  return (
    <div className="detail-sounds-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Sounds</h2>
          <span className="subtitle">Upload and edit sounds</span>
        </div>
        <div className="header-actions">
          <button
            className="sounds-action-btn upload-sounds-btn"
            onClick={handleCreateElevator}
          >
            <FaCloudUploadAlt />
            Upload sound
          </button>

          <button
            className="sounds-action-btn clear-filter-btn"
            onClick={handleCreateElevator}
          >
            <GrClear />
            Clear filter
          </button>
        </div>
      </div>

      <div className="sounds-private-content">
        <div className="sounds-private-filters">
          <div className="filter-input">
            <label>Filter:</label>
            <input
              type="text"
              placeholder="Write name to filter by..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            <span className="items-found">{5} item(s) found</span>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-controls">
              <div className="prev-last-button">
                <button
                  className="prev-button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                ></button>
                <span className="tool-icon prev-last-icon-button"></span>
              </div>
              <div className="prev-button">
                <button
                  className="prev-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                ></button>
                <span className="tool-icon prev-icon-button"></span>
              </div>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <div className="next-button">
                <button
                  className="next-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                ></button>
                <span className="tool-icon next-icon-button"></span>
              </div>
              <div className="last-button">
                <button
                  className="last-button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                ></button>
                <span className="tool-icon last-icon-button"></span>
              </div>
            </div>
          </div>
        </div>
        <div className="sounds-private-main-content">
          <SoundList />
        </div>
      </div>
    </div>
  );
};

export default Sounnds;
