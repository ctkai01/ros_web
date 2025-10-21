import React from "react";
import "./DeleteConfirmation.css"; // File CSS đi kèm

const DeleteConfirmation = ({ onClose, onConfirm, elevatorName }) => {
  return (
    // Thẻ div này tạo ra hộp thoại màu đen/xám
    <div className="delete-elevator-confirmation-box">
      {/* Dải header màu đỏ */}

      {/* Body chứa nội dung text */}
      <div className="delete-body">
        <h2 className="delete-title">Delete {elevatorName || "elevator"}?</h2>
        <p className="delete-text">
          Are you sure you want to delete this elevator?
        </p>
      </div>

      {/* Footer chứa các nút */}
      <div className="delete-footer">
        <button onClick={onConfirm} className="modal-btn btn-danger">
          Delete
        </button>
        <button onClick={onClose} className="modal-btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
