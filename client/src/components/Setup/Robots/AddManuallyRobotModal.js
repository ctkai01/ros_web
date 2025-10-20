import React from "react";
import "./AddManuallyRobotModal.css";

const AddManuallyRobotModal = ({ onApply, onClose }) => {
  return (
    <div className="add-robot-modal modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add robot manually</h2>
          <p>
            Add a robot manually by entering the robot's IP-address and select a
            robot group it should belong to. Deselect Active in MiRFleet, if the
            robot should not be part of the active fleet.
          </p>
        </div>

        <div className="modal-body">
          {/* --- SỬA ĐỔI BẮT ĐẦU TỪ ĐÂY --- */}

          {/* 1. Thêm input cho IP */}
          <div className="form-group">
            <label htmlFor="robot-ip">Robot's IP address:</label>
            <input type="text" id="robot-ip" />
          </div>

          {/* 2. Sửa lại nhóm Select */}
          <div className="form-group">
            <label htmlFor="robot-group">Select a robot group:</label>
            <div className="select-wrapper">
              <select id="robot-group">
                <option>Default robot group</option>
              </select>
              <button className="create-edit-btn">Create / Edit</button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ok" onClick={onApply}>
            OK
          </button>
          <button className="btn-cancels" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddManuallyRobotModal;
