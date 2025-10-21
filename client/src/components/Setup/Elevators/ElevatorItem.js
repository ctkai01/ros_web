import React from "react";
import { FaPen } from "react-icons/fa"; // Import icon cây bút
import "./ElevatorItem.css";





const ElevatorItem = ({ data, onEdit }) => {
  // Hàm này giúp lấy class màu dựa trên trạng thái
  const getStatusClass = (status) => {
    if (status === "Inactive") return "status-inactive";
    if (status === "Active") return "status-active";
    // Thêm các trạng thái khác nếu muốn
    return "";
  };

  return (
    <div className="status-card">
      {/* Header */}
      <div className="card-header">
        <div className="header-left-elevator">
          <span className="card-title">{data.title}</span>
          <span className={`card-status ${getStatusClass(data.status)}`}>
            {data.status}
          </span>
        </div>
        <button className="edit-button" onClick={onEdit}>
          <FaPen size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="info-row">
          <span className="info-key-elevator">IP Address:</span>
          <span className="info-value-elevator">{data.ip}</span>
        </div>
        <div className="info-row">
          <span className="info-key-elevator">Connected:</span>
          <span className="info-value-elevator">{data.connected}</span>
        </div>
        <div className="info-row">
          <span className="info-key-elevator">Has control:</span>
          <span className="info-value-elevator">{data.hasControl}</span>
        </div>
        <div className="info-row">
          <span className="info-key-elevator">Door 1 open:</span>
          <span className="info-value-elevator">{data.door1}</span>
        </div>
        <div className="info-row">
          <span className="info-key-elevator">Door 2 open:</span>
          <span className="info-value-elevator">{data.door2}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="card-footer">Current floor: {data.floor}</div>
    </div>
  );
};

export default ElevatorItem;
