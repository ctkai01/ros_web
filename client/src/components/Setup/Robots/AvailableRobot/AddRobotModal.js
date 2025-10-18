import React from "react";
import "./AddRobotModal.css";

const AddRobotModal = ({ robot, onClose }) => {
  return (
    // Lớp phủ nền
    <div className="add-robot-modal modal-overlay">
      {/* Nội dung popup */}
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add robot to a group</h2>
          <p>
            Add the selected robot to a group in the fleet. Deselect Active in
            MiR Fleet if the robot should not be part of the active fleet.
          </p>
        </div>

        <div className="modal-body">
          <div className="form-groups">
            <label htmlFor="robot-group">Select a robot group</label>
            <div className="select-wrapper">
              <select id="robot-group">
                <option>Default robot group</option>
              </select>
              <button className="create-edit-btn">Create / Edit</button>
            </div>
          </div>
          <div className="form-groups checkbox-groups">
            <input type="checkbox" id="active-fleet" defaultChecked />
            <label htmlFor="active-fleet">Active in MiR Fleet</label>
          </div>
          <div className="form-groups checkbox-groups">
            <input type="checkbox" id="factory-reset" />
            <label htmlFor="factory-reset">
              Factory reset the robot before adding it to the fleet.
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-oks" onClick={onClose}>
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

export default AddRobotModal;
