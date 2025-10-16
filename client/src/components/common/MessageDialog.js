import React from "react";
import "./ConfirmDialog.css"; // style tuỳ chỉnh

const MessageDialog = ({ visible, title, message, onClose }) => {
    if (!visible) return null;
  
    return (
      <div className="overlay">
        <div className="dialog">
          <div className="dialog-header">
            <h3>{title}</h3>
          </div>
          <div className="dialog-content">
            <p>{message}</p>
          </div>
          <div className="actions">
            <button onClick={onClose} className="confirm">OK</button>
          </div>
        </div>
      </div>
    );
  };
  
  export default MessageDialog;