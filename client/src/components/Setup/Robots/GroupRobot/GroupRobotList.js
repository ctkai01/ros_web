import React, { useState } from "react"; // 1. Import useState
import "./GroupRobotList.css";
import RobotCard from "./RobotCard";

const myRobotData = [
  {
    id: "r717",
    name: "R717",
    version: "2.4.0",
    ip: "192.168.15.115",
    model: "MiR100",
    fleetState: "Asynchronous",
    state: "Pause",
    battery: "85%",
  },
  {
    id: "r718",
    name: "R718",
    version: "2.4.0",
    ip: "192.168.15.116",
    model: "MiR100",
    fleetState: "Asynchronous",
    state: "Start",
    battery: "55%",
  },
];

function GroupRobotList() {
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
  };



  return (
    <div>
      <div className="title">AMG MIR</div>

      <div className="robot-list">
        {myRobotData.map((robot) => {
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
