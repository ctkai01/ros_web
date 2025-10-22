// import React, { useState, useEffect } from "react";
// import { FaCheck, FaUndo } from "react-icons/fa";
// import "./DateTimeSettings.css";

// // Hàm helper để định dạng số (ví dụ: 8 -> 08)
// const pad = (num) => String(num).padStart(2, "0");

// const DateTimeSettings = () => {
//   // State cho các dropdown
//   const [date, setDate] = useState({
//     month: "December",
//     day: "13",
//     year: "2018",
//   });
//   const [time, setTime] = useState({
//     hour: "20",
//     minute: "51",
//     second: "03",
//   });

//   // State cho đồng hồ (mô phỏng)
//   const [currentRobotTime, setCurrentRobotTime] = useState(
//     new Date(2018, 11, 13, 20, 51, 3)
//   );

//   // Chạy đồng hồ mô phỏng
//   useEffect(() => {
//     const timerId = setInterval(() => {
//       setCurrentRobotTime((prevTime) => new Date(prevTime.getTime() + 1000));
//     }, 1000);
//     return () => clearInterval(timerId); // Cleanup
//   }, []);

//   // Xử lý thay đổi
//   const handleDateChange = (e) => {
//     const { name, value } = e.target;
//     setDate((prev) => ({ ...prev, [name]: value }));
//   };
//   const handleTimeChange = (e) => {
//     const { name, value } = e.target;
//     setTime((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSaveChanges = () => {
//     alert("Saving changes:\n" + JSON.stringify({ ...date, ...time }));
//   };

//   const handleLoadFromDevice = () => {
//     // Mô phỏng load từ thiết bị
//     const now = new Date();
//     setDate({
//       month: now.toLocaleString("en-US", { month: "long" }),
//       day: pad(now.getDate()),
//       year: now.getFullYear(),
//     });
//     setTime({
//       hour: pad(now.getHours()),
//       minute: pad(now.getMinutes()),
//       second: pad(now.getSeconds()),
//     });
//   };

//   // Định dạng ngày giờ cho hiển thị
//   const formattedDate = currentRobotTime.toLocaleString("en-US", {
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//   });
//   const formattedTime = currentRobotTime.toLocaleTimeString("en-US", {
//     hour12: false,
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });

//   return (
//     <div className="datetime-settings">
//       {/* Cột trái */}
//       <div className="datetime-settings-form">
//         <div className="datetime-form-group">
//           <label className="datetime-form-label">Date</label>
//           <div className="datetime-select-row">
//             <select
//               name="month"
//               value={date.month}
//               onChange={handleDateChange}
//               className="datetime-form-select"
//             >
//               <option>December</option>
//               {/* Thêm các tháng khác... */}
//             </select>
//             <select
//               name="day"
//               value={date.day}
//               onChange={handleDateChange}
//               className="datetime-form-select"
//             >
//               <option>13</option>
//               {/* Thêm các ngày khác... */}
//             </select>
//             <select
//               name="year"
//               value={date.year}
//               onChange={handleDateChange}
//               className="datetime-form-select"
//             >
//               <option>2018</option>
//               {/* Thêm các năm khác... */}
//             </select>
//           </div>
//         </div>

//         <div className="datetime-form-group">
//           <label className="datetime-form-label">Time</label>
//           <div className="datetime-select-row">
//             <select
//               name="hour"
//               value={time.hour}
//               onChange={handleTimeChange}
//               className="datetime-form-select"
//             >
//               <option>20</option>
//               {/* Thêm giờ... */}
//             </select>
//             <span>:</span>
//             <select
//               name="minute"
//               value={time.minute}
//               onChange={handleTimeChange}
//               className="datetime-form-select"
//             >
//               <option>51</option>
//               {/* Thêm phút... */}
//             </select>
//             <span>:</span>
//             <select
//               name="second"
//               value={time.second}
//               onChange={handleTimeChange}
//               className="datetime-form-select"
//             >
//               <option>03</option>
//               {/* Thêm giây... */}
//             </select>
//           </div>
//         </div>

//         <div className="datetime-form-actions">
//           <button
//             className="datetime-action-btn datetime-btn-primary"
//             onClick={handleSaveChanges}
//           >
//             <FaCheck />
//             Save changes
//           </button>
//           <button
//             className="datetime-action-btn datetime-btn-secondary"
//             onClick={handleLoadFromDevice}
//           >
//             <FaUndo />
//             Load from device
//           </button>
//         </div>
//       </div>

//       {/* Cột phải */}
//       <div className="datetime-display-panel">
//         <label className="datetime-display-label">Current robot date and time</label>
//         <div className="datetime-display-date">{formattedDate}</div>
//         <div className="datetime-display-time">{formattedTime}</div>
//       </div>
//     </div>
//   );
// };

// export default DateTimeSettings;
import React, { useState, useEffect } from "react";
import { FaCheck, FaUndo } from "react-icons/fa";
import "./DateTimeSettings.css";

// Hàm helper để định dạng số (ví dụ: 8 -> 08)
const pad = (num) => String(num).padStart(2, "0");

// --- BỔ SUNG: TẠO CÁC MẢNG LỰA CHỌN ---

// Hàm helper để tạo mảng số
const generateOptions = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

// Tạo các mảng dữ liệu
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = generateOptions(1, 31);
const currentYear = new Date().getFullYear(); // Lấy năm hiện tại
// Tạo dải năm (ví dụ: 5 năm trước đến 5 năm sau)
const YEARS = generateOptions(currentYear - 5, currentYear + 5);
const HOURS = generateOptions(0, 23);
const MINUTES_SECONDS = generateOptions(0, 59);

// --- KẾT THÚC BỔ SUNG ---

const DateTimeSettings = () => {
  // State cho các dropdown
  const [date, setDate] = useState({
    month: "December",
    day: "13",
    year: "2018",
  });
  const [time, setTime] = useState({
    hour: "20",
    minute: "51",
    second: "03",
  });

  // State cho đồng hồ (mô phỏng)
  const [currentRobotTime, setCurrentRobotTime] = useState(
    new Date(2018, 11, 13, 20, 51, 3)
  );

  // Chạy đồng hồ mô phỏng (Không đổi)
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentRobotTime((prevTime) => new Date(prevTime.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timerId); // Cleanup
  }, []);

  // Xử lý thay đổi (Không đổi)
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDate((prev) => ({ ...prev, [name]: value }));
  };
  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setTime((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    alert("Saving changes:\n" + JSON.stringify({ ...date, ...time }));
  };

  // Cập nhật hàm này để set state cho đúng định dạng
  const handleLoadFromDevice = () => {
    const now = new Date();
    setDate({
      month: now.toLocaleString("en-US", { month: "long" }),
      day: String(now.getDate()), // Chuyển thành string
      year: String(now.getFullYear()), // Chuyển thành string
    });
    setTime({
      hour: pad(now.getHours()),
      minute: pad(now.getMinutes()),
      second: pad(now.getSeconds()),
    });
  };

  // Định dạng ngày giờ cho hiển thị (Không đổi)
  const formattedDate = currentRobotTime.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = currentRobotTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="datetime-settings">
      {/* Cột trái */}
      <div className="datetime-settings-form">
        <div className="datetime-form-group">
          <label className="datetime-form-label">Date</label>
          <div className="datetime-select-row">
            {/* --- CẬP NHẬT: DÙNG .MAP() ĐỂ TẠO OPTIONS --- */}
            <select
              name="month"
              value={date.month}
              onChange={handleDateChange}
              className="datetime-form-select"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              name="day"
              value={date.day}
              onChange={handleDateChange}
              className="datetime-form-select"
            >
              {DAYS.map((d) => (
                <option key={d} value={String(d)}>
                  {pad(d)}
                </option>
              ))}
            </select>

            <select
              name="year"
              value={date.year}
              onChange={handleDateChange}
              className="datetime-form-select"
            >
              {YEARS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="datetime-form-group">
          <label className="datetime-form-label">Time</label>
          <div className="datetime-select-row">
            <select
              name="hour"
              value={time.hour}
              onChange={handleTimeChange}
              className="datetime-form-select"
            >
              {HOURS.map((h) => (
                <option key={h} value={pad(h)}>
                  {pad(h)}
                </option>
              ))}
            </select>

            <span>:</span>

            <select
              name="minute"
              value={time.minute}
              onChange={handleTimeChange}
              className="datetime-form-select"
            >
              {MINUTES_SECONDS.map((m) => (
                <option key={m} value={pad(m)}>
                  {pad(m)}
                </option>
              ))}
            </select>

            <span>:</span>

            <select
              name="second"
              value={time.second}
              onChange={handleTimeChange}
              className="datetime-form-select"
            >
              {MINUTES_SECONDS.map((s) => (
                <option key={s} value={pad(s)}>
                  {pad(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="datetime-form-actions">
          <button
            className="datetime-action-btn datetime-btn-primary"
            onClick={handleSaveChanges}
          >
            <FaCheck />
            Save changes
          </button>
          <button
            className="datetime-action-btn datetime-btn-secondary"
            onClick={handleLoadFromDevice}
          >
            <FaUndo />
            Load from device
          </button>
        </div>
      </div>

      {/* Cột phải (Không đổi) */}
      <div className="datetime-display-panel">
        <label className="datetime-display-label">
          Current robot date and time
        </label>
        <div className="datetime-display-date">{formattedDate}</div>
        <div className="datetime-display-time">{formattedTime}</div>
      </div>
    </div>
  );
};

export default DateTimeSettings;