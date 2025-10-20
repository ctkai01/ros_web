import React, { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DetailsRobot.css";
import "../../../../components/Dashboard/DesignDashboard/MapWidget/MapWidget.css";
// import ConfirmDialog from "../../common/ConfirmDialog";
// import MessageDialog from "../../common/MessageDialog";
import { FaWifi, FaPlus, FaArrowCircleLeft } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { RiCloseLargeFill } from "react-icons/ri";
import InfoPanel from "./InfoPanel";
import Modal from "../../../common/Modal";
import EditFormRobotInfo from "./EditFormRobotInfo";
import serverConfig from "../../../../config/serverConfig";
import { Map2D } from "../../Maps/EditMaps/Map_2D/Map_2D";
import MapWidget from "../../../Dashboard/DesignDashboard/MapWidget/MapWidget";
// import AvailableRobotList from "./AvailableRobot/AvailableRobotList";
// import GroupRobotList from "./GroupRobot";
// import AddManuallyRobotModal from "./AddManuallyRobotModal";
const robotInfo = [
  { key: "Robot name", value: "Automation Inc", editable: true },
  { key: "Robot status", value: "Pause", editable: false },
  { key: "IP address", value: "10.0.0.100", editable: false },
  { key: "Robot model", value: "MiR100", editable: false },
  { key: "Serial number", value: "180100002100856", editable: false },
  { key: "Robot group", value: "petes robots", editable: true },
  { key: "Charging group", value: "", editable: true }, // Giá trị có thể trống
  { key: "Created by", value: "Robot Overlord", editable: false },
];
// let globalCurrentSiteId = null;
// let globalCurrentMapId = null;
// let globalCurrentMapData = null;

// const position = findEmptyPosition();

// const config = {
//   id: uuidv4(),
//   position: { row: position.row, col: position.col },
//   displayMode: "design",
// };
let globalCurrentSiteId = null;
let globalCurrentMapId = null;
let globalCurrentMapData = null;
// const widget = new MapWidget(config);
const DetailsRobot = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpenAddManually, setIsModalOpenAddManually] = useState(false);
  const [editRobotField, setEditRobotField] = useState(null);
  //   const [groupRobotData, setGroupRobotData] = useState(myRobotData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const canvasRef = useRef(null);
  // const widgetsRef = useRef(widgets);
  const [isEditRobotModalOpen, setIsEditRobotModalOpen] = useState(false);
  const currentMapId = useRef(null);
  const currentSiteId = useRef(null);
  const currentMapData = useRef(null);
  const mapRef = useRef(null);
  const [widget, setWidget] = useState(null);
  const handleEditRobot = (robotField) => {
    setIsEditRobotModalOpen(true);
    setEditRobotField(robotField);
    console.log("Editing robot field:", robotField);
  };

  const handleUpdateInfoRobot = (updatedInfo) => {
    console.log("Updated robot info:", updatedInfo);
    // Cập nhật thông tin robot ở đây (gọi API hoặc cập nhật state)
  };

  const handleZoom = () => {
    if (mapRef.current) {
      // Toggle zoom mode
      if (mapRef.current.setZoomMode()) {
        // Add active class to zoom button
        const zoomButton = document.querySelector(".zoom-tools .tool-button");
        if (zoomButton) {
          zoomButton.classList.add("active");
          // Remove active from other buttons
          const panButton = document.querySelector(".pan-tools .tool-button");
          if (panButton) panButton.classList.remove("active");
        }
      } else {
        // Remove active class if zoom mode is disabled
        const zoomButton = document.querySelector(".zoom-tools .tool-button");
        if (zoomButton) zoomButton.classList.remove("active");
      }
    }
  };

  useEffect(() => {
    const fetchMapData = async () => {
      const id = 30;
      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/dashboards/${id}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.properties && data.properties.widgets) {
          const mapWidgetData = data.properties.widgets.find(
            (widget) => widget.type === "map"
          );

          console.log("Map widget data:", mapWidgetData);
          const widgetMap = MapWidget.fromJSON(mapWidgetData);
          console.log("Map widget instance:", widgetMap);
          widgetMap.displayMode = "display";
          setWidget(widgetMap);
        }
      }
    };
    fetchMapData();
  }, []);

  const setGlobalCurrentMap = (mapId) => {
    globalCurrentMapId = mapId;
    currentMapId.current = mapId;
    console.log("Set global current map ID:", mapId);
  };

  const setGlobalCurrentSite = (siteId) => {
    globalCurrentSiteId = siteId;
    currentSiteId.current = siteId;
    console.log("Set global current site ID:", siteId);
  };

  const getMapDataFromServer = async (mapId, siteId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return null;
      }

      console.log(
        "🔄 MapWidget: Loading map data for mapId:",
        mapId,
        "siteId:",
        siteId
      );

      // First try to load map data
      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/maps/load/${mapId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            siteId: siteId,
          }),
        }
      );

      if (!response.ok) {
        console.error("HTTP error! status: ", response.status);
        return null;
      }

      const data = await response.json();

      console.log("📥 MapWidget: API response data:", data);

      if (data.success && data.data) {
        console.log(
          "✅ MapWidget: API response is successful, validating data structure..."
        );
        console.log("🔍 MapWidget: data.data structure:", {
          hasInfo: !!data.data.info,
          hasMapData: !!data.data.mapData,
          infoType: typeof data.data.info,
          mapDataType: typeof data.data.mapData,
          infoContent: data.data.info,
          mapDataContent: data.data.mapData,
        });

        // Validate map data structure
        if (!data.data.info || !data.data.mapData) {
          console.error(
            "❌ MapWidget: Invalid map data structure - missing info or mapData"
          );
          return null;
        }

        // Get additional map data
        try {
          console.log("🔄 MapWidget: Loading additional map elements...");
          // Send start navigation to server
          try {
            console.log("🔄 MapWidget: About to call start-navigation API...");
            const startNavigationResponse = await fetch(
              `${serverConfig.SERVER_URL}/api/robot/start-navigation`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  mapId: mapId,
                  siteId: siteId,
                }),
              }
            );

            console.log(
              "📡 MapWidget: start-navigation response received:",
              startNavigationResponse.status
            );
            if (startNavigationResponse.ok) {
              console.log("✅ MapWidget: Navigation started successfully");
            } else {
              console.warn(
                "⚠️ MapWidget: Failed to start navigation, status:",
                startNavigationResponse.status
              );
            }
          } catch (navError) {
            console.error("❌ MapWidget: Error starting navigation:", navError);
            console.error("❌ MapWidget: Navigation error details:", {
              message: navError.message,
              stack: navError.stack,
              name: navError.name,
            });
          }

          // Combine all data and ensure required fields
          console.log("🔄 MapWidget: Creating combinedData...");
          const combinedData = {
            ...data.data,
            id: mapId,
            siteId: siteId,
          };

          console.log("✅ MapWidget: Map data loaded successfully:", {
            hasInfo: !!combinedData.info,
            hasMapData: !!combinedData.mapData,
            mapId: combinedData.id,
            siteId: combinedData.siteId,
          });

          console.log("📤 MapWidget: Returning combinedData");
          return combinedData;
        } catch (error) {
          console.error(
            "❌ MapWidget: Error fetching additional map data:",
            error
          );
          // Return base map data even if additional data fetch fails
          const fallbackData = {
            ...data.data,
            id: mapId,
            siteId: siteId,
          };
          console.log("⚠️ MapWidget: Using fallback map data:", {
            hasInfo: !!fallbackData.info,
            hasMapData: !!fallbackData.mapData,
            mapId: fallbackData.id,
            siteId: fallbackData.siteId,
          });
          return fallbackData;
        }
      } else {
        console.warn("⚠️ MapWidget: No map data found in response");
        return null;
      }
    } catch (error) {
      console.error("❌ MapWidget: Error getting map data:", error);
      return null;
    }
  };

  const setGlobalCurrentMapData = (mapData) => {
    if (!mapData) {
      console.warn("⚠️ MapWidget: Attempting to set null/undefined map data");
      return;
    }

    globalCurrentMapData = mapData;
    currentMapData.current = mapData;
    console.log("✅ MapWidget: Set global current map data:", {
      hasInfo: !!mapData.info,
      hasMapData: !!mapData.mapData,
      mapId: mapData.id,
      siteId: mapData.siteId,
    });
  };

  const getGlobalCurrentMap = () => {
    return globalCurrentMapId;
  };

  const getGlobalCurrentMapData = () => {
    return globalCurrentMapData;
  };

  const reloadMapData = async (newMapId, newSiteId) => {
    try {
      console.log("🔄 MapWidget: Reloading map data due to map/site change:", {
        newMapId,
        newSiteId,
      });

      // Update global variables
      setGlobalCurrentMap(newMapId);
      setGlobalCurrentSite(newSiteId);

      // Get new map data
      const mapData = await getMapDataFromServer(newMapId, newSiteId);
      if (mapData) {
        setGlobalCurrentMapData(mapData);

        // Update map visualization if map instance exists
        if (mapRef.current && mapData) {
          // Update base map
          if (mapData.info && mapData.mapData) {
            mapRef.current.setMapData(mapData);
            mapRef.current.resetView();
            mapRef.current.mapId = newMapId;
            mapRef.current.siteId = newSiteId;
          }

          // Load virtual walls, forbidden zones, positions, and markers in parallel
          if (mapRef.current) {
            console.log(
              "🔄 MapWidget: Reloading all map elements in parallel..."
            );
            const startTime = performance.now();

            // Load all elements in parallel for better performance
            await Promise.all([
              mapRef.current.loadVirtualWallsFromDatabase(),
              mapRef.current.loadForbiddenZonesFromDatabase(),
              mapRef.current.loadPreferredZonesFromDatabase(),
              mapRef.current.loadUnpreferredZonesFromDatabase(),
              mapRef.current.loadCriticalZonesFromDatabase(),
              mapRef.current.loadPointsFromDatabase(),
              mapRef.current.loadMarkersFromDatabase(),
            ]);

            const endTime = performance.now();
            console.log(
              `✅ MapWidget: All map elements reloaded in ${(
                endTime - startTime
              ).toFixed(2)}ms`
            );
          }
        }

        console.log("✅ MapWidget: Successfully reloaded map data");
      } else {
        console.warn("⚠️ MapWidget: Failed to get new map data");
      }
    } catch (error) {
      console.error("❌ MapWidget: Error reloading map data:", error);
    }
  };

  const startDisplayMode = () => {
    try {
      // Initialize WebSocket connection for map and tf updates
      const ws = new WebSocket(serverConfig.WS_URL);
      console.log("🔌 MapWidget connecting to WebSocket:", serverConfig.WS_URL);
      wsRef.current = ws; // Store WebSocket reference for cleanup

      ws.onopen = async () => {
        console.log("✅ MapWidget WebSocket connected");
        // Store WebSocket reference for cleanup
        if (mapRef.current) {
          mapRef.current.mapWebSocket = ws;

          // Initialize map if not already initialized
          if (!mapRef.current.isInitialized) {
            console.log(
              "mapRef.current.isInitialized",
              mapRef.current.isInitialized
            );
            const initSuccess = await mapRef.current.initialize();
            if (!initSuccess) {
              console.error("Failed to initialize map after starting SLAM");
              // setError('Failed to initialize map after starting SLAM'); // Removed setError
            } else {
              console.log("mapRef isInitialized", mapRef.current.isInitialized);
              // Create robot frame for visualization
              // mapRef.current.createRobotFrame();
              mapRef.current.showRobot();
              if (mapRef.current.robot) {
                mapRef.current.robot.setPathVisible(false);
              }

              // Fit camera to map if map data is available
              if (mapRef.current.mapData && mapRef.current.mapData.info) {
                setTimeout(() => {
                  if (mapRef.current && mapRef.current.isInitialized) {
                    mapRef.current.fitCameraToMap();
                  }
                }, 1000); // Small delay to ensure map is fully loaded
              }
            }
          } else {
            // Create robot frame for visualization
            //mapRef.current.createRobotFrame();
            mapRef.current.showRobot();
            if (mapRef.current.robot) {
              mapRef.current.robot.setPathVisible(false);
            }
          }

          // Add small delay to ensure robot is fully initialized before processing messages
          setTimeout(() => {}, 500);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // // Handle map updates
          // if (message.type === 'map_update' && mapRef.current) {
          //   // Handle map initialization asynchronously
          //   const handleMapUpdate = async () => {
          //     // Ensure map is initialized before updating
          //     if (!mapRef.current.isInitialized) {
          //       const initSuccess = await mapRef.current.initialize();
          //       if (!initSuccess) {
          //         console.error('Failed to initialize map for update');
          //         return;
          //       }
          //     }

          //     // Update map with SLAM data - pass only the data portion
          //     mapRef.current.updateMapFromSLAM(message.data);

          //     // Fit camera to the new map data
          //     setTimeout(() => {
          //       if (mapRef.current && mapRef.current.isInitialized) {
          //         mapRef.current.fitCameraToMap();
          //       }
          //     }, 500);
          //   };

          //   handleMapUpdate();
          // }
          // else
          if (message.type === "map_change") {
            console.log(
              "📋 MapWidget: Received map change notification:",
              message.data
            );

            const { id_map, id_site } = message.data;
            if (id_map == null || id_site == null) {
              console.log(
                "📋 MapWidget: Map change notification received but no change detected"
              );
              return;
            }

            const currentMapId = getGlobalCurrentMap();
            const currentSiteId = getGlobalCurrentSite();

            // Check if map or site has changed
            if (id_map !== currentMapId || id_site !== currentSiteId) {
              console.log(
                "🔄 MapWidget: Map or site changed, reloading data:",
                {
                  current: { mapId: currentMapId, siteId: currentSiteId },
                  new: { mapId: id_map, siteId: id_site },
                }
              );

              // Reload map data with new IDs
              reloadMapData(id_map, id_site);
            } else {
              console.log(
                "ℹ️ MapWidget: Map change notification received but no change detected"
              );
            }
          }
          // Handle robot TF updates
          else if (message.type === "robot_tf" && mapRef.current) {
            const robotTFs = message.data;
            if (robotTFs && robotTFs.transforms) {
              if (mapRef.current.robot) {
                mapRef.current.robot.setTF(robotTFs.transforms);
              }
            } else {
              console.warn("Invalid TF data format:", robotTFs);
            }
          }
          // Handle laser scan updates
          else if (message.type === "scan_update" && mapRef.current) {
            const scanData = message.data;

            // Check if map and robot are fully initialized before processing scan
            if (
              mapRef.current.isInitialized &&
              mapRef.current.robot &&
              mapRef.current.scene
            ) {
              try {
                mapRef.current.robot.updateScan(scanData);
              } catch (error) {
                console.error("Error processing scan update:", error);
              }
            } else {
              console.warn("❌ Cannot process scan - conditions not met:", {
                mapInitialized: mapRef.current.isInitialized,
                hasRobot: !!mapRef.current.robot,
                hasScene: !!mapRef.current.scene,
                robotHasScene: mapRef.current.robot
                  ? !!mapRef.current.robot.scene
                  : false,
                scenesMatch: mapRef.current.robot
                  ? mapRef.current.robot.scene === mapRef.current.scene
                  : false,
              });
            }
          }
          // Handle odometry updates from joystick
          else if (message.type === "odom_update" && mapRef.current) {
            const odomData = message.data;

            // Check if map is initialized before processing odom
            if (mapRef.current.isInitialized) {
              // Update robot position based on odometry data
              if (odomData && odomData.pose && odomData.pose.pose) {
                const pose = odomData.pose.pose;
                const position = pose.position;
                const orientation = pose.orientation;

                // Update robot position on map if needed
                // This can be used for real-time position tracking during joystick control
                //mapRef.current.updateRobotPositionFromOdom(position, orientation);
              }
            } else {
              console.warn("Cannot process odom - map not initialized");
            }
          }
          // Handle nav global path planning updates
          else if (
            message.type === "nav_global_path_planning" &&
            mapRef.current
          ) {
            const pathData = message.data;
            if (mapRef.current.robot) {
              mapRef.current.robot.updatePath(pathData);
            }
          }
        } catch (error) {
          console.error("WebSocket message processing error:", {
            error: error.message,
            stack: error.stack,
            data: event.data,
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        // Clear reference
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        // Try to reconnect if connection was lost and component is still mounted
        if (
          mapRef.current &&
          mapRef.current.displayRobot &&
          wsRef.current === null
        ) {
          console.log("Attempting to reconnect WebSocket in 3 seconds...");
          setTimeout(() => {
            // Only reconnect if component is still mounted and no new connection exists
            if (mapRef.current && !wsRef.current) {
              startDisplayMode();
            }
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Error initializing map after SLAM:", error);
    }
  };

  const handleInitPoseEstimate = async (poseEstimateData) => {
    try {
      console.log(
        "EditMaps: handleInitPoseEstimate called with data:",
        poseEstimateData
      );

      if (!poseEstimateData) {
        console.warn("EditMaps: No pose estimate data provided");
        return;
      }

      const { position, orientation } = poseEstimateData;

      if (!position || !orientation) {
        console.warn(
          "EditMaps: Invalid pose estimate data - missing position or orientation"
        );
        return;
      }

      // Validate position data
      if (typeof position.x !== "number" || typeof position.y !== "number") {
        console.warn("EditMaps: Invalid position data");
        return;
      }

      // Validate orientation data (quaternion)
      if (
        typeof orientation.x !== "number" ||
        typeof orientation.y !== "number" ||
        typeof orientation.z !== "number" ||
        typeof orientation.w !== "number"
      ) {
        console.warn("EditMaps: Invalid orientation data");
        return;
      }

      console.log("EditMaps: Pose estimate validated successfully:", {
        position: { x: position.x, y: position.y, z: position.z },
        orientation: {
          x: orientation.x,
          y: orientation.y,
          z: orientation.z,
          w: orientation.w,
        },
      });

      // Call API to publish pose estimate to ROS
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${serverConfig.SERVER_URL}/api/robot/init-pose-estimate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            poseEstimate: {
              position: {
                x: position.x,
                y: position.y,
                z: position.z || 0.0,
              },
              orientation: {
                x: orientation.x,
                y: orientation.y,
                z: orientation.z,
                w: orientation.w,
              },
            },
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("EditMaps: Pose estimate published to ROS successfully");

        // // Show success message
        // setMessageDialogConfig({
        //   title: 'Pose Estimate Applied',
        //   message: `Robot pose has been updated to: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`,
        //   onConfirm: () => setShowMessageDialog(false),
        //   onClose: () => setShowMessageDialog(false)
        // });
        // setShowMessageDialog(true);
      } else {
        throw new Error(result.message || "Failed to publish pose estimate");
      }
    } catch (error) {
      console.error("EditMaps: Error handling pose estimate:", error);

      // // Show error message
      // setMessageDialogConfig({
      //   title: 'Error',
      //   message: `Failed to apply pose estimate: ${error.message}`,
      //   onConfirm: () => setShowMessageDialog(false),
      //   onClose: () => setShowMessageDialog(false)
      // });
      // setShowMessageDialog(true);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const initMap = async () => {
      // Create map instance
      if (!widget) {
        return;
      }
      const map = new Map2D(canvasRef.current);
      // map.clearMap();
      await map.initialize();
      mapRef.current = map;
      console.log("Widget: ", widget);
      // Configure map based on display mode
      if (widget && widget.displayMode === "display" && mapRef.current) {
        // if (widget.displayMode === "display" && mapRef.current) {
        map.initMapClickHandler();
        map.initMouseModeSelection();
        map.setToolMapMode(false);
        map.hideWallToolbar();
        map.hideFloorToolbar();

        if (mapRef.current.toolDrawVirtualWall == null) {
          mapRef.current.createDrawVirtualWallTool();
        }
        map.hideVirtualWallToolbar();

        if (mapRef.current.toolDrawForbiddenZone == null) {
          mapRef.current.createDrawForbiddenZoneTool();
        }
        map.hideForbiddenZoneToolbar();
        map.hidePositionToolbar();
        map.setPanMode();
        map.robot.setPathVisible(false);
        map.robot.setGlobalPathPlanningVisible(true);
        // map.setPoseEstimateCallback(handleInitPoseEstimate);

        // get current map id and site id from server
        const siteId = 17;
        setGlobalCurrentSite(siteId);
        const mapId = 88;

        setGlobalCurrentMap(mapId);

        console.log("mapId", mapId);
        console.log("siteId", siteId);
        // Get map data and update current map
        if (mapId) {
          console.log(
            "🔄 MapWidget: About to call getMapDataFromServer with:",
            {
              mapId,
              siteId,
            }
          );
          const mapData = await getMapDataFromServer(mapId, siteId);
          console.log("📊 MapWidget: getMapDataFromServer returned:", mapData);
          if (mapData) {
            console.log(
              "✅ MapWidget: mapData is valid, processing...",
              mapData
            );
            setGlobalCurrentMapData(mapData);

            // Update map visualization if needed
            if (mapRef.current && mapData) {
              // Update base map
              if (mapData.info && mapData.mapData) {
                mapRef.current.setMapData(mapData);
                mapRef.current.resetView();
                // Set mapId and siteId from parameters, not from mapData
                mapRef.current.mapId = mapId;
                mapRef.current.siteId = siteId;
              }

              if (mapRef.current) {
                console.log(
                  "🔄 MapWidget: Loading all map elements in parallel..."
                );
                const startTime = performance.now();

                // Load all elements in parallel for better performance
                await Promise.all([
                  mapRef.current.loadVirtualWallsFromDatabase(),
                  mapRef.current.loadForbiddenZonesFromDatabase(),
                  mapRef.current.loadPreferredZonesFromDatabase(),
                  mapRef.current.loadUnpreferredZonesFromDatabase(),
                  mapRef.current.loadCriticalZonesFromDatabase(),
                  mapRef.current.loadPointsFromDatabase(),
                  mapRef.current.loadMarkersFromDatabase(),
                ]);

                const endTime = performance.now();
                console.log(
                  `✅ MapWidget: All map elements loaded in ${(
                    endTime - startTime
                  ).toFixed(2)}ms`
                );
              }
            }
          }
        }

        // start display mode
        startDisplayMode();
      }
    };

    initMap();

    return () => {
      // Close WebSocket connection
      if (wsRef.current) {
        console.log("Closing WebSocket connection");
        wsRef.current.close();
        wsRef.current = null;
      }

      // Dispose map
      if (mapRef.current) {
        // Clear WebSocket reference from map
        if (mapRef.current.mapWebSocket) {
          mapRef.current.mapWebSocket = null;
        }
        mapRef.current.dispose();
      }
    };
  }, [widget]);
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.resetView();
      // Reset active states of all toolbar buttons
      const toolButtons = document.querySelectorAll(".tool-button");
      toolButtons.forEach((button) => button.classList.remove("active"));
    }
  };
  return (
    <div className="detail-robot-private-container">
      <Modal
        isOpen={isEditRobotModalOpen}
        onClose={() => setIsEditRobotModalOpen(false)}
      >
        <EditFormRobotInfo
          data={editRobotField}
          onClose={() => setIsEditRobotModalOpen(false)}
          onUpdate={handleUpdateInfoRobot}
        />
        {/* <h2>Success!</h2>
        <p>Your operation was completed successfully.</p>
        <button onClick={() => setIsEditRobotModalOpen(false)}>OK</button> */}
      </Modal>
      <div className="page-header">
        <div className="header-title">
          <h2>Automation Inc</h2>
          <span className="subtitle">
            Details and settings for a robot in the fleet
          </span>
        </div>
        <div className="header-actions">
          <button className="robot-action-btn deactivate-robot-btn">
            <RiCloseLargeFill />
            Deactivate
          </button>
          <button
            // onClick={handleAddRobotManually}
            className="robot-action-btn go-to-interface-robot-btn"
          >
            <FaArrowUpRightFromSquare />
            Go to robot interface
          </button>
          <button className="robot-action-btn go-back-robot-btn">
            <FaArrowCircleLeft />
            Go back
          </button>
        </div>
      </div>

      <div className="robots-private-content">
        <div className="robots-private-filters">
          <div className="robots-private-filter-dropdown">
            <span>Group:</span>
            <select
              //   value={selectedFilter}
              //   onChange={handleFilterChange}
              //   onKeyDown={handleKeyDown}
              className="robots-private-select"
            >
              <option value="all">All</option>
              <option value="rb-1">Robot Group 1</option>
              <option value="rb-2">Robot Group 2</option>
              <option value="rb-3">Robot Group 3</option>
            </select>
          </div>

          <div className="robots-private-filter-dropdown">
            <span>Status:</span>
            <select
              //   value={selectedFilter}
              //   onChange={handleFilterChange}
              //   onKeyDown={handleKeyDown}
              className="schedule-private-select"
            >
              <option value="all">Show all</option>
              <option value="inactive">INACTIVE</option>
              <option value="active">ACTIVE</option>
              <option value="pending">PENDING</option>
            </select>
          </div>
        </div>
        <div className="robots-private-main-content">
          <InfoPanel data={robotInfo} handleEditRobot={handleEditRobot} />
          <div
            className="widget-content"
            style={{ padding: "5px", marginBottom: "10px" }}
          >
            <div className="map-content">
              <div className="map-toolbar">
                <div className="toolbar-left-group">
                  <div className="zoom-tools">
                    <button
                      className="tool-button"
                      title="Zoom"
                      onClick={handleZoom}
                    >
                      <span className="tool-icon zoom-icon"></span>
                    </button>
                  </div>

                  <div className="pan-tools">
                    <button
                      className="tool-button"
                      title="Pan"
                      // onClick={handlePan}
                    >
                      <span className="tool-icon pan-icon"></span>
                    </button>
                  </div>
                </div>

                <div className="toolbar-right-group">
                  <div className="reset-view-button">
                    <button
                      className="tool-button"
                      title="Reset View"
                      onClick={handleResetView}
                    >
                      <span className="tool-icon reset-view-icon"></span>
                    </button>
                  </div>
                  <div className="zoom-in-button">
                    <button
                      className="tool-button"
                      title="Zoom In"
                      onClick={handleZoomIn}
                    >
                      <span className="tool-icon zoom-in-icon"></span>
                    </button>
                  </div>
                  <div className="zoom-out-button">
                    <button
                      className="tool-button"
                      title="Zoom Out"
                      onClick={handleZoomOut}
                    >
                      <span className="tool-icon zoom-out-icon"></span>
                    </button>
                  </div>
                </div>
              </div>
              <div style={{  height: "500px"}} className="map-canvas" ref={canvasRef}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsRobot;
