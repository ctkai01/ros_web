import React from "react";
import { FaTimes, FaPlus, FaCheck } from "react-icons/fa"; // Import icons
import { IoMdArrowDropright } from "react-icons/io";
import "./RobotCard.css"; // Import file CSS

const RobotCard = ({ robot, onShowInfo }) => {
  // Nếu không có dữ liệu robot, không render gì cả
  if (!robot) {
    return null;
  }

  return (
    <div className="robot-card">
      <div className="check-ribbon-wrapper">
        <FaCheck className="close-icon" size={14} />
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
        <div className="detail-row">
          <span className="detail-key">Fleet state:</span>
          <span className="detail-value">{robot.fleetState}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">State:</span>
          <span className="detail-value">{robot.state}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Battery:</span>
          <span className="detail-value">{robot.battery}</span>
        </div>
      </div>

      {/* Nút Add Robot */}
      <div className="info-robot-button-container">
        <button className="info-robot-group-btn" onClick={onShowInfo}>
          <IoMdArrowDropright size={16} />
          Show info
        </button>
      </div>
    </div>
  );
};

export default RobotCard;
