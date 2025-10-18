import React from "react";
import { FaTimes, FaPlus } from "react-icons/fa"; // Import icons
import "./RobotCard.css"; // Import file CSS

const RobotCard = ({ robot, onClose, onAddRobot }) => {
  // Nếu không có dữ liệu robot, không render gì cả
  if (!robot) {
    return null;
  }

  return (
    <div className="robot-card">
      {/* Nút X ở góc */}
      <div className="close-ribbon-wrapper" onClick={onClose}>
        <FaTimes className="close-icon" size={14} />
      </div>

      {/* Tiêu đề */}
      <h3 className="robot-title">{robot.name}</h3>

      {/* Thông tin chi tiết */}
      <div className="robot-details">
        <div className="detail-row">
          <span className="detail-key">Version:</span>
          <span className="detail-value">{robot.version}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">IP address:</span>
          <span className="detail-value">{robot.ip}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Model:</span>
          <span className="detail-value">{robot.model}</span>
        </div>
      </div>

      {/* Nút Add Robot */}
      <div className="add-robot-button-container">
        <button className="add-robot-group-btn" onClick={onAddRobot}>
          <FaPlus size={12} />
          Add robot
        </button>
      </div>
    </div>
  );
};

export default RobotCard;