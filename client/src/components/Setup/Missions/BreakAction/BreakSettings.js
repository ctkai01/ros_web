import React from 'react';

const BreakSettings = ({ action, panelId, onClose, onSave }) => {
  const handleValidate = (e) => {
    e.preventDefault();
    onSave(action);
    onClose();
  };

  const handleRemove = (e) => {
    e.preventDefault();
    onSave(action, true);
    onClose();
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h3>Break</h3>
      </div>
      <form className="settings-form">
        <div className="form-group">
          <label>Description</label>
          <div className="static-description">
            This action exits the nearest enclosing loop immediately and continues after the loop.
          </div>
        </div>
        <div className="form-actions-vertical">
          <button type="button" className="validate-button" onClick={handleValidate}>
            Validate and close
          </button>
          <button type="button" className="remove-button" onClick={handleRemove}>
            Remove action
          </button>
        </div>
      </form>
    </div>
  );
};

export default BreakSettings;


