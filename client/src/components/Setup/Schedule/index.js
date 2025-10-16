import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Schedule.css";
import ConfirmDialog from "../../common/ConfirmDialog";
import MessageDialog from "../../common/MessageDialog";
const Schedule = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageData, setMessageData] = useState({});

  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [missionGroups, setMissionGroups] = useState([]);
  const [error, setError] = useState(null);
  const [confirmData, setConfirmData] = useState({});
  const [loading, setLoading] = useState(true);

  const totalPage = 1; // Placeholder, replace with actual total pages
  const totalPages = 1; // Placeholder, replace with actual total pages
  const navigate = useNavigate();
  const currentschedule = [];
  const listContainerRef = useRef(null);
  const finalFilteredschedule = [];
  const loadMissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        navigate("/login");
        return;
      }

      // Get current site ID first
      //    const siteId = await getCurrentSiteId();
      //    if (!siteId) {
      //      setError("Failed to get current site ID");
      //      return;
      //    }

      // load mission groups
      const missionGroupsData = await apiCallWithRetry(
        `${SERVER_URL}/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      setMissionGroups(
        Array.isArray(missionGroupsData) ? missionGroupsData : []
      );

      // Load missions for the current site using query parameter
      //    const missionsData = await apiCallWithRetry(
      //      `${SERVER_URL}/api/missions/list/${siteId}`,
      //      {
      //        headers: {
      //          Authorization: `Bearer ${token}`,
      //          Accept: "application/json",
      //          "Content-Type": "application/json",
      //        },
      //      }
      //    );

      // Load site information to get site name
      //    const siteData = await apiCallWithRetry(
      //      `${SERVER_URL}/api/sites/${siteId}`,
      //      {
      //        headers: {
      //          Authorization: `Bearer ${token}`,
      //          Accept: "application/json",
      //          "Content-Type": "application/json",
      //        },
      //      }
      //    );

      // Add site name to each mission
      //    const missionsWithSiteName = Array.isArray(missionsData)
      //      ? missionsData.map((mission) => ({
      //          ...mission,
      //          siteName:
      //            siteData.siteName || siteData.site_name || "Default site",
      //        }))
      //      : [];

      //    setAllMissions(missionsWithSiteName); // Lưu danh sách gốc với site name
      //    setFilteredMissions(missionsWithSiteName); // Ban đầu, danh sách đã lọc giống danh sách gốc
      setError(null);
    } catch (error) {
      console.error("Error loading missions:", error);
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        navigate("/login");
        return;
      }
      setError("Failed to load missions. Please try again.");
      //    setAllMissions([]);
      //    setFilteredMissions([]);
    } finally {
      setLoading(false);
    }
  };
  // const finalFilteredMissions = getFilteredMissions();
  useEffect(() => {
    loadMissions();
  }, []);

  const handleScheduleMission = () => {
    navigate("create");
  };
  return (
    <div className="schedule-private-container">
      <div className="page-header">
        <div className="header-title">
          <h2>Schedule</h2>
          <span className="subtitle">Schedule missions for the fleet</span>
        </div>
        <div className="header-actions">
          <button className="btn-create" onClick={handleScheduleMission}>
            <span className="plus-icon"></span>
            Schedule a mission
          </button>
        </div>
      </div>

      <div className="schedule-private-content">
        <div className="schedule-private-filters">
          <div className="schedule-private-filter-dropdown">
            <span>Show schedule:</span>
            <select
              //   value={selectedFilter}
              //   onChange={handleFilterChange}
              //   onKeyDown={handleKeyDown}
              className="schedule-private-select"
            >
              <option value="all">All schedule</option>
              {missionGroups.map((group) => (
                <option key={group.ID} value={group.ID}>
                  {group.groupName || "Unnamed Group"}
                </option>
              ))}
            </select>
          </div>
          <button
            className="schedule-private-create-edit-groups-btn"
            onClick={() => navigate("/setup/schedule/groups")}
          >
            Create / Edit groups
          </button>
          {/* Search Filter */}
          <div className="filter-input">
            <label>Filter:</label>
            <input
              type="text"
              placeholder="Write name to filter by..."
              value={searchFilter}
              //   onChange={handleSearchFilterChange}
              //   onKeyDown={handleKeyDown}
            />
            <span className="items-found">
              {/* {finalFilteredschedule.length} item(s) found */}
            </span>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-controls">
              <div className="prev-last-button">
                <button
                  className="prev-button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                ></button>
                <span className="tool-icon prev-last-icon-button"></span>
              </div>
              <div className="prev-button">
                <button
                  className="prev-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                ></button>
                <span className="tool-icon prev-icon-button"></span>
              </div>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <div className="next-button">
                <button
                  className="next-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                ></button>
                <span className="tool-icon next-icon-button"></span>
              </div>
              <div className="last-button">
                <button
                  className="last-button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                ></button>
                <span className="tool-icon last-icon-button"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="schedule-private-main-content">
          <div className="schedule-content-wrapper">
            <div className="schedule-private-list" ref={listContainerRef}>
              {currentschedule.length === 0 ? (
                <div className="schedule-private-no-schedule">
                  {finalFilteredschedule.length === 0
                    ? searchFilter
                      ? "No schedule found matching your search"
                      : "No schedule available"
                    : "No schedule on this page"}
                </div>
              ) : (
                currentschedule.map((mission) => (
                  <div key={mission.ID} className="schedule-private-item">
                    <div className="schedule-private-icon">
                      <img src="/assets/icons/target-white.png" alt="Mission" />
                    </div>
                    <div className="schedule-private-details">
                      <div className="schedule-private-name">
                        {mission.missionName}
                      </div>
                      <div className="schedule-private-site">
                        {mission.siteName ||
                          mission.site_name ||
                          "Default site"}
                      </div>
                    </div>
                    <div className="table-actions">
                      <button
                        // onClick={() => handleViewDetails(mission.ID)}
                        className="table-action-icon edit"
                        title="Edit mission"
                      />
                      <button
                        // onClick={() =>
                        //   openDeleteMissionConfirm(
                        //     mission.ID,
                        //     mission.missionName
                        //   )
                        // }
                        className="table-action-icon delete"
                        title="Delete mission"
                      />
                      <button
                        // onClick={() => handleQueueMission(mission.ID)}
                        className="table-action-icon queue"
                        title="Queue mission"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* <div className="schedule-private-queue">
              <h3>Mission queue</h3>
              <div className="schedule-private-queue-embed">
                <MissionQueueWidgetComponent
                  widget={{
                    id: "embedded-mission-queue",
                    displayMode: "display",
                    title: "Mission Queue",
                    settings: "",
                    properties: {},
                  }}
                />
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <ConfirmDialog
        visible={showConfirm}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onCancel={() => setShowConfirm(false)}
        isDelete={confirmData.title?.toLowerCase().includes("delete")}
      />
      <MessageDialog
        visible={showMessage}
        title={messageData.title}
        message={messageData.message}
        onClose={() => setShowMessage(false)}
      />
    </div>
  );
};

export default Schedule;
