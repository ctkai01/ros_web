import React from "react";
import "./ChargingAndStagingForm.css";

// 1. Import các thư viện
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// 2. Định nghĩa Schema (các quy tắc validation)
const schema = yup
  .object()
  .shape({
    threshold: yup
      .number()
      .typeError("Must be a number")
      .positive("Must be a positive number")
      .required("This field is required"),
    autoCharging: yup.string().oneOf(["True", "False"]).required(),
    autoStaging: yup.string().oneOf(["True", "False"]).required(),
    idleTime: yup
      .number()
      .typeError("Must be a number")
      .min(0, "Time cannot be negative")
      .required("This field is required"),
    minBattery: yup
      .number()
      .typeError("Must be a number")
      .min(0, "Cannot be less than 0%")
      .max(100, "Cannot be more than 100%")
      .integer("Must be a whole number")
      .required("This field is required"),
  })
  .required();

// Dữ liệu cài đặt (giữ nguyên)
const settingsData = [
  {
    id: "threshold",
    label: "Threshold at charging position",
    description: "Distance in meters between robot and charging station",
    type: "number",
    defaultValue: 0.9,
  },
  {
    id: "autoCharging",
    label: "Auto charging",
    description: "Select True to charge the fleet robots",
    type: "select",
    options: ["True", "False"],
    defaultValue: "False",
  },
  {
    id: "autoStaging",
    label: "Auto staging",
    description: "Select True to stage the fleet robots",
    type: "select",
    options: ["True", "False"],
    defaultValue: "False",
  },
  {
    id: "idleTime",
    label: "Idle time",
    description: "Minimum of minutes robot is allowed to idle, before it is sent to charging station",
    type: "number",
    defaultValue: 0.25,
  },
  {
    id: "minBattery",
    label: "Minimum battery percentage for charging",
    description: "The lowest battery percentage a robot can have, before the fleet can send it to charge",
    type: "number",
    defaultValue: 95,
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

const ChargingAndStagingForm = () => {
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
    <form
      className="charging-and-staging-form"
      onSubmit={handleSubmit(onFormSubmit)}
    >
      {settingsData.map((item) => (
        <div className="charging-and-staging-form-setting-row" key={item.id}>
          {/* Phần bên trái: Thông tin */}
          <div className="charging-and-staging-form-setting-info">
            <label className="charging-and-staging-form-setting-label">
              {item.label}
            </label>
            <p className="charging-and-staging-form-setting-description">
              {item.description}
            </p>
            {/* 7. Hiển thị lỗi validation */}
            {errors[item.id] && (
              <span className="charging-and-staging-form-error-message">
                {errors[item.id].message}
              </span>
            )}
          </div>

          {/* Phần bên phải: Control */}
          <div className="charging-and-staging-form-setting-control">
            {/* 8. Đăng ký (register) các input */}
            {item.type === "select" ? (
              <select
                {...register(item.id)}
                className={`charging-and-staging-form-setting-select ${
                  errors[item.id] ? "charging-and-staging-form-input-error" : ""
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
                className={`charging-and-staging-form-setting-input ${
                  errors[item.id] ? "charging-and-staging-form-input-error" : ""
                }`}
              />
            )}

            <button
              type="button" // Quan trọng: để không submit form
              className="charging-and-staging-form-restore-btn"
              onClick={() => handleRestore(item.id, item.defaultValue)}
            >
              Restore default
            </button>
          </div>
        </div>
      ))}

      {/* (Tùy chọn) Thêm một nút Save ở cuối */}
      <div style={{ padding: "1.5rem", textAlign: "right" }}>
        <button
          type="submit"
          className="charging-and-staging-form-action-btn charging-and-staging-form-btn-primary"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default ChargingAndStagingForm;
