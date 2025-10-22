import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  FaInfoCircle,
  FaCheck,
  FaPlay,
  FaHeadphones,
  FaTimes,
  FaBan,
} from "react-icons/fa";
import "./EditSoundForm.css";

// 1. Định nghĩa Schema (các quy tắc validation)
const schema = yup
  .object()
  .shape({
    name: yup.string().required("Name is required"),
    volume: yup
      .number()
      .typeError("Volume must be a number") // Báo lỗi nếu nhập chữ
      .required("Volume is required")
      .min(0, "Min volume is 0")
      .max(100, "Max volume is 100")
      .integer("Must be a whole number"),
    note: yup.string(), // Không bắt buộc
  })
  .required();

const EditSoundForm = () => {
  // 2. Khởi tạo useForm
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    // Giá trị mặc định cho form
    defaultValues: {
      name: "Step aside",
      volume: 100,
      note: "",
    },
  });

  // 3. Hàm này sẽ chỉ được gọi khi form đã hợp lệ
  const onSave = (data) => {
    alert("Saving changes:\n" + JSON.stringify(data, null, 2));
  };

  // Các hàm xử lý cho các nút khác (ví dụ)
  const onPlayOnRobot = () => alert("Playing on robot...");
  const onListen = () => alert("Listening...");
  const onDelete = () => alert("Deleting...");
  const onCancel = () => alert("Cancelling...");

  return (
    // 4. Bọc hàm onSave bằng `handleSubmit`
    <form className="edit-sound-form" onSubmit={handleSubmit(onSave)}>
      {/* Hàng 1: Name */}
      <div className="form-group">
        <label htmlFor="name">
          Name <FaInfoCircle size={12} />
        </label>
        <input
          type="text"
          id="name"
          {...register("name")}
          className={`form-input ${errors.name ? "input-error" : ""}`}
        />
        {errors.name && (
          <span className="error-message">{errors.name.message}</span>
        )}
      </div>

      {/* Hàng 2: Hai cột */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="volume">
            Volume (0 – 100) <FaInfoCircle size={12} />
          </label>
          <input
            type="number"
            id="volume"
            {...register("volume")}
            className={`form-input ${errors.volume ? "input-error" : ""}`}
          />
          {errors.volume && (
            <span className="error-message">{errors.volume.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="note">
            Note <FaInfoCircle size={12} />
          </label>
          <input
            type="text"
            id="note"
            placeholder="Enter a note about the sound..."
            {...register("note")}
            className={`form-input ${errors.note ? "input-error" : ""}`}
          />
        </div>
      </div>

      {/* Hàng 3: Các nút bấm */}
      <div className="form-edit-sound-actions">
        <button
          type="submit"
          className="edit-sound-action-btn edit-sound-btn-primary"
        >
          <FaCheck />
          Save changes
        </button>
        <button
          type="button"
          className="edit-sound-action-btn edit-sound-btn-secondary"
          onClick={onPlayOnRobot}
        >
          <FaPlay />
          Play on robot
        </button>
        <button
          type="button"
          className="edit-sound-action-btn edit-sound-btn-secondary"
          onClick={onListen}
        >
          <FaHeadphones />
          Listen
        </button>
        <button
          type="button"
          className="edit-sound-action-btn edit-sound-btn-danger"
          onClick={onDelete}
        >
          <FaTimes />
          Delete
        </button>
        <button
          type="button"
          className="edit-sound-action-btn edit-sound-btn-secondary"
          onClick={onCancel}
        >
          <FaBan />
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditSoundForm;
