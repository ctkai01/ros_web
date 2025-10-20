import React, { useState } from "react"; // 1. Import useState
import "./GroupRobotList.css";
import RobotCard from "./RobotCard";


function GroupRobotList({ groupRobot , handleViewDetailsRobot }) {
  // 3. Tạo state để quản lý việc hiển thị modal
  // State để lưu thông tin robot được chọn (nếu cần)
  const [selectedRobot, setSelectedRobot] = useState(null);

  const handleClose = () => {
    alert("Close button clicked!");
  };

  // 4. Sửa đổi hàm này để mở modal
  const handleShowInfoRobot = (robot) => {
    console.log("Showing info for robot:", robot.name);
    setSelectedRobot(robot); // Lưu robot được chọn
    handleViewDetailsRobot(robot.id); // Gọi hàm từ props để xử lý xem chi tiết
  };

  return (
    <div>
      <div className="title">{groupRobot.name}</div>

      <div className="robot-list">
        {groupRobot.robots.map((robot) => {
          return (
            <RobotCard
              key={robot.id} // Thêm key để React quản lý list hiệu quả
              robot={robot}
              onClose={handleClose}
              // Truyền hàm handleShowInfoRobot xuống con
              onShowInfo={() => handleShowInfoRobot(robot)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default GroupRobotList;
