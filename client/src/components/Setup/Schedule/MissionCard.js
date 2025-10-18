import React from "react";
// Import các icon cần thiết từ thư viện
import { FaArrowsAlt, FaPen, FaTimes, FaChevronDown } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import "./Schedule.css";

const ScheduleCard = ({ schedule, handleEditScheduleMission }) => {
  // console.log("Schedule data:", schedule);
  const handleEdit = () => {
    // Xử lý sự kiện chỉnh sửa lịch trình ở đây
    console.log("Edit schedule:", schedule);
    handleEditScheduleMission(schedule.id);
  };
  return (
    <div className="schedule-card-wrapper">
      <div className="timeline-hour">{schedule.time}</div>
      <div className="schedule-card-container">
        <div className="box-arrows">
          <FaArrowsAlt />
        </div>
        <div className="schedule-card">
          {/* Header */}
          <div className="schedule-header">
            <div className="schedule-title">
              {/* <FaArrowsAlt /> */}
              <span>{schedule.title}</span>
            </div>
            <div className="schedule-actions">
              <FaChevronDown color="#dcdcdc" />
              <FaPen onClick={handleEdit} color="#dcdcdc" />
              <FaTimes color="#dcdcdc" />
            </div>
          </div>

          {/* Body */}
          <div className="schedule-body">
            <div className="info-item">
              <span className="info-key">Queued by:</span>
              <span className="info-value">{schedule.queuedBy}</span>
            </div>
            <div className="info-item">
              <span
                style={{
                  color: "#dcdcdc !important",
                  display: "flex",
                  alignItems: "center",
                }}
                className="info-value"
              >
                <IoMdClose color="#5d9cec" fontSize={22} />
                Qualified robots:
              </span>
              <span className="info-key" style={{ color: "#5d9cec" }}>
                {schedule.qualifiedRobots || "None"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-key">Queued time:</span>
              <span className="info-value">{schedule.queuedTime}</span>
            </div>
            <div className="info-item">{/* Trống để giữ layout */}</div>
            <div className="info-item">
              <span className="info-key">Mission group:</span>
              <span className="info-value">
                {schedule.missionGroup || "No mission group"}
              </span>
            </div>
            <div className="info-item">{/* Trống để giữ layout */}</div>
            <div className="info-item">
              <span className="info-key">Priority:</span>
              <span className="info-value">
                {schedule.priority || "Normal"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;
