import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./UploadSoundForm.css"; // File CSS đi kèm

// Component này nhận 2 prop từ cha:
// - onClose: Hàm để đóng modal (do cha quản lý)
// - onUpload: Hàm để gửi dữ liệu đã nhập lên cha
const UploadSoundForm = ({ onClose, onUpload }) => {
  // State nội bộ để quản lý form
  const [selectedFile, setSelectedFile] = useState(null);
  const [soundName, setSoundName] = useState("");
  const [volume, setVolume] = useState(100);
  const [note, setNote] = useState("");

  // Xử lý khi người dùng chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Tự động điền tên file (bỏ phần mở rộng) vào ô "Name"
      setSoundName(file.name.split(".").slice(0, -1).join("."));
    }
  };

  // Kích hoạt input file khi click vào vùng "dropzone"
  const triggerFileInput = () => {
    document.getElementById("file-input").click();
  };

  // Xử lý khi nhấn nút Upload
  const handleSubmit = () => {
    if (!selectedFile || !soundName) {
      alert("Vui lòng chọn file và nhập tên.");
      return;
    }
    // Gửi dữ liệu lên component cha
    onUpload({
      file: selectedFile,
      name: soundName,
      volume,
      note,
    });
  };

  return (
    // Thẻ div này là nội dung chính của modal
    <div className="upload-form-content">
      <div className="upload-form-header">
        <h2 className="upload-form-title">Upload sound</h2>
        <button onClick={onClose} className="modal-close-btn">
          <FaTimes />
        </button>
      </div>

      <div className="upload-form-body">
        <div className="form-group">
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            accept="audio/*" // Chỉ chấp nhận file âm thanh
          />
          {/* Vùng "dropzone" giả */}
          <div className="file-input-wrapper" onClick={triggerFileInput}>
            <span>Click or drag file to this area to upload</span>
          </div>
          {selectedFile && (
            <div className="file-name-display">
              Selected file: {selectedFile.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="sound-name">Name</label>
          <input
            type="text"
            id="sound-name"
            className="form-input"
            value={soundName}
            onChange={(e) => setSoundName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sound-volume">Volume</label>
          <input
            type="number"
            id="sound-volume"
            className="form-input"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            min="0"
            max="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sound-note">Note</label>
          <input
            type="text"
            id="sound-note"
            className="form-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="upload-form-footer">
        <button onClick={onClose} className="upload-btn btn-secondary">
          Cancel
        </button>
        <button onClick={handleSubmit} className="upload-btn btn-primary">
          Upload
        </button>
      </div>
    </div>
  );
};

export default UploadSoundForm;
