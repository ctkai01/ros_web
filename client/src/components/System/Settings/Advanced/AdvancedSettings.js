import React from "react";
import "./AdvancedSettings.css"; // Import file CSS

const AdvancedSettings = () => {
  return (
    <div className="advanced-settings-container">
      {/* Thẻ bên trái: Restart */}
      <div className="advanced-setting-box">
        <h3>Restart fleet software</h3>
        <p>
          If something in the fleet system is not responding you can try
          restarting the fleet software.
        </p>
        <button className="advanced-action-btn advanced-btn-primary">
          Restart fleet software
        </button>
      </div>

      {/* Thẻ bên phải: Factory Reset */}
      <div className="advanced-setting-box">
        <h3>Factory reset</h3>
        <p>
          Resetting the system will completely restore the system to default
          values. Only do this if you really want to reset the system
          completely.
        </p>
        <button className="advanced-action-btn advanced-btn-danger">
          Factory reset
        </button>
      </div>
    </div>
  );
};

export default AdvancedSettings;
