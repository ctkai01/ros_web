import React from "react";
import { FaInfoCircle, FaCheck } from "react-icons/fa";
import "./CreateElevatorForm.css"; // Giữ nguyên file CSS của bạn

// 1. Import các thư viện cần thiết
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// 2. Định nghĩa Schema (các quy tắc validation)
const schema = yup
  .object()
  .shape({
    name: yup
      .string()
      .required("Vui lòng nhập tên")
      .min(3, "Tên phải có ít nhất 3 ký tự"),
    ip: yup
      .string()
      .required("Vui lòng nhập địa chỉ IP")
      .matches(/(\d{1,3}\.){3}\d{1,3}/, "Định dạng IP không hợp lệ"),
    turnInPlace: yup.string().required(),
    active: yup.string().required(),
  })
  .required();

const CreateElevatorForm = () => {
  // 3. Xóa bỏ useState, thay bằng useForm
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema), // Kết nối với Yup
    defaultValues: {
      // Đặt giá trị mặc định tại đây
      name: "",
      ip: "",
      turnInPlace: "Yes",
      active: "Yes",
    },
  });

  // 4. Hàm này sẽ chỉ được gọi khi form đã hợp lệ
  const onFormSubmit = (data) => {
    // `data` là object chứa dữ liệu form đã được xác thực
    alert("Form hợp lệ, đang gửi đi:\n" + JSON.stringify(data, null, 2));
  };

  

  return (
    // 5. Thay đổi onSubmit để gọi hàm của react-hook-form
    <form
      className="create-elevator-form"
      onSubmit={handleSubmit(onFormSubmit)}
    >
      {/* Hàng 1: Name */}
      <div className="form-group">
        <label htmlFor="name">
          Name <FaInfoCircle size={12} />{" "}
          {/* Đã xóa 'color="#888"' để CSS xử lý */}
        </label>
        <input
          type="text"
          id="name"
          placeholder="Enter name"
          // 6. Dùng 'register' thay vì 'value' và 'onChange'
          {...register("name")}
          // 7. Tự động thêm class lỗi nếu có
          className={`form-input ${errors.name ? "input-error" : ""}`}
        />
        {/* 8. Hiển thị thông báo lỗi */}
        {errors.name && (
          <span className="error-message">{errors.name.message}</span>
        )}
      </div>

      {/* Hàng 2: IP Address */}
      <div className="form-group">
        <label htmlFor="ip">
          IP address <FaInfoCircle size={12} />
        </label>
        <input
          type="text"
          id="ip"
          placeholder="Enter ip"
          {...register("ip")}
          className={`form-input ${errors.ip ? "input-error" : ""}`}
        />
        {errors.ip && (
          <span className="error-message">{errors.ip.message}</span>
        )}
      </div>

      {/* Hàng 3: Hai cột */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="turnInPlace">
            Turn in place <FaInfoCircle size={12} />
          </label>
          <select
            id="turnInPlace"
            className="form-select"
            {...register("turnInPlace")}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="active">
            Active <FaInfoCircle size={12} />
          </label>
          <select id="active" className="form-select" {...register("active")}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      {/* Hàng 4: Nút Submit */}
      <button type="submit" className="create-btn">
        <FaCheck />
        Create elevator
      </button>
    </form>
  );
};

export default CreateElevatorForm;
