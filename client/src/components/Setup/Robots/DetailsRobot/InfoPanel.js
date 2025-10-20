import React from "react";
import { FaPen } from "react-icons/fa";
import "./InfoPanel.css";

const InfoPanel = ({ data, handleEditRobot }) => {
  return (
    <div className="info-robot-panel">
      {data.map((item) => (
        <div className="info-robot-row" key={item.key}>
          <span className="info-robot-key">{item.key}</span>
          <div className="info-robot-value-container">
            <span className="info-robot-value">{item.value}</span>
            {/* Dùng conditional rendering để chỉ hiện nút khi editable là true */}
            {item.editable && (
              <button className="robot-edit-btn" onClick={() => handleEditRobot(item)}>
                <FaPen size={12} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InfoPanel;
