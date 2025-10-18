import React, { useState } from "react"; // 1. Import useState
import "./AvailableRobotList.css";
import RobotCard from "./RobotCard";
import AddRobotModal from "./AddRobotModal"; // 2. Import component Modal mới

const myRobotData = [
  {
    id: "r717",
    name: "R717",
    version: "2.4.0",
    ip: "192.168.15.115",
    model: "MiR100",
  },
  {
    id: "r718",
    name: "R718",
    version: "2.4.0",
    ip: "192.168.15.116",
    model: "MiR100",
  },
];

function AvailableRobotList() {
  // 3. Tạo state để quản lý việc hiển thị modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State để lưu thông tin robot được chọn (nếu cần)
  const [selectedRobot, setSelectedRobot] = useState(null);

  const handleClose = () => {
    alert("Close button clicked!");
  };

  // 4. Sửa đổi hàm này để mở modal
  const handleAddRobot = (robot) => {
    console.log("Adding robot:", robot.name);
    setSelectedRobot(robot); // Lưu robot được chọn
    setIsModalOpen(true); // Mở modal
  };

  // Hàm để đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="title">Available robots</div>

      <div className="robot-list">
        {myRobotData.map((robot) => {
          return (
            <RobotCard
              key={robot.id} // Thêm key để React quản lý list hiệu quả
              robot={robot}
              onClose={handleClose}
              // Truyền hàm handleAddRobot xuống con
              onAddRobot={() => handleAddRobot(robot)}
            />
          );
        })}
      </div>

      {/* 5. Render Modal một cách có điều kiện */}
      {isModalOpen && (
        <AddRobotModal robot={selectedRobot} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default AvailableRobotList;
