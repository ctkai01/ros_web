import React from "react";
import "./SettingsGrid.css";
// Import các icons cần thiết
import {
  FaCarBattery,
  FaWifi,
  FaUserTag,
  FaClock,
  FaCogs,
} from "react-icons/fa";

// 1. Định nghĩa dữ liệu cho các thẻ
const settingsItems = [
  {
    icon: <FaCarBattery />,
    title: "Charging and staging",
    description: "Charging and staging",
    url: "/system/settings/charging-and-staging",
  },
  {
    icon: <FaWifi />,
    title: "Collision avoidance",
    description:
      "Synchronize the fleet robots' footprints and positions and ensure",
    url: "/system/settings/collision-avoidance",
  },
  {
    icon: <FaUserTag />,
    title: "Distributor data",
    description: "Edit data about the distributor selling the robot.",
    url: "/system/settings/distributor-data",
  },
  {
    icon: <FaClock />,
    title: "Date & time",
    description: "Set the robots date and time",
    url: "/system/settings/date-and-time",
  },
  {
    icon: <FaCogs />,
    title: "Advanced",
    description: "Advanced configuration parameters",
    url: "/system/settings/advanced",
  },
];

const SettingsGrid = ({ handleNavigateSetting }) => {
  return (
    <div className="settings-grid">
      {/* 2. Lặp qua mảng dữ liệu và render mỗi thẻ */}
      {settingsItems.map((item, index) => (
        <div className="setting-card" key={index} onClick={() => handleNavigateSetting(item.url)}>
          <div className="card-icon">{item.icon}</div>
          <h3 className="card-title">{item.title}</h3>
          <p className="card-description">{item.description}</p>
        </div>
      ))}
    </div>
  );
};

export default SettingsGrid;
