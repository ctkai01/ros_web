import React from "react";
import "./DistributorDataForm.css";

// 1. Import các thư viện
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// 2. Định nghĩa Schema (các quy tắc validation)
const schema = yup
  .object()
  .shape({
    address: yup.string().required("Address is required"),

    city: yup.string().required("City is required"),

    country: yup.string().required("Country is required"),

    email: yup
      .string()
      .email("Must be a valid email address")
      .required("Email is required"),

    name: yup
      .string()
      .required("Name is required")
      .min(3, "Name must be at least 3 characters"),

    phoneNumber: yup
      .string()
      .required("Phone number is required")
      .matches(/^[0-9+-\s()]*$/, "Must be a valid phone number") // Cho phép số, dấu +, -, ( ), và khoảng trắng
      .min(7, "Phone number seems too short"),
  })
  .required();

// Dữ liệu cài đặt (giữ nguyên)
const settingsData = [
  {
    id: "address",
    label: "Address",
    type: "text",
    description: "Enter the distributor's street address...",
    defaultValue: "",
  },
  {
    id: "city",
    label: "City",
    type: "text",
    description: "Enter the distributor's city...",
    defaultValue: "",
  },
  {
    id: "country",
    label: "Country",
    type: "text",
    description: "Enter the distributor's country...",
    defaultValue: "",
  },
  {
    id: "email",
    label: "Email",
    type: "email",
    description: "Enter the distributor's email address...",
    defaultValue: "",
  },
  {
    id: "name",
    label: "Name",
    type: "text",
    description: "Enter the distributor's name...",
    defaultValue: "",
  },
  {
    id: "phoneNumber",
    label: "Phone number",
    type: "tel",
    description: "Enter the distributor's phone number...",
    defaultValue: "",
  },
];

// Helper để tạo giá trị mặc định
const getDefaultValues = () => {
  const defaultValues = {};
  settingsData.forEach((item) => {
    defaultValues[item.id] = item.defaultValue;
  });
  return defaultValues;
};

const DistributorDataForm = ({ handleGoBackSystemSettings }) => {
  // 3. Khởi tạo useForm
  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: getDefaultValues(),
  });

  // 4. Hàm này sẽ được gọi khi form hợp lệ
  const onFormSubmit = (data) => {
    alert("Form hợp lệ! Đang lưu...\n" + JSON.stringify(data, null, 2));
    // Ở đây bạn sẽ gọi API để lưu `data`
  };

  // 5. Hàm xử lý "Restore"
  const handleRestore = (id, defaultValue) => {
    // Dùng hàm resetField của react-hook-form
    resetField(id, { defaultValue: defaultValue });
  };

  return (
    // 6. Thay <div> bằng <form>
    // 
    <form
      className="distributor-data-form"
      onSubmit={handleSubmit(onFormSubmit)}
    >
      {settingsData.map((item) => (
        <div className="distributor-data-form-setting-row" key={item.id}>
          {/* Phần bên trái: Thông tin */}
          <div className="distributor-data-form-setting-info">
            <label className="distributor-data-form-setting-label">
              {item.label}
            </label>
            <p className="distributor-data-form-setting-description">
              {item.description}
            </p>
            {/* 7. Hiển thị lỗi validation */}
            {errors[item.id] && (
              <span className="distributor-data-form-error-message">
                {errors[item.id].message}
              </span>
            )}
          </div>

          {/* Phần bên phải: Control */}
          <div className="distributor-data-form-setting-control">
            {/* 8. Đăng ký (register) các input */}
            {item.type === "select" ? (
              <select
                {...register(item.id)}
                className={`distributor-data-form-setting-select ${
                  errors[item.id] ? "distributor-data-form-input-error" : ""
                }`}
              >
                {item.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={item.type}
                {...register(item.id)}
                step="0.01"
                className={`distributor-data-form-setting-input ${
                  errors[item.id] ? "distributor-data-form-input-error" : ""
                }`}
              />
            )}

            <button
              type="button" // Quan trọng: để không submit form
              className="distributor-data-form-restore-btn"
              onClick={() => handleRestore(item.id, item.defaultValue)}
            >
              Restore default
            </button>
          </div>
        </div>
      ))}

      {/* (Tùy chọn) Thêm một nút Save ở cuối */}
      <div
        style={{
          padding: "1.5rem",
          textAlign: "right",
          display: "flex",
          gap: "1rem",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="submit"
          className="distributor-data-form-action-btn distributor-data-form-btn-primary"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={handleGoBackSystemSettings}
          className="distributor-data-form-action-btn distributor-data-form-btn-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DistributorDataForm;
