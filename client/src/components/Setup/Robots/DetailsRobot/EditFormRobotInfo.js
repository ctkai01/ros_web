import React, { useState, useEffect } from "react";
import "./EditFormRobotInfo.css";
// Component này nhận 3 props:
// - initialValue: Dữ liệu ban đầu để hiển thị trong input.
// - onUpdate: Hàm để gọi khi người dùng click "Update".
// - onClose: Hàm để đóng modal.
const EditFormRobotInfo = ({ data, onUpdate, onClose }) => {
  // 1. Tạo state riêng để quản lý giá trị của input.
  //    Giá trị ban đầu của state này chính là dữ liệu được truyền vào.
  const [value, setValue] = useState(data.value || "");

  // useEffect(() => {
  //   console.log("Received data for editing:", data);
  //   if (data) {
  //     setValue(data.value || ""); // Cập nhật state nội bộ
  //   }
  // }, [data]);
  // Xử lý khi người dùng nhấn nút "Update"
  const handleSubmit = (e) => {
    e.preventDefault(); // Ngăn form reload trang
    onUpdate(value); // 2. Gọi hàm onUpdate của cha và gửi giá trị mới lên
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <h2 className="edit-form-title">Edit Information</h2>

      {/* 2. Label được tạo động từ `data.key` */}
      <label className="edit-form-label" htmlFor="edit-input">
        {data.key}
      </label>

      <input
        id="edit-input"
        type="text"
        className="edit-form-input"
        value={value}
        onChange={(e) => {
          console.log("Input changed to:", e.target.value);
          setValue(e.target.value);
        }}
      />

      <div className="edit-form-actions">
        <button
          type="button"
          className="edit-form-btn btn-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button type="submit" className="edit-form-btn btn-primary">
          Update
        </button>
      </div>
    </form>
  );
};

export default EditFormRobotInfo;
