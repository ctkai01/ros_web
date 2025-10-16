// src/App.js
import React, { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  fetchObjectList,
  sendFollowObjectData,
  sendStartFollow,
  sendStopFollow,
  sendStartDetection,
  sendStopDetection,
  sendCaptureFrame,
} from "./api";

function App() {
  const [currentFrameUrl, setCurrentFrameUrl] = useState(null);
  const [objectList, setObjectList] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [isFollowEnabled, setIsFollowEnabled] = useState(false);

  const handleSelectChange = (event) => {
    console.log(event.target.value);
    setSelectedObjectId(event.target.value);
  };

  const handleFollowClick = () => {
    if (!selectedObjectId) {
      alert("Please select a person to follow");
      return;
    }
    console.log(`Bắt đầu theo dõi đối tượng ID: ${selectedObjectId}`);
    sendFollowObjectData(selectedObjectId);
  };

  const handleEnableFollow = () => {
    setIsFollowEnabled(true);
    console.log("Follow mode: start");
    sendStartFollow();
  };

  const handleStartDetection = () => {
    console.log("Start detection");
    sendStartDetection();
  };

  const handleDisableFollow = () => {
    setIsFollowEnabled(false);
    console.log("Follow mode: stop");
    sendStopFollow();
  };

  const handleStopDetection = () => {
    console.log("Stop detection");
    sendStopDetection();
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-sans p-4">
      <div className="w-full max-w-4xl bg-gray-800 shadow-2xl rounded-lg p-6 text-center">
        <h1 className="text-3xl font-bold text-cyan-400 mb-4">
          Capture object 📹
        </h1>

        <div className="mb-4">
          <label
            htmlFor="object-select"
            className="block mb-2 text-lg font-medium text-gray-300"
          >
            Select a person:
          </label>
          <select
            id="object-select"
            value={selectedObjectId}
            onChange={handleSelectChange}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
          >
            {objectList && objectList.length === 0 ? (
              <option value="" disabled>
                Waiting for data...
              </option>
            ) : (
              <>
                <option value="">-- Please select --</option>
                {objectList &&
                  objectList.map((obj) => (
                    <option key={obj.id} value={`${obj.object_name}:${obj.id}`}>
                      {`${obj.id} - ${obj.object_name}`}
                    </option>
                  ))}
              </>
            )}
          </select>
        </div>

        <div className="flex justify-center items-center space-x-4 mb-6">
          <button
            onClick={handleFollowClick}
            disabled={!selectedObjectId}
            className={`px-6 py-2 font-semibold rounded-lg text-white transition-colors duration-300 ${
              selectedObjectId
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-500 cursor-not-allowed"
            }`}
          >
            Follow
          </button>

          {/* Button "Enable Follow" */}
          <button
            onClick={handleEnableFollow}
            className={`px-6 py-2 font-semibold rounded-lg text-white transition-colors duration-300 bg-green-600 hover:bg-green-700 ${
              isFollowEnabled ? "ring-4 ring-green-300" : ""
            }`}
          >
            Enable Follow
          </button>

          {/* Button "Disable Follow" */}
          <button
            onClick={handleDisableFollow}
            className={`px-6 py-2 font-semibold rounded-lg text-white transition-colors duration-300 bg-red-600 hover:bg-red-700 ${
              !isFollowEnabled ? "ring-4 ring-red-300" : ""
            }`}
          >
            Disable Follow
          </button>

          <button
            onClick={handleStartDetection}
            className={`px-6 py-2 font-semibold rounded-lg text-white transition-colors duration-300 bg-green-600 hover:bg-green-700 ${
              isFollowEnabled ? "ring-4 ring-green-300" : ""
            }`}
          >
            Start detection
          </button>
          <button
            onClick={handleStopDetection}
            className={`px-6 py-2 font-semibold rounded-lg text-white transition-colors duration-300 bg-red-600 hover:bg-red-700 ${
              !isFollowEnabled ? "ring-4 ring-red-300" : ""
            }`}
          >
            Stop detection
          </button>

          <button
            onClick={handleCaptureFrame}
            className={`px-6 py-2 font-semibold rounded-lg text-white transition-colors duration-300 bg-purple-600 hover:bg-purple-700 ${
              !isFollowEnabled ? "ring-4 ring-red-300" : ""
            }`}
          >
            Capture frame
          </button>
        </div>

        <div className="bg-black rounded-md overflow-hidden shadow-lg border-2 border-gray-600">
          <img
            src={currentFrameUrl}
            alt="Live Stream Frame"
            className="w-full h-auto"
          />
        
        </div>
      </div>
    </div>
  );
}

export default App;
