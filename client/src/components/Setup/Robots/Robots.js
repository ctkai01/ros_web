import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Robots.css";
import ConfirmDialog from "../../common/ConfirmDialog";
import MessageDialog from "../../common/MessageDialog";
import { FaWifi, FaPlus } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import AvailableRobotList from "./AvailableRobot/AvailableRobotList";
import GroupRobotList from "./GroupRobot";
import AddManuallyRobotModal from "./AddManuallyRobotModal";

const Robots = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageData, setMessageData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpenAddManually, setIsModalOpenAddManually] = useState(false);

  const [error, setError] = useState(null);
  const [confirmData, setConfirmData] = useState({});
  const [loading, setLoading] = useState(true);
  const totalPages = 1;
  const navigate = useNavigate();

  const handleScheduleMission = () => {
    navigate("create");
  };

  const handleEditScheduleMission = (id) => {
    console.log("Edit schedule with ID:", id);
    navigate(`/setup/schedule/edit/${id}`);
  };

  const handleAddRobotManually = () => {
    console.log("Add robot manually clicked");
    setIsModalOpenAddManually(true);
  };

  const handleApplyAddRobotManually = () => {
    console.log("Apply add robot manually clicked");
    setIsModalOpenAddManually(false);
  };

  const handleCloseModalAddRobotManually = () => {
    setIsModalOpenAddManually(false);
  }

  

  return (
    <div className="robots-private-container">
      {isModalOpenAddManually && (
        <AddManuallyRobotModal
          onApply={handleApplyAddRobotManually}
          onClose={handleCloseModalAddRobotManually}
        />
      )}
      <div className="page-header">
        <div className="header-title">
          <h2>Robots</h2>
          <span className="subtitle">Add and edit robot for the fleet</span>
        </div>
        <div className="header-actions">
          <button className="robot-action-btn scan-robot-btn">
            <FaWifi />
            Scan for robot
          </button>
          <button
            onClick={handleAddRobotManually}
            className="robot-action-btn add-robot-btn"
          >
            <FaPlus />
            Add robot manually
          </button>
          <button className="robot-action-btn scan-ranges-btn">
            <IoIosSettings />
            Scan ranges
          </button>
          <button className="robot-action-btn robot-group-btn">
            <IoIosSettings />
            Robot group
          </button>
        </div>
      </div>

      <div className="robots-private-content">
        <div className="robots-private-filters">
          <div className="robots-private-filter-dropdown">
            <span>Group:</span>
            <select
              //   value={selectedFilter}
              //   onChange={handleFilterChange}
              //   onKeyDown={handleKeyDown}
              className="robots-private-select"
            >
              <option value="all">All</option>
              <option value="rb-1">Robot Group 1</option>
              <option value="rb-2">Robot Group 2</option>
              <option value="rb-3">Robot Group 3</option>
            </select>
          </div>

          <div className="robots-private-filter-dropdown">
            <span>Status:</span>
            <select
              //   value={selectedFilter}
              //   onChange={handleFilterChange}
              //   onKeyDown={handleKeyDown}
              className="schedule-private-select"
            >
              <option value="all">Show all</option>
              <option value="inactive">INACTIVE</option>
              <option value="active">ACTIVE</option>
              <option value="pending">PENDING</option>
            </select>
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
        <div className="robots-private-main-content">
          <AvailableRobotList />
          <GroupRobotList />
        </div>
      </div>

      <ConfirmDialog
        visible={showConfirm}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onCancel={() => setShowConfirm(false)}
        isDelete={confirmData.title?.toLowerCase().includes("delete")}
      />
      <MessageDialog
        visible={showMessage}
        title={messageData.title}
        message={messageData.message}
        onClose={() => setShowMessage(false)}
      />
    </div>
  );
};

export default Robots;
