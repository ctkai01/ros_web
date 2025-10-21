import React from "react";
import { FaTimes } from "react-icons/fa";
import "./Modal.css"; // File CSS để tạo kiểu

const Modal = ({ isOpen, onClose, children }) => {
  // Nếu modal không mở, không render gì cả
  if (!isOpen) {
    return null;
  }

  return (
    // Lớp phủ nền tối, khi click sẽ đóng modal
    <div className="modal-overlay-common" onClick={onClose}>
      {/* Nội dung modal, ngăn sự kiện click lan ra lớp phủ 
        để tránh modal bị đóng khi click vào bên trong
      */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng ở góc */}
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Đây là nơi nội dung tùy chỉnh sẽ được render */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
