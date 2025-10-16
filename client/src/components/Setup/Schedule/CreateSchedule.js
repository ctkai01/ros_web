import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SERVER_URL, apiCallWithRetry } from "../../../config/serverConfig";
import "./Schedule.css";
import "../../../App.css";
import "./CreateSchedule.css";
const mockRobotData = [
  { id: 1, name: "Robot Alpha" },
  { id: 2, name: "Robot Beta" },
  { id: 3, name: "Robot Gamma" },
  { id: 4, name: "Robot Delta" },
];
const CreateSchedule = () => {
  const navigate = useNavigate();
  const [missionGroups, setMissionGroups] = useState([]);
  const [missionGroupSelected, setMissionGroupSelected] = useState(null);
  const [missionSelected, setMissionSelected] = useState(null);
  const [robotSelected, setRobotSelected] = useState(0);
  const [missions, setMissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [robots, setRobots] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const fetchMissionsByMissionGroup = async () => {
      try {
        if (missionGroupSelected) {
          const token = localStorage.getItem("token");
          if (!token) {
            navigate("/login");
            return;
          }

          // Load mission by mission group
          const missionsResponse = await apiCallWithRetry(
            `${SERVER_URL}/api/missions/group/${missionGroupSelected}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );
          console.log("Missions response: ", missionsResponse);
          const missionsData = Array.isArray(missionsResponse.data)
            ? missionsResponse.data
            : [];
          setMissions(missionsData);
        }
      } catch (error) {
        console.error("Error fetching missions:", error);
      }
    };
    fetchMissionsByMissionGroup();
  }, [missionGroupSelected]);

  console.log("Selected: ", missionGroupSelected);

  const loadMissionGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      console.log("Token: ", token);
      // Load mission groups
      const groupsResponse = await apiCallWithRetry(
        `${SERVER_URL}/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : [];
      setMissionGroups(groupsArray);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load required data");
    }
  };

  function simulateApiCallRobot() {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("...API call successful!");
        resolve(mockRobotData);
      }, 1000); // 1000 milliseconds = 1 second
    });
  }
  const loadRobotsData = async () => {
    // In real implementation, fetch robot data from server
    const response = await simulateApiCallRobot();
    setRobots([{ id: 0, name: "Any robot" }, ...response]);
  };

  const loadInitialData = async () => {
    await Promise.all([loadMissionGroups(), loadRobotsData()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setLoading(true);

    // console.log("🔄 CreateSchedule: formData:", formData);

    // // Validate required fields
    // if (!formData.name || !formData.groupId || !formData.siteId) {
    //   setError("Please fill in all required fields");
    //   setLoading(false);
    //   return;
    // }

    // try {
    //   // Transform formData to match server expectations
    //   const requestData = {
    //     missionName: formData.name,
    //     description: formData.description,
    //     missionGroupId: formData.groupId,
    //     siteId: formData.siteId,
    //     dataMission: "[]", // Add empty data for new mission
    //   };

    //   console.log(
    //     "🔄 CreateSchedule: requestData:",
    //     JSON.stringify(requestData)
    //   );
    //   const token = localStorage.getItem("token");
    //   const response = await apiCallWithRetry(
    //     `${SERVER_URL}/api/missions/site/${formData.siteId}`,
    //     {
    //       method: "POST",
    //       body: {
    //         missionName: formData.name,
    //         description: formData.description,
    //         missionGroupId: formData.groupId,
    //         dataMission: "[]", // Add empty data for new mission
    //       }, // Remove siteId from body since it's in URL
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   );

    //   if (response.success) {
    //     // Navigate to the newly created mission detail page
    //     navigate(`/setup/missions/detail/${response.missionId}`);
    //   } else {
    //     setError("Failed to create mission");
    //   }
    // } catch (error) {
    //   console.error("Error creating mission:", error);
    //   setError("Failed to create mission");
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleCancel = () => {
    navigate("/setup/missions");
  };

  const handleMissionGroupChange = (e) => {
    setMissionGroupSelected(e.target.value);
  };

  const handleRobotChange = (e) => {
    setRobotSelected(e.target.value);
  };

  const handleKeyDown = (e) => {
    // Prevent Enter key from submitting form and refreshing page
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      // On mobile, blur the input to hide virtual keyboard
      if (e.target && typeof e.target.blur === "function") {
        e.target.blur();
      }
    }
  };

  return (
    <div className="create-schedule-page">
      <div className="page-header">
        <div className="header-title">
          <h2>Schedule a mission</h2>
          <span className="subtitle">
            Schedule a mission by selecting the earliest start, a robot group
            and what priority the mission should have
          </span>
        </div>
        <div className="header-buttons">
          <button className="btn-go-back" onClick={handleCancel}>
            <span className="go-back-icon"></span>
            Go Back
          </button>
        </div>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        {/* <div className="form-group-container">
          <span className="form-group-label">Mission</span>
          <input
            className="form-group-input"
            type="text"
            name="name"
            placeholder="Enter the mission's name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={handleKeyDown}
            required
          />
        </div> */}
        <div className="form-double-container">
          <div className="form-group-container">
            <span className="form-group-label">Mission Group:</span>
            <div className="site-select-container">
              <select
                className="form-group-input"
                name="groupId"
                value={missionGroupSelected}
                onChange={handleMissionGroupChange}
                onKeyDown={handleKeyDown}
                required
              >
                <option value="">Select a mission group</option>
                {missionGroups.map((group) => (
                  <option key={group.ID} value={group.ID}>
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group-container">
            <span className="form-group-label">Mission:</span>
            <div className="site-select-container">
              <select
                className="form-group-input"
                name="groupId"
                value={missionSelected}
                onChange={(e) => {
                  // setFormData({ ...formData, groupId: e.target.value });
                  setMissionSelected(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                required
              >
                <option value="">Select a mission</option>
                {missions &&
                  missions.map((mission) => (
                    <option key={mission.id} value={mission.id}>
                      {mission.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-double-container">
          <div className="form-group-container">
            <span className="form-group-label">Date time:</span>
            <div className="site-select-container">
              <input
                className="form-group-input"
                type="datetime-local"
                // name="time"
                required
              />
            </div>
          </div>
        </div>
        <div
          style={{ marginLeft: "10px", marginBottom: "0px" }}
          className="form-group checkbox-group"
        >
          <label>
            <input type="checkbox" />
            Run as soon as possible
          </label>
        </div>
        <div className="form-group-container">
          <span className="form-group-label">Robot:</span>
          <div className="site-select-container">
            <select
              className="form-group-input"
              name="robotId"
              value={robotSelected}
              onChange={handleRobotChange}
              onKeyDown={handleKeyDown}
              required
            >
              <option value="">Select a robot</option>
              {robots.map((robot) => (
                <option key={robot.id} value={robot.id}>
                  {robot.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          style={{ marginLeft: "10px", marginBottom: "0px" }}
          className="form-group checkbox-group"
        >
          <label>
            <input type="checkbox" />
            High priority
          </label>
        </div>
        {/* <input type="date" id="event-date" name="event-date"></input> */}
        {/* <div className="form-double-container">
          <div className="form-group-container">
            <span className="form-group-label">Time:</span>
            <div className="site-select-container">
              <input
                className="form-group-input"
                type="time"
                // name="time"
                required
              />
            </div>
          </div>
        </div> */}
        {/* <div className="form-group-container">
          <span className="form-group-label">Description:</span>
          <textarea
            className="form-group-input"
            name="description"
            placeholder="Enter mission description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            onKeyDown={handleKeyDown}
            rows="3"
          />
        </div> */}

        <div className="form-group-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating...
              </>
            ) : (
              <>
                <span className="save-icon"></span>
                Create Schedule
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            <span className="cancel-icon"></span>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSchedule;
