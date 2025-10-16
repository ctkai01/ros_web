import React, { useState, useEffect } from "react";
import "./FollowMe.css"; // Bước 2: Nhập tệp CSS
import { toast } from "react-hot-toast";
import {
  sendFollowObjectData,
  sendStartFollow,
  fetchObjectList,
  sendCaptureFrame,
  sendStartDetection,
  sendStopDetection,
  sendStopFollow,
} from "../../../../../api";
const FollowMe = () => {
  // --- State placeholders ---

  const [currentFrameUrl, setCurrentFrameUrl] = useState("https://internetviettel.vn/wp-content/uploads/2017/05/1-2.jpg");
  const [objectList, setObjectList] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [alerttext, setAlertText] = useState("");

  const handleSelectChange = (event) => {
    console.log(event.target.value);
    setSelectedObjectId(event.target.value);
  };

  const handleFollowClick = () => {
    if (!selectedObjectId) {
      alert("Please select a person to follow");
      return;
    }
    // sendFollowObjectData(selectedObjectId);
    setAlertText("Start follow human with ID: " + selectedObjectId);
  };

  const handleEnableFollow = () => {
    console.log("Follow mode: start");
    // sendStartFollow();
    setAlertText("Enable follow");
  };

  const handleStartDetection = () => {
    console.log("Start detection");
    // sendStartDetection();
    setAlertText("Start detection");
  };

  const handleDisableFollow = () => {
    console.log("Follow mode: stop");
    // sendStopFollow();
    setAlertText("Disable follow");
  };

  const handleStopDetection = () => {
    console.log("Stop detection");
    // sendStopDetection();
    setAlertText("Stop detection");
  };

  const handleCaptureFrame = async () => {
    try {
      console.log("Start capture frame!");
      const dataFrameBlob = await sendCaptureFrame();
      console.log("Data frame: ", dataFrameBlob);
      const objectURL = URL.createObjectURL(dataFrameBlob);

      const getObjectList = async () => {
        const dataObjList = await fetchObjectList();
        console.log("Fetch obj: ", dataObjList);

        setObjectList(dataObjList);

        setCurrentFrameUrl(objectURL);
      };
      getObjectList();
    } catch (e) {
      console.log("Error capture frame: ", e);
    }
  };

  return (
    <div className="follow-me-container">
      <div className="capture-card">
        {/* <h1 className="capture-card__title">Capture object 📹</h1> */}

        <div className="capture-card__form-group">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label htmlFor="object-select" className="capture-card__label">
              Select a person:
            </label>
            <div style={{ color: "#fff", fontWeight: "bold" }}>{alerttext}</div>
          </div>
          <select
            id="object-select"
            value={selectedObjectId}
            onChange={handleSelectChange}
            className="capture-card__select"
          >
            {objectList.length === 0 ? (
              <option value="" disabled>
                Waiting for data...
              </option>
            ) : (
              <>
                <option value="">-- Please select --</option>
                {objectList.map((obj) => (
                  <option key={obj.id} value={`${obj.object_name}:${obj.id}`}>
                    {`${obj.id} - ${obj.object_name}`}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="capture-card__button-group">
          <button
            onClick={handleFollowClick}
            disabled={!selectedObjectId}
            className="btn btn--yellow"
          >
            Follow
          </button>

          <button onClick={handleEnableFollow} className="btn btn--green">
            Enable Follow
          </button>

          <button onClick={handleDisableFollow} className="btn btn--red">
            Disable Follow
          </button>

          <button onClick={handleStartDetection} className="btn btn--green">
            Start detection
          </button>

          <button onClick={handleStopDetection} className="btn btn--red">
            Stop detection
          </button>

          <button onClick={handleCaptureFrame} className="btn btn--purple">
            Capture frame
          </button>
        </div>
        {currentFrameUrl && (
          <div className="video-player">
            <img
              src={currentFrameUrl}
              alt="Live Stream Frame"
              className="video-player__frame"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowMe;
