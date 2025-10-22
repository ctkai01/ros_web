import React from "react";
import "./CollisionAvoidanceForm.css";

// 1. Import các thư viện
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// 2. Định nghĩa Schema (các quy tắc validation)
const schema = yup
  .object()
  .shape({
    collisionAvoidance: yup.string().oneOf(["True", "False"]).required(),
  })
  .required();

// Dữ liệu cài đặt (giữ nguyên)
const settingsData = [
  {
    id: "collisionAvoidance",
    label: "Collision Avoidance",
    description: "Select True to synchronize footprints and positions between robots for better collision avoidance",
    type: "select",
    options: ["True", "False"],
    defaultValue: "False",
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

const CollisionAvoidanceForm = ({ handleGoBackSystemSettings }) => {
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
      className="collision-avoidance-form"
      onSubmit={handleSubmit(onFormSubmit)}
    >
      {settingsData.map((item) => (
        <div className="collision-avoidance-form-setting-row" key={item.id}>
          {/* Phần bên trái: Thông tin */}
          <div className="collision-avoidance-form-setting-info">
            <label className="collision-avoidance-form-setting-label">
              {item.label}
            </label>
            <p className="collision-avoidance-form-setting-description">
              {item.description}
            </p>
            {/* 7. Hiển thị lỗi validation */}
            {errors[item.id] && (
              <span className="collision-avoidance-form-error-message">
                {errors[item.id].message}
              </span>
            )}
          </div>

          {/* Phần bên phải: Control */}
          <div className="collision-avoidance-form-setting-control">
            {/* 8. Đăng ký (register) các input */}
            {item.type === "select" ? (
              <select
                {...register(item.id)}
                className={`collision-avoidance-form-setting-select ${
                  errors[item.id] ? "collision-avoidance-form-input-error" : ""
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
                className={`collision-avoidance-form-setting-input ${
                  errors[item.id] ? "collision-avoidance-form-input-error" : ""
                }`}
              />
            )}

            <button
              type="button" // Quan trọng: để không submit form
              className="collision-avoidance-form-restore-btn"
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
          className="collision-avoidance-form-action-btn collision-avoidance-form-btn-primary"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={handleGoBackSystemSettings}
          className="collision-avoidance-form-action-btn collision-avoidance-form-btn-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CollisionAvoidanceForm;
