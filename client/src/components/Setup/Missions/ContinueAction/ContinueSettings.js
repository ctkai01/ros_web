import React from 'react';

const ContinueSettings = ({ action, panelId, onClose, onSave }) => {
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
        <h3>Continue</h3>
      </div>
      <form className="settings-form">
        <div className="form-group">
          <label>Description</label>
          <div className="static-description">
            This action skips to the next iteration of the nearest enclosing loop.
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

export default ContinueSettings;


