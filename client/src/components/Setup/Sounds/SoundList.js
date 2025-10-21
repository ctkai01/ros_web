import React from "react";
// Import các icons cần thiết
import { FaPlayCircle, FaPen, FaHeadphones, FaTimes } from "react-icons/fa";
import "./SoundList.css";
// Dữ liệu mẫu
const soundData = [
  {
    id: 1,
    name: "Beep",
    duration: "0:00:11",
    note: "",
    volume: 100,
    createdBy: "MiR",
    editable: false,
  },
  {
    id: 2,
    name: "Horn",
    duration: "0:00:07",
    note: "",
    volume: 100,
    createdBy: "MiR",
    editable: false,
  },
  {
    id: 3,
    name: "Foghorn",
    duration: "0:00:07",
    note: "",
    volume: 50,
    createdBy: "MiR",
    editable: false,
  },
  {
    id: 4,
    name: "Step aside",
    duration: "0:00:02",
    note: "",
    volume: 100,
    createdBy: "Administrator",
    editable: true,
  },
];

const SoundList = () => {
  return (
    <div className="sound-list-container">
      {/* Header */}
      <div className="sound-list-header">
        <span>Name</span>
        <span>Duration</span>
        <span>Note</span>
        <span>Volume</span>
        <span>Created by</span>
        <span>Functions</span>
      </div>

      {/* Body - Lặp qua dữ liệu */}
      {soundData.map((sound) => (
        <div className="sound-list-row" key={sound.id}>
          {/* Name */}
          <div className="sound-name">
            <FaPlayCircle className="sound-name-icon" />
            <span>{sound.name}</span>
          </div>

          {/* Các cột khác */}
          <span>{sound.duration}</span>
          <span>{sound.note}</span>
          <span>{sound.volume}</span>
          <span>{sound.createdBy}</span>

          {/* Functions */}
          <div className="sound-functions">
            {/* Hiển thị nút Edit hoặc nút Listen (Headphones) */}
            {sound.editable ? (
              <button className="function-btn">
                <FaPen size={14} />
              </button>
            ) : (
              <button className="function-btn">
                <FaHeadphones size={14} />
              </button>
            )}

            {/* Nút Listen/Headphones thứ 2 (tùy chỉnh) */}
            <button className="function-btn">
              <FaHeadphones size={14} />
            </button>

            {/* Nút Delete */}
            <button
              className={`function-btn ${sound.editable ? "btn-danger" : ""}`}
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SoundList;
