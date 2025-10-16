import React from 'react';
import '../common/ActionSettings.css';

const TryCatchSettings = ({ action, panelId, onClose, onSave }) => {
  const handleRemove = (e) => {
    e.preventDefault();
    onSave(action, true);
    onClose();
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h3>Try/Catch</h3>
      </div>
      <form className="settings-form">
        <div className="settings-section">
          <div className="settings-fields-grid">
                         <div className="setting-field">
               <p style={{ color: '#666' }}>
                 Try/Catch action does not require any configuration parameters.
                 <br />
                 Use the Try block for actions that might fail, and the Catch block for error handling.
               </p>
             </div>
          </div>
        </div>

        <div className="form-actions-vertical">
          <button 
            type="button" 
            className="validate-button"
            onClick={onClose}
          >
            Close
          </button>
          <button 
            type="button" 
            className="remove-button"
            onClick={handleRemove}
          >
            Remove action
          </button>
        </div>
      </form>
    </div>
  );
};

export default TryCatchSettings;
