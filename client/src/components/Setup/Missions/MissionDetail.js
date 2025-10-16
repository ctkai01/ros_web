import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import './MissionDetail.css';
import ConfirmDialog from '../../common/ConfirmDialog';
import MessageDialog from '../../common/MessageDialog';
import MoveAction from './MoveAction/MoveAction';
import MoveSettings from './MoveAction/MoveSettings';
import DockingAction from './DockingAction/DockingAction';
import DockingSettings from './DockingAction/DockingSettings';
import LoopAction from './LoopAction/LoopAction';
import RelativeMoveAction from './RelativeMoveAction/RelativeMoveAction';
import ActionContainer from './ActionContainer';
import DraggableItem from './DraggableItem';
import containerManager from './ContainerManager';
import actionRegistry from './initActionRegistry';
import { SettingsProvider } from './SettingsContext';
import SettingsDialog from './SettingsDialog';
import { generateActionId, generateNestedPanel, getActionLevel } from './utils/actionIdGenerator';
import { getActionData, getActionId, getActionChildren, debugAction, getActionUserCreate, getAction } from './utils/actionHelper';
// Import action classes


// Forward declare renderActionContent
let renderActionContent;

const createActionComponent = (action, panelId, handlers) => {
    const { onClone, onSettings, onRemove } = handlers;
    console.log("action", action);
    // Check action type and return appropriate component
    if (action.name.includes('Move') && !action.name.includes('Relative')) {
        return (
            <MoveAction
                action={action}
                panelId={panelId}
                onClone={onClone}
                onSettings={onSettings}
                onRemove={onRemove}
            />
        );
    } else if (action.name.includes('Docking')) {
        return (
            <DockingAction
                action={action}
                panelId={panelId}
                onClone={onClone}
                onSettings={onSettings}
                onRemove={onRemove}
            />
        );
    } else if (action.name.includes('Relative Move')) {
        return (
            <RelativeMoveAction
                action={action}
                panelId={panelId}
                onClone={onClone}
                onSettings={onSettings}
                onRemove={onRemove}
            />
        );
    } else if (action.name.includes('Loop')) {
        return (
            <LoopAction
                action={action}
                panelId={panelId}
                onClone={onClone}
                onSettings={onSettings}
                onToggle={() => { }} // Add toggle handler
                isExpanded={action.isExpanded}
            />
        );
    }

    // Default rendering for other action types
    return renderActionContent(action, panelId);
};

const MissionDetail = () => {

    const navigate = useNavigate();
    const { id } = useParams();
    const [mission, setMission] = useState(null);
    const [groups, setGroups] = useState([]);
    const [actions, setActions] = useState({});
    const [selectedGroup, setSelectedGroup] = useState('');
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [selectedActions, setSelectedActions] = useState([]);
    const [draggedItem, setDraggedItem] = useState({ type: null, id: null, panelId: null, source: null });
    const [forceReload, setForceReload] = useState(0); // Add force reload state
    const [renderKey, setRenderKey] = useState(0);
    const [removalTrigger, setRemovalTrigger] = useState(0); // Add removal trigger state

    const [points, setPoints] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [markers, setMarkers] = useState(null);
    const [loadingMarkers, setLoadingMarkers] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingsave, setLoadingsave] = useState(false);
    const [error, setError] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmData, setConfirmData] = useState({}); // { title, message, onConfirm }
    const [showMessage, setShowMessage] = useState(false);
    const [messageData, setMessageData] = useState({});
    const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
    const [saveAsName, setSaveAsName] = useState('');
    const [footprints, setFootprints] = useState([]);
    const [loadingFootprints, setLoadingFootprints] = useState(false);
    const [submenuPageByGroup, setSubmenuPageByGroup] = useState({});
    const [placeholderIndex, setPlaceholderIndex] = useState(null);


    // Đăng ký callback để nhận updates từ ActionRegistry
    useEffect(() => {
        const callbackId = actionRegistry.registerUpdateCallback((updatedActions) => {
            setSelectedActions(updatedActions);
        });

        return () => {
            // Cleanup callback khi component unmount
            actionRegistry.updateCallbacks.delete(callbackId);
        };
    }, []);

    // Log when forceReload changes
    useEffect(() => {
        if (forceReload > 0) {
        }

    }, [forceReload]);

    // Add useEffect to monitor forceReload changes
    useEffect(() => {
        // Force re-render of all content when forceReload changes
        if (forceReload > 0) {
        }
    }, [forceReload]);

    // Force re-render when forceReload changes
    useEffect(() => {
        if (forceReload > 0) {
            setRenderKey(prev => {
                const newValue = prev + 1;
                return newValue;
            });
        }
    }, [forceReload]); // Remove renderKey from dependency array

    // Log when renderKey changes
    useEffect(() => {
    }, [renderKey]);

    // Cập nhật global state khi component mount
    useEffect(() => {
        actionRegistry.updateGlobalState({
            selectedActions,
            points,
            footprints
        });
    }, [selectedActions, points, footprints]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };

                // Fetch mission details
                const missionData = await apiCallWithRetry(`${SERVER_URL}/api/missions/${id}`, { headers });
                console.log('missionData', missionData);
                setMission(missionData);
                const siteId = missionData.IDSite;
                console.log('siteId', siteId);
                //footprint
                const footprintsData = await apiCallWithRetry(`${SERVER_URL}/api/footprints/${siteId}`, { headers });
                setFootprints(footprintsData);
                const siteMaps = await apiCallWithRetry(`${SERVER_URL}/api/sites/${siteId}/maps`, { headers });

                // Get points for each map
                // Use a local variable to ensure we have points immediately for downstream parsing
                let resolvedPoints = [];
                try {
                    // Bước 1: Lấy danh sách ID của tất cả các bản đồ
                    const mapIds = siteMaps.map(map => map.ID);

                    // Bước 2: Nếu không có bản đồ nào, không cần làm gì cả
                    if (mapIds.length > 0) {
                        // Bước 3: Gọi API mới một lần duy nhất với tất cả các ID
                        const pointsResponse = await apiCallWithRetry(
                            `${SERVER_URL}/api/maps/batch/points-by-map`,
                            {
                                method: 'POST', // Sử dụng phương thức POST
                                headers: headers,
                                body: JSON.stringify({ mapIds: mapIds }) // Gửi danh sách ID trong body
                            }
                        );

                        // pointsByMap sẽ là một đối tượng có dạng: { "mapId1": [points...], "mapId2": [points...] }
                        const pointsByMap = pointsResponse.data;

                        // Bước 4: Kết hợp dữ liệu bản đồ với dữ liệu điểm đã nhận được
                        const mapWithPoints = siteMaps.map(map => {
                            return {
                                mapId: map.ID,
                                mapName: map.mapName,
                                points: pointsByMap[map.ID] || [] // Lấy mảng điểm tương ứng từ kết quả
                            };
                        });

                        console.log('mapWithPoints', mapWithPoints);
                        resolvedPoints = mapWithPoints;
                        setPoints(mapWithPoints);
                    } else {
                        resolvedPoints = [];
                        setPoints([]); // Xóa các điểm nếu không có bản đồ nào
                        console.log('no map clear points');
                    }
                } catch (error) {
                    console.error("Failed to fetch points for maps:", error);
                    setMessageData({
                        title: "Load Points Failed",
                        message: "Failed to load points for maps. Please try again.",
                    });
                    setShowMessage(true);
                }

                // Load markers for all maps
                let resolvedMarkers = [];
                try {
                    setLoadingMarkers(true);
                    
                    if (siteMaps && siteMaps.length > 0) {
                        // Bước 1: Lấy danh sách ID của các bản đồ
                        const mapIds = siteMaps.map(map => map.ID);
                        
                        // Bước 2: Gọi API để lấy markers cho tất cả các bản đồ
                        const markersResponse = await apiCallWithRetry(
                            `${SERVER_URL}/api/markers/by-maps`,
                            {
                                method: 'POST',
                                headers: {
                                    ...headers,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ mapIds: mapIds }) // Gửi danh sách ID trong body
                            }
                        );

                        // markersByMap sẽ là một đối tượng có dạng: { "mapId1": [markers...], "mapId2": [markers...] }
                        const markersByMap = markersResponse.data;

                        // Bước 3: Kết hợp dữ liệu bản đồ với dữ liệu markers đã nhận được
                        const mapWithMarkers = siteMaps.map(map => {
                            return {
                                mapId: map.ID,
                                mapName: map.mapName,
                                markers: markersByMap[map.ID] || [] // Lấy mảng markers tương ứng từ kết quả
                            };
                        });
                        resolvedMarkers = mapWithMarkers;
                        setMarkers(mapWithMarkers);
                    } else {
                        resolvedMarkers = [];
                        setMarkers([]); // Xóa các markers nếu không có bản đồ nào
                        console.log('no map clear markers');
                    }
                } catch (error) {
                    console.error("Failed to fetch markers for maps:", error);
                    setMarkers([]);
                    setMessageData({
                        title: "Load Markers Failed",
                        message: "Failed to load markers for maps. Please try again.",
                    });
                    setShowMessage(true);
                } finally {
                    setLoadingMarkers(false);
                }

                // Load groups and missions first
                const groupsData = await apiCallWithRetry(`${SERVER_URL}/api/groups`, { headers });
                setGroups(groupsData);

                // Build actions per group using Actions table (User_create: false)
                const actionsMap = {};
                const groupIdToName = new Map();
                (groupsData || []).forEach(group => {
                    groupIdToName.set(group.ID, group.groupName);
                    actionsMap[group.ID] = [];
                });

                try {
                    // Load all actions and group them by groupID
                    const allActions = await apiCallWithRetry(`${SERVER_URL}/api/actions`, { headers });
                    (allActions || []).forEach(a => {
                        const gid = a.groupID;
                        if (gid == null) return;
                        if (!actionsMap[gid]) actionsMap[gid] = [];
                        actionsMap[gid].push({
                            ID: a.ID,
                            actionName: a.actionName,
                            User_create: 'false',
                            groupName: groupIdToName.get(gid) || `Group ${gid}`
                        });
                    });
                } catch (actionsErr) {
                    console.error('Error loading actions:', actionsErr);
                }

                // Fetch all missions and append to corresponding group as User_create: true

                try {
                    const missions = await apiCallWithRetry(`${SERVER_URL}/api/missions/list/${siteId}`, { headers });
                    (missions || []).forEach(m => {
                        // không lấy mission có id bằng chính nó
                        if (m.ID == id) return;
                        const gid = m.groupID;
                        if (gid == null) return;
                        if (!actionsMap[gid]) actionsMap[gid] = [];
                        actionsMap[gid].push({
                            actionName: 'userCreate',
                            missionID: m.ID,
                            groupID: m.groupID,
                            missionName: m.missionName,
                            User_create: 'true',
                            description: m.description || '',
                            groupName: groupIdToName.get(gid) || `Group ${gid}`
                        });
                    });
                } catch (missionsErr) {
                    console.error('Error loading missions for groups:', missionsErr);
                    setMessageData({
                        title: "Load Actions Failed",
                        message: "Failed to load actions for groups. Please try again.",
                    });
                    setShowMessage(true);
                }

                setActions(actionsMap);

                // Parse and set existing actions if mission has data

                if (missionData.data) {
                    try {
                        const parsedActions = JSON.parse(missionData.data);
                        if (Array.isArray(parsedActions) && parsedActions.length > 0) {

                             // Wait for ActionRegistry to be ready before parsing
                             await actionRegistry.waitForInitialization();
                            
                            const actionPanels = parsedActions.map((action, index) => {

                                try {
                                    // Use actionRegistry.parseFromDatabase instead of manual parsing
                                    // Pass points, markers and actionsMap data
                                    const actionPanel = actionRegistry.parseFromDatabase(action, 0, resolvedPoints, actionsMap, resolvedMarkers);
                                    if (!actionPanel) {
                                        console.error(`❌ Failed to parse action: ${action.Action_name}`);
                                        return null;
                                    }
                                    return actionPanel;

                                } catch (actionError) {
                                    console.error("Error processing action:", actionError, action);
                                    // Return a basic panel structure if parsing fails
                                    return null;
                                }
                            });

                            setSelectedActions(actionPanels);
                        }
                    } catch (error) {
                        console.error("Error parsing mission actions:", error);
                        setError('Failed to parse mission actions');
                    }
                }

                // If mission has a group, set it as selected (actions already populated)
                if (missionData.groupID) {
                    setSelectedGroup(missionData.groupID);
                }

                setError(null);
            } catch (error) {
                console.error('Error fetching mission details:', error);
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    navigate('/login');
                    return;
                }
                setError('Failed to load mission details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);


    const handleGroupClick = async (groupId, event) => {
        console.log('handleGroupClick called with groupId:', groupId);
        try {
            setSelectedGroup(groupId);
            const isExpanding = expandedGroup !== groupId;
            setExpandedGroup(isExpanding ? groupId : null);
            setSubmenuPageByGroup(prev => ({ ...prev, [groupId]: 0 }));

            // Nếu đang mở dropdown, tính toán vị trí
            if (isExpanding && event) {
                const submenuItem = event.currentTarget;
                const rect = submenuItem.getBoundingClientRect();
                
                // Tìm dropdown element
                const dropdown = submenuItem.querySelector('.submenu-dropdown');
                if (dropdown) {
                    // Đặt vị trí dropdown theo vị trí của submenu item
                    dropdown.style.left = rect.left + 'px';
                    dropdown.style.top = (rect.bottom + 5) + 'px';
                    dropdown.style.minWidth = rect.width + 'px';
                }
            }
            console.log('actions', actions);

            if (!actions[groupId]) {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };

                const actionsData = await apiCallWithRetry(
                    `${SERVER_URL}/api/actions/group/${groupId}`,
                    { headers }
                );
                console.log('groupactionsData', actionsData);
                setActions(prev => ({ ...prev, [groupId]: actionsData }));
            }
        } catch (error) {
            console.error('Error fetching actions:', error);
            setError('Failed to load actions. Please try again.');
        }
    };

    const handleActionClick = (action) => {
        console.log('handleActionClick', action);
        console.log('🔍 action.actionName:', action.actionName);
        const actiontype = actionRegistry.getActionTypeFromName(action.actionName);
        console.log('🔍 actiontype:', actiontype);
        const actionClass = actionRegistry.actions.get(actiontype);
        console.log('🔍 actionClass:', actionClass);
        if (actionClass && actionClass.createPanel) {
            const newPanel = actionClass.createPanel(action);
            if (newPanel) {
                setSelectedActions(prev => [...prev, newPanel]);
            }
        }
        else {
            console.error('❌ handleActionClick: No createPanel method found for:', actiontype);
        }

        setExpandedGroup(null);
    };

    // Add new function to handle loop toggle
    const handleLoopToggle = (panelId, forceUpdate = false) => {
        console.log("handleLoopToggle", panelId, forceUpdate);
        setSelectedActions(prev => {
            const newActions = [...prev];
            const panelIndex = newActions.findIndex(p => p.panelId === panelId);

            if (panelIndex === -1) return prev;

            newActions[panelIndex] = {
                ...newActions[panelIndex],
                isExpanded: forceUpdate ? true : !newActions[panelIndex].isExpanded
            };

            return newActions;
        });
    };



    const handleRemoveAction = (e, actionId, panelId) => {
        console.log("🗑️ Remove action called:", { actionId, panelId });
        if (e) {
            e.stopPropagation();
        }

        // First try to remove from root level panels
        setSelectedActions(prev => {
            const newActions = [...prev];
            const panelIndex = newActions.findIndex(p => p.panelId === panelId);

            if (panelIndex !== -1) {
                const panel = newActions[panelIndex];

                // Nếu đây là action cuối cùng trong panel, xóa cả panel
                if (panel.actions && panel.actions.length === 1) {
                    newActions.splice(panelIndex, 1);
                    console.log('✅ Removed entire panel from root');
                    return newActions;
                }

                // Xóa action khỏi panel
                if (panel.actions) {
                    panel.actions = panel.actions.filter(action => action.id !== actionId);

                    // Cập nhật thứ tự các action còn lại
                    panel.actions.forEach((action, index) => {
                        action.order = index + 1;
                    });

                    console.log('✅ Removed action from root panel');
                    return newActions;
                }
            }

            // If not found in root, try to find and remove from nested loops
            console.log('🔍 Action not found in root, searching in nested loops...');
            return prev;
        });

        // If action wasn't found in root panels, search in nested loops
        setTimeout(() => {
            findAndRemoveNestedAction(actionId);
        }, 0);

        // Clear the selected action if it was the one being removed
        if (selectedActionForSettings && selectedActionForSettings.id === actionId) {
            setSelectedActionForSettings(null);
            setShowSettings(false);
        }
    };

    // Menu action drag handlers (keep these for menu items)
    const handleMenuActionDragStart = (e, action, groupId) => {
        e.stopPropagation();

        console.log('🟦 Menu Action Drag Start:', {
            action,
            groupId,
            actionType: action.actionName.includes('Loop') ? 'loop' : 'action'
        });

        const actionData = {
            type: 'menu-action',
            id: action.ID,
            actionName: action.actionName,
            description: action.description,
            groupId: groupId,
            source: 'menu',
            actionType: action.actionName.includes('Loop') ? 'loop' : 'action',
            isLoop: action.actionName.includes('Loop'),
            sourceContainerId: 'menu'
        };

        setDraggedItem(actionData);
        window.draggedItem = actionData;
        e.dataTransfer.effectAllowed = 'copy';
        e.target.classList.add('dragging');
    };

    const handleMenuActionDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggedItem({ type: null, id: null, panelId: null, source: null });
    };


    const handleDragOverPanel = (e, overIndex) => {
        e.preventDefault();
        if (placeholderIndex !== overIndex) {
            setPlaceholderIndex(overIndex);
        }
    };

    const handleDragLeavePanel = () => {
        setPlaceholderIndex(null);
    };

    const handleDropPanel = (e, dropIndex) => {
        e.preventDefault();
        setPlaceholderIndex(null);

        // Lấy thông tin item đang kéo
        const dragged = window.draggedItem;
        if (!dragged) return;

        const newList = [...selectedActions];
        // Xóa vị trí cũ
        const oldIndex = newList.findIndex(p => p.panelId === dragged.panelId);
        if (oldIndex !== -1) {
            const [moved] = newList.splice(oldIndex, 1);
            // Thêm vào vị trí mới
            newList.splice(dropIndex, 0, moved);
            setSelectedActions(newList);
        }
    };

    // Add click outside handler to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.submenu-item')) {
                setExpandedGroup(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Add click outside handler for dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown')) {
                setDropdownOpen(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Define renderActionContent
    renderActionContent = (action, panelId) => {
        const handlers = {
            onClone: handleClone,
            onRemove: handleRemoveAction
        };

        return null;;// createActionComponent(action, panelId, handlers);
    };

    // Add SettingsForm component inside MissionDetail component
    const SettingsForm = ({ action, panelId, onClose, onSave }) => {
        const [formData, setFormData] = useState({
            position: action.position || '',
            retries: action.retries || 10,
            distance_threshold: action.distance_threshold || 0.1,
        });

        const [selectedPoint, setSelectedPoint] = useState(null);

        // Update selected point when position changes
        useEffect(() => {
            if (points && formData.position) {
                for (const mapGroup of points) {
                    console.log("mapGroup.points:", mapGroup.points);

                    for (const point of mapGroup.points) {
                        if (point.ID == formData.position) {
                            console.log("point:", point.ID);
                            setSelectedPoint(point);
                            break;
                        }
                    }
                }

            } else {
                setSelectedPoint(null);
            }
        }, [formData.position, points]);

    };

    // Transform action to JSON
    const transformActionToJSON = (action) => {
        // Kiểm tra action có tồn tại không
        if (!action) {
            console.error('❌ transformActionToJSON: action is null or undefined');
            return null;
        }

        // Lấy action data - có thể là action.actions[0] hoặc action trực tiếp
        let newAction;
        if (action.actions && Array.isArray(action.actions) && action.actions.length > 0) {
            newAction = action.actions[0];
        } else {
            newAction = action;
        }

        console.log('🔄 transformActionToJSON: newAction:', newAction);

        // Transform based on action type
        if (newAction.actionName === 'Move' && MoveAction.transformToDatabase) {
            return MoveAction.transformToDatabase(action);
        } else if (newAction.actionName === 'Docking' && DockingAction.transformToDatabase) {
            return DockingAction.transformToDatabase(action);
        } else if (newAction.actionName === 'Loop' && LoopAction.transformToDatabase) {
            return LoopAction.transformToDatabase(action);
        } else if (newAction.actionName === 'RelativeMove' && RelativeMoveAction.transformToDatabase) {
            return RelativeMoveAction.transformToDatabase(action);
        } else {
            console.error('❌ transformActionToJSON: Unknown action type:', newAction.actionName);
            return null;
        }
    };
    // Flatten actions
    const flattenActions = (actions) => {
        let flattened = [];

        const processAction = (action) => {
            // Add the current action
            const transformedAction = transformActionToJSON(action);
            console.log("Transformed action:", transformedAction);
            flattened.push(transformedAction);

            // Process children if they exist
            const ch = getActionChildren(action);
            if (ch && ch.length > 0) {
                ch.forEach(child => processAction(child));
            }
        };

        actions.forEach(action => processAction(action));
        return flattened;
    };
    // Save mission 
    const handleSave = async () => {
        setLoadingsave(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            // Transform the actions structure into a simple array
            const transformedActions = selectedActions.map(panel => {
                // Sử dụng ActionRegistry để transform panel
                const actionType = actionRegistry.getActionTypeFromName(panel.actionName);
                const actionClass = actionRegistry.getAction(actionType);

                if (actionClass && actionClass.transformToDatabase) {
                    return actionClass.transformToDatabase(panel);
                }

                // Fallback nếu không có transformToDatabase
                return {
                    Action_name: panel.actionName || 'Unknown',
                    Properties: JSON.stringify(panel.properties || {}),
                    Type: panel.type || "1",
                    User_create: "false"
                };
            }).filter(action => action !== null); // Lọc bỏ các action null

            console.log("Final transformed actions:", transformedActions);

            // Convert each action to string and join with commas
            const actionsString = transformedActions.map(action => {
                // Properties đã được stringify trong transformToDatabase, không cần stringify lại
                return JSON.stringify(action);
            }).join(',');

            // Create the final array string
            const finalActionsString = `[${actionsString}]`;

            console.log("Final actions string:", finalActionsString);

            const missionData = {
                ...mission,
                actions: finalActionsString
            };

            console.log("Mission data to save:", missionData);

            const response = await apiCallWithRetry(`${SERVER_URL}/api/missions/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    siteId: missionData.IDSite,
                    missionName: missionData.missionName,
                    missionGroupId: missionData.groupID,
                    dataMission: missionData.actions
                }
            });
            console.log("Update Success", response.message);
            setLoadingsave(false);

            // Show success message
            setMessageData({
                title: "Save Success",
                message: `Mission "${mission.missionName}" saved successfully.`,
            });
            setShowMessage(true);

        } catch (error) {
            console.error('Error saving mission:', error);
            setLoadingsave(false);
            
            // Show error message
            setMessageData({
                title: "Save Failed",
                message: "Failed to save mission. Please try again.",
            });
            setShowMessage(true);
        }
    };
    // Show Save As dialog
    const handleSaveAs = () => {
        setSaveAsName(`${mission.missionName} (copy)`);
        setShowSaveAsDialog(true);
    };

    // Handle Save As confirmation
    const handleSaveAsConfirm = async () => {
        if (!saveAsName.trim()) {
            setMessageData({
                title: 'Validation Error',
                message: 'Mission name is required.'
            });
            setShowMessage(true);
            return;
        }

        try {
            setLoadingsave(true);
            setShowSaveAsDialog(false);
            
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            // Transform the actions structure into a simple array
            const transformedActions = selectedActions.map(panel => {
                return flattenActions(panel.actions);
            }).flat();

            console.log("Final transformed actions for save as:", transformedActions);

            // Convert each action to string and join with commas
            const actionsString = transformedActions.map(action => {
                const actionString = JSON.stringify({
                    ...action,
                    Properties: action.Properties
                });
                return actionString;
            }).join(',');

            // Create the final array string
            const finalActionsString = `[${actionsString}]`;

            const missionData = {
                ...mission,
                missionName: saveAsName,
                actions: finalActionsString
            };

            console.log("Mission data to save as:", missionData);

            const response = await apiCallWithRetry(`${SERVER_URL}/api/missions/site/${missionData.IDSite}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    missionName: missionData.missionName,
                    missionGroupId: missionData.groupID,
                    dataMission: missionData.actions
                }
            });

            console.log("Save As Success", response.message);
            setLoadingsave(false);

            setMessageData({
                title: "Save As Success",
                message: `Mission saved as "${missionData.missionName}" successfully.`,
            });
            setShowMessage(true);
            
            // Navigate to the new mission detail page
            setTimeout(() => {
                navigate(`/setup/missions/detail/${response.missionId}`);
            }, 1500);
        } catch (error) {
            console.error('Error saving mission as new:', error);
            setLoadingsave(false);
            setMessageData({
                title: "Save As Failed",
                message: "Failed to save mission as new. Please try again.",
            });
            setShowMessage(true);
        }
    };

    const handleSaveAsCancel = () => {
        setShowSaveAsDialog(false);
        setSaveAsName('');
    };
    // Delete mission by id
    const openDeleteMissionConfirm = () => {

        console.log("Chuẩn bị hỏi xóa zone ", id);
        setConfirmData({
            title: "Confirm Delete",
            message: `Are you sure you want to delete item ?`,
            onConfirm: () => {
                handleDelete();
                setShowConfirm(false);
            },
        });
        setShowConfirm(true);
    };
    // Handle delete mission after confirm
    const handleDelete = async () => {

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            const response = await apiCallWithRetry(`${SERVER_URL}/api/missions/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.success) {
                setMessageData({
                    title: "Delete Success",
                    message: `Missions ${id} has been deleted successfully.`,
                });
                setShowMessage(true);
                navigate('/setup/missions');
            }
            else {
                setMessageData({
                    title: "Delete Failed",
                    message: "An error occurred while deleting the item.",
                });
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error deleting mission:', error);
            setMessageData({
                title: "Delete Failed",
                message: "An error occurred while deleting the item.",
            });
            setShowMessage(true);
        }
    };

    const getGroupIcon = (groupName) => {
        // Convert group name to lowercase for easier comparison
        const name = groupName.toLowerCase();

        switch (name) {
            case 'move':
                return <img src={require('/public/assets/icons/location.png')} style={{ width: '16px', height: '16px' }} alt="Move" />; // Walking person for movement
            case 'battery':
                return <img src={require('/public/assets/icons/battery.png')} style={{ width: '16px', height: '16px' }} alt="Battery" />; // Battery icon
            case 'logic':
                return <img src={require('/public/assets/icons/loop.png')} style={{ width: '16px', height: '16px' }} alt="Logic" />; // Lightning bolt for logic/control
            case 'sound/light':
                return <img src={require('/public/assets/icons/light.png')} style={{ width: '16px', height: '16px' }} alt="Sound/Light" />; // Light bulb for sound/light
            case 'plc':
                return <img src={require('/public/assets/icons/thump-up.png')} style={{ width: '16px', height: '16px' }} alt="PLC" />; // Wrench for PLC/industrial control
            case 'e-mail':
                return <img src={require('/public/assets/icons/mail.png')} style={{ width: '16px', height: '16px' }} alt="Email" />; // Email icon
            case 'bluetooth':
                return <img src={require('/public/assets/icons/bluetooth.png')} style={{ width: '16px', height: '16px' }} alt="Bluetooth" />; // Mobile phone for bluetooth
            case 'cart':
                return '🛒'; // Shopping cart
            case 'shelf':
                return '📚'; // Bookshelf
            case 'missions':
                return <img src={require('/public/assets/icons/target.png')} style={{ width: '16px', height: '16px' }} alt="Bluetooth" />; // Target for missions
            case 'ur':
                return '🤖'; // Robot for UR
            case 'error handling':
                return <img src={require('/public/assets/icons/warning.png')} style={{ width: '16px', height: '16px' }} alt="Error" />; // Warning sign for error handling
            default:
                return <img src={require('/public/assets/icons/group-black.png')} style={{ width: '16px', height: '16px' }} alt="Group" />; // Default icon for other groups
        }
    };

    // ====================================================================
    // ===== BẮT ĐẦU PHẦN LOGIC XỬ LÝ STATE ĐƯỢC VIẾT LẠI ================
    // ====================================================================

    /**
     * Hàm đệ quy đa năng: tìm một panel trong cây theo panelId và áp dụng một hàm cập nhật.
     * @param {Array} panels - Mảng các panel để tìm kiếm (có thể là root hoặc children).
     * @param {string} targetPanelId - ID của panel cần tìm.
     * @param {Function} updateFn - Hàm được gọi khi tìm thấy panel.
     * - Nhận vào panel tìm thấy.
     * - Trả về panel đã cập nhật.
     * - Nếu trả về `null`, panel sẽ bị xóa.
     * @returns {{updatedPanels: Array, itemFound: boolean}} - Mảng panel mới và một cờ báo đã tìm thấy hay chưa.
     */
    const updateOrRemoveInTree = (panels, targetPanelId, updateFn) => {
        console.log("🔍 updateOrRemoveInTree called:", { 
            panelsLength: panels.length, 
            targetPanelId 
        });
        
        let itemFound = false;

        const updatedPanels = panels.map(panel => {
            console.log("🔍 Checking panel:", { 
                panelId: panel.panelId, 
                targetPanelId, 
                matches: panel.panelId === targetPanelId 
            });
            
            if (itemFound) return panel;

            if (panel.panelId === targetPanelId) {
                console.log("🔍 Found target panel, calling updateFn");
                itemFound = true;
                return updateFn(panel);
            }

            const actionData = getAction(panel);
            let childrenUpdated = false;
            let newActionData = { ...actionData };

            const processBranch = (branchName) => {
                if (newActionData[branchName] && Array.isArray(newActionData[branchName])) {
                    const result = updateOrRemoveInTree(newActionData[branchName], targetPanelId, updateFn);
                    if (result.itemFound) {
                        itemFound = true;
                        childrenUpdated = true;
                        newActionData[branchName] = result.updatedPanels;
                    }
                }
            };

            processBranch('children');
            processBranch('thenBlock');
            processBranch('elseBlock');
            processBranch('yesBlock');
            processBranch('noBlock');
            processBranch('timeoutBlock');
            processBranch('tryBlock');
            processBranch('catchBlock');

            if (childrenUpdated) {
                console.log("🔍 updateOrRemoveInTree - newActionData:", newActionData);
                console.log("🔍 updateOrRemoveInTree - childrenUpdated:", childrenUpdated);
                return { ...panel, actions: [newActionData] };
            }

            return panel;
        }).filter(panel => panel !== null);

        return { updatedPanels, itemFound };
    };


    /**
     * Hàm cập nhật dữ liệu của một action bất kỳ trong cây state.
     * @param {string} panelId - ID của panel cần cập nhật.
     * @param {Object} updatedData - Dữ liệu mới để gộp vào action.
     */
    const handleActionUpdate = (panelId, updatedData) => {
        setSelectedActions(currentActions => {
            const updateFunction = (panelToUpdate) => {
                const currentActionData = getAction(panelToUpdate);
                // Gộp dữ liệu mới vào action chính bên trong panel
                const newActionData = { ...currentActionData, ...getAction(updatedData) };
                console.log("🔍 currentActionData", currentActionData);
                console.log("🔍 updatedData", updatedData);
                console.log("🔍 newActionData", newActionData);
                console.log("🔍 panelToUpdate", {
                    ...panelToUpdate,
                    actions: [newActionData]
                });
                return {
                    ...panelToUpdate,
                    
                    actions: [newActionData]
                };
            };
            const { updatedPanels } = updateOrRemoveInTree(currentActions, panelId, updateFunction);
            console.log("🔍 updatedPanels", updatedPanels);
            return updatedPanels;
        });
    };

    /**
     * Hàm xóa một action bất kỳ trong cây state.
     * @param {string} panelId - ID của panel cần xóa.
     */
    const handleActionRemove = (panelId) => {
        console.log("🔍 handleActionRemove called with panelId:", panelId);
        console.log("🔍 Current selectedActions before remove:", selectedActions.length);
        
        setSelectedActions(currentActions => {
            console.log("🔍 Inside setSelectedActions callback");
            console.log("🔍 currentActions length:", currentActions.length);
            
            const removeFunction = () => {
                console.log("🔍 removeFunction called - returning null to remove panel");
                return null;
            };
            
            const { updatedPanels, itemFound } = updateOrRemoveInTree(currentActions, panelId, removeFunction);
            console.log("🔍 updateOrRemoveInTree result:", { 
                updatedPanelsLength: updatedPanels.length, 
                itemFound 
            });
            
            return updatedPanels;
        });
    };

    /**
     * Hàm cập nhật nội dung của một action cha (ví dụ: thêm/xóa/sắp xếp con).
     * @param {string} parentPanelId - ID của panel cha (Loop, If) cần cập nhật.
     * @param {Object} newChildrenData - Một object chứa các mảng con đã được cập nhật.
     * Ví dụ: { children: [...] } cho Loop,
     * hoặc { thenBlock: [...], elseBlock: [...] } cho If.
     */
    const handleParentContentUpdate = (parentPanelId, newChildrenData) => {
        handleActionUpdate(parentPanelId, newChildrenData);
    };

    /**
     * Hàm nhân bản một action.
     * @param {string} panelId - ID của panel cần nhân bản.
     */
    const handleClone = (panelId) => {
        let panelToClone = null;

        // Hàm tìm kiếm đệ quy để lấy ra panel gốc
        const findPanel = (panels, targetId) => {
            for (const panel of panels) {
                if (panel.panelId === targetId) {
                    panelToClone = panel;
                    return;
                }
                const actionData = getAction(panel);
                if (actionData.children) findPanel(actionData.children, targetId);
                if (actionData.thenBlock) findPanel(actionData.thenBlock, targetId);
                if (actionData.elseBlock) findPanel(actionData.elseBlock, targetId);
                if (actionData.yesBlock) findPanel(actionData.yesBlock, targetId);
                if (actionData.noBlock) findPanel(actionData.noBlock, targetId);
                if (actionData.timeoutBlock) findPanel(actionData.timeoutBlock, targetId);
                if (actionData.tryBlock) findPanel(actionData.tryBlock, targetId);
                if (actionData.catchBlock) findPanel(actionData.catchBlock, targetId);
            }
        };

        findPanel(selectedActions, panelId);

        if (!panelToClone) {
            console.error('❌ handleClone: Panel not found:', panelId);
            return;
        }

        const actionType = actionRegistry.getActionTypeFromName(panelToClone.actionName);
        const ActionClass = actionRegistry.actions.get(actionType);

        if (ActionClass && ActionClass.clonePanel) {
            // clonePanel sẽ tự tạo ID mới cho panel và các con của nó
            const newPanel = ActionClass.clonePanel(panelToClone, null); // null for root level
            if (newPanel) {
                // Thêm panel đã nhân bản vào cấp cao nhất
                setSelectedActions(prev => [...prev, newPanel]);
            }
        } else {
            console.error('❌ handleClone: No clonePanel method found for:', actionType);
        }
    };
    
    /**
 * Hàm đệ quy để tính toán lại 'level' cho một panel và tất cả các con của nó.
 * @param {Object} panel - Panel cần tính toán lại.
 * @param {number} newLevel - Level mới để áp dụng cho panel này.
 * @returns {Object} - Một bản sao của panel với các level đã được cập nhật.
 */
const recalculateLevelsRecursively = (panel, newLevel, parentId = null) => {
    // Tạo một bản sao sâu để tránh thay đổi state gốc một cách không an toàn
    const newPanel = JSON.parse(JSON.stringify(panel));
    const actionData = getAction(newPanel);

    // Cập nhật level của action hiện tại
    if (actionData) {
        actionData.level = newLevel;
    }

    // Cập nhật parentId ở cấp panel
    newPanel.parentId = parentId;

    // Hàm trợ giúp để xử lý đệ quy cho các nhánh con
    const processBranch = (branchName) => {
        if (actionData[branchName] && Array.isArray(actionData[branchName])) {
            actionData[branchName] = actionData[branchName].map(childPanel =>
                recalculateLevelsRecursively(childPanel, newLevel + 1, newPanel.panelId)
            );
        }
    };

    processBranch('children');
    processBranch('thenBlock');
    processBranch('elseBlock');
    processBranch('yesBlock');
    processBranch('noBlock');
    processBranch('timeoutBlock');
    processBranch('tryBlock');
    processBranch('catchBlock');

    return newPanel;
};
    /**
    * Xử lý sự kiện thả vào container root.
    */
    const handleRootDrop = (draggedItem, containerId) => {
        console.log("🔍 handleRootDrop called:", { draggedItem, containerId });
        if (!draggedItem) {
            console.log("❌ No draggedItem provided");
            return;
        }

        const e = window.lastDropEvent;
        if (!e) {
            console.log("❌ No lastDropEvent found");
            return;
        }

        const dropResult = calculateDropIndex(e, selectedActions);
        console.log("🔍 calculateDropIndex result:", dropResult);
        
        if (!dropResult.available) {
            console.log("❌ Drop not available");
            return;
        }

        const targetIndex = dropResult.targetIndex;
        console.log("🔍 Target index:", targetIndex);

        // Case 2: Sắp xếp lại một panel đã có
        console.log("🔍 Processing panel drop:", draggedItem);
        
        // Nếu item được thả vào chính container root mà nó xuất phát
        if (draggedItem.sourceContainerId === 'root-container') {
            console.log("🔍 Reordering within root container");
            setSelectedActions(currentActions => {
                console.log("🔍 Current actions before reorder:", currentActions.length);
                const newActions = [...currentActions];
                const draggedIndex = newActions.findIndex(p => p.panelId === draggedItem.panelId);
                console.log("🔍 Dragged index:", draggedIndex);
                
                if (draggedIndex === -1) {
                    console.log("❌ Dragged item not found in current actions");
                    return currentActions;
                }

                const [movedItem] = newActions.splice(draggedIndex, 1);
                const finalIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
                newActions.splice(finalIndex, 0, movedItem);
                
                console.log("🔍 Actions after reorder:", newActions.length);
                console.log("🔍 Moved item to index:", finalIndex);
                
                return newActions;
            });
        } else {
                 // Item được kéo từ một container con ra root
                // 1. Tính toán lại level cho panel được kéo và tất cả các con của nó
                const panelWithUpdatedLevels = recalculateLevelsRecursively(draggedItem.data, 0, null); // Bắt đầu từ level 0 cho root, parentId = null

                console.log("🔍 panelWithUpdatedLevels", panelWithUpdatedLevels);
                // 2. Thêm panel đã cập nhật vào root
                setSelectedActions(prev => {
                    const newActions = [...prev];
                    newActions.splice(targetIndex, 0, panelWithUpdatedLevels);
                    return newActions;
                });

                // 3. Xóa item khỏi vị trí gốc trong container con
                setTimeout(() => handleActionRemove(draggedItem.panelId), 0);
        }
        
        // Force re-render
        setRenderKey(prev => prev + 1);
        console.log("🔍 Forced re-render with new renderKey");
    };
    // ====================================================================
    // ===== KẾT THÚC PHẦN LOGIC XỬ LÝ STATE ĐƯỢC VIẾT LẠI ===============
    // ====================================================================



    // hàm tìm phần tử theo panelId
    const findElementByPanelId = (containerElement, panelId) => {
        console.log("containerElement", panelId);
        const element = containerElement.querySelector(`[data-item-id="${panelId}"]`);
        return element;
    }

    // Helper function to calculate drop zones - copied from MissionDetail
    const calculateDropIndex = (e, actionChildren) => {
        const containerElement = e.currentTarget;
        if (!containerElement || !actionChildren) {
            return {
                targetIndex: null,
                available: false
            };
        }
        if (actionChildren.length == 0) {
            return {
                targetIndex: 0,
                available: true
            };
        }
        const containerRect = containerElement.getBoundingClientRect();
        const zones = [];
        // Calculate zones for each possible drop position
        for (let i = 0; i <= actionChildren.length; i++) {
            let zoneStart, zoneEnd;

            if (i === 0) {
                // Zone before first child
                const firstChild = findElementByPanelId(containerElement, actionChildren[0].panelId);
                if (firstChild) {
                    const firstChildRect = firstChild.getBoundingClientRect();
                    zoneStart = 0;
                    zoneEnd = firstChildRect.top - containerRect.top + firstChildRect.height / 2;
                }
            } else if (i === actionChildren.length) {
                // Zone after last child
                const lastChild = findElementByPanelId(containerElement, actionChildren[actionChildren.length - 1].panelId);
                if (lastChild) {
                    const lastChildRect = lastChild.getBoundingClientRect();
                    zoneStart = lastChildRect.bottom - containerRect.top - lastChildRect.height / 2;
                    zoneEnd = containerRect.height;
                }
            } else {
                // Zone between children
                const prevChild = findElementByPanelId(containerElement, actionChildren[i - 1].panelId);
                const currentChild = findElementByPanelId(containerElement, actionChildren[i].panelId);

                if (prevChild && currentChild) {
                    const prevChildRect = prevChild.getBoundingClientRect();
                    const currentChildRect = currentChild.getBoundingClientRect();
                    zoneStart = prevChildRect.bottom - containerRect.top - prevChildRect.height / 2;
                    zoneEnd = currentChildRect.top - containerRect.top + currentChildRect.height / 2;
                }
            }

            zones.push({
                index: i,
                start: zoneStart,
                end: zoneEnd,
                center: (zoneStart + zoneEnd) / 2
            });
        }

        const dropY = e.clientY - containerRect.top;
        let targetIndex = actionChildren.length;
        for (let i = 0; i < zones.length; i++) {
            if (dropY >= zones[i].start && dropY < zones[i].end) {
                targetIndex = zones[i].index;
                break;
            }
        }
        console.log("targetIndex", targetIndex);
        return {
            targetIndex: targetIndex,
            available: true
        };
    };



    // Add useEffect to monitor selectedActions changes
    useEffect(() => {
        console.log("🔍 selectedActions after render:", selectedActions);
        
    }, [selectedActions]);

    // Track component lifecycle
    useEffect(() => {
        return () => {
            console.log('🔄 MissionDetail: Component unmounting');
        };
    }, []);

    if (loading) {
        return (
            <div className="mission-detail-container">
                <div className="loading-message">Loading mission details...</div>
            </div>
        );
    }
    if (loadingsave) {
        return (
            <div className="mission-detail-container">
                <div className="loading-message">Saving mission...</div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="mission-detail-container">
                <div className="error-message">
                    {error}
                    <button onClick={() => window.location.reload()} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmenuSlide = (direction) => {
        console.log("🔍 handleSubmenuSlide called:", direction);
        
        // Tìm element submenu
        const submenuElement = document.querySelector('.submenu');
        if (!submenuElement) {
            console.warn('Submenu element not found');
            return;
        }

        // Tính toán scroll distance (có thể điều chỉnh)
        const scrollDistance = 200; // pixels
        
        if (direction === 'left') {
            // Scroll trái
            submenuElement.scrollBy({
                left: -scrollDistance,
                behavior: 'smooth'
            });
        } else if (direction === 'right') {
            // Scroll phải
            submenuElement.scrollBy({
                left: scrollDistance,
                behavior: 'smooth'
            });
        }

        // Cập nhật vị trí dropdown sau khi scroll
        setTimeout(() => {
            updateDropdownPosition();
        }, 300); // Đợi scroll animation hoàn thành
    };

    const updateDropdownPosition = () => {
        if (expandedGroup) {
            const activeSubmenuItem = document.querySelector(`.submenu-item.active`);
            if (activeSubmenuItem) {
                const rect = activeSubmenuItem.getBoundingClientRect();
                const dropdown = activeSubmenuItem.querySelector('.submenu-dropdown');
                if (dropdown) {
                    dropdown.style.left = rect.left + 'px';
                    dropdown.style.top = (rect.bottom + 5) + 'px';
                    dropdown.style.minWidth = rect.width + 'px';
                }
            }
        }
    };



    if (!mission) {
        return (
            <div className="mission-detail-container">
                <div className="error-message">Mission not found</div>
            </div>
        );
    }

    console.log("🔍 MissionDetail render - selectedActions:", selectedActions);
    
    return (
        <SettingsProvider onActionUpdate={handleActionUpdate} onRemove={handleActionRemove}>
            <div className="mission-detail-container" key={`mission-detail-${renderKey}`}>

                <ConfirmDialog
                    visible={showConfirm}
                    title={confirmData.title}
                    message={confirmData.message}
                    onConfirm={confirmData.onConfirm}
                    onCancel={() => setShowConfirm(false)}
                    isDelete={confirmData.title?.toLowerCase().includes('delete')}
                />
                <MessageDialog
                    visible={showMessage}
                    title={messageData.title}
                    message={messageData.message}
                    onClose={() => setShowMessage(false)}
                />
                <div className="submenu-container">
                    <ul className="submenu">
                        {groups.map((group) => (
                            <li
                                key={group.ID}
                                className={`submenu-item ${selectedGroup === group.ID ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGroupClick(group.ID, e);
                                }}
                            >
                                <div className="submenu-link">
                                    <span className="group-icon">{getGroupIcon(group.groupName)}</span>
                                    <span style={{ fontSize: '12px', paddingLeft: '5px' }}>{group.groupName}</span>
                                </div>
                                <ul className={`submenu-dropdown ${expandedGroup === group.ID ? 'show' : ''}`}>
                                    {(() => {
                                        const allItems = actions[group.ID] || [];
                                        const itemsPerPage = 9;
                                        const currentPage = submenuPageByGroup[group.ID] || 0;
                                        const totalPages = Math.ceil(allItems.length / itemsPerPage) || 1;
                                        const start = currentPage * itemsPerPage;
                                        const end = start + itemsPerPage;
                                        const pagedItems = allItems.slice(start, end);
                                        return (
                                            <>
                                                {pagedItems.map((action) => (
                                                    <li
                                                        key={`${(action.actionName || action.missionName || 'item')}-${uuidv4()}`}
                                                        className="submenu-dropdown-item"
                                                        draggable
                                                        onDragStart={(e) => handleMenuActionDragStart(e, action, group.ID)}
                                                        onDragEnd={handleMenuActionDragEnd}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleActionClick(action);
                                                        }}
                                                    >
                                                        <span className={`runner-icon-sublink ${action.User_create === 'true' || action.User_create === true ? 'mission-icon' : ''}`}></span>
                                                        <span style={{ fontSize: '12px', paddingLeft: '5px' }}>{action.missionName || action.actionName}</span>
                                                    </li>
                                                ))}
                                                {(!allItems || allItems.length === 0) && (
                                                    <li className="submenu-dropdown-item empty">
                                                        <span className="submenu-dropdown-link">
                                                            No actions available
                                                        </span>
                                                    </li>
                                                )}
                                                {allItems.length > itemsPerPage && (
                                                    <li className="submenu-pagination" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className="submenu-page-btn"
                                                            disabled={currentPage <= 0}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSubmenuPageByGroup(prev => ({
                                                                    ...prev,
                                                                    [group.ID]: Math.max(0, (prev[group.ID] || 0) - 1)
                                                                }));
                                                            }}
                                                        >
                                                            Prev
                                                        </button>
                                                        <span className="submenu-page-indicator">
                                                            {currentPage + 1} / {totalPages}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="submenu-page-btn"
                                                            disabled={currentPage >= totalPages - 1}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSubmenuPageByGroup(prev => ({
                                                                    ...prev,
                                                                    [group.ID]: Math.min(totalPages - 1, (prev[group.ID] || 0) + 1)
                                                                }));
                                                            }}
                                                        >
                                                            Next
                                                        </button>
                                                    </li>
                                                )}
                                            </>
                                        );
                                    })()}
                                </ul>
                            </li>
                        ))}
               
                    </ul>
                    <button className="submenu-slide" onClick={() => handleSubmenuSlide('left')}>
                            <span className="button-icon slide_left-icon"></span>
                        </button>
                        <button className="submenu-slide" onClick={() => handleSubmenuSlide('right')}>
                            <span className="button-icon slide_right-icon"></span>
                        </button>
                </div>
                <div className="page-header">
                    <div className="header-title">
                        <div className="mission-title-row">
                            <h2>{mission.missionName}</h2>
                            <button 
                                className="mission-edit-button"
                                onClick={() => navigate(`/setup/missions/edit/${mission.ID}`, { 
                                    state: { from: 'detail', missionId: mission.ID } 
                                })}
                                title="Edit Mission"
                            >
                                <img 
                                    src="/assets/icons/settings-black.png" 
                                    alt="Edit Mission"
                                    className="mission-edit-icon"
                                />
                            </button>
                        </div>
                        <span className="subtitle">Watch and edit the mission</span>
                    </div>
                    <div className="header-buttons">
                        <button className="btn-go-back" onClick={() => navigate('/setup/missions')}>
                            <span className="go-back-icon"></span>
                            Go Back
                        </button>
                        <button className="btn-save" onClick={() => handleSave()}>
                            <span className="save-icon"></span>
                            Save
                        </button>
                        <button className="btn-save-as" onClick={() => handleSaveAs()}>
                            <span className="save-as-icon"></span>
                            Save As
                        </button>
                        <button className="btn-delete" onClick={openDeleteMissionConfirm}>
                            <span className="delete-icon-white"></span>
                            Delete
                        </button>
                    </div>
                </div>

                <div className="mission-detail-content">
                    <div className="action-panels-container">
                        <ActionContainer containerId="root-container" onParentContentUpdate={handleParentContentUpdate} onDrop={handleRootDrop} handleClone={handleClone} onDragOver={(e) => e.preventDefault()}>
                            {console.log("🔍 selectedActions", selectedActions)}
                            
                            {selectedActions.map((panel) => {
                                const ActionComponent = actionRegistry.getAction(panel.type);
                                if (!ActionComponent) return null;
                                
                                return (
                                    <DraggableItem key={panel.panelId} panelId={panel.panelId} containerId="root-container" data={panel} type="panel">
                                        <ActionComponent
                                            action={panel}
                                            panelId={panel.panelId}
                                            onClone={(panelId) => handleClone(panelId)}
                                            onRemove={(panelId) => handleActionRemove(panelId)}
                                            onActionUpdate={handleActionUpdate}
                                            onParentContentUpdate={handleParentContentUpdate}
                                        />
                                    </DraggableItem>
                                );
                            })}
                        </ActionContainer>
                    </div>
                    <SettingsDialog points={points} markers={markers} actionsMap={actions} siteId={mission?.IDSite} />
                </div>

                {/* Save As Dialog */}
                {showSaveAsDialog && (
                    <div className="dialog-overlay">
                        <div className="dialog-modal">
                            <div className="response-dialog-header">
                                <div className="edit-icon"></div>
                                <h3>Save Mission As</h3>
                            </div>
                            
                            <div className="dialog-body">
                                <div className="dialog-input">
                                    <label>Mission Name:</label>
                                    <input
                                        type="text"
                                        value={saveAsName}
                                        onChange={(e) => setSaveAsName(e.target.value)}
                                        placeholder="Enter new mission name"
                                        disabled={loadingsave}
                                        className="form-group-input"
                                    />
                                    <div className="dialog-help-text">
                                        Enter a new name for this mission copy
                                    </div>
                                </div>
                            </div>
                            
                            <div className="dialog-actions">
                                <button 
                                    className="dialog-btn dialog-btn-secondary"
                                    onClick={handleSaveAsCancel}
                                    disabled={loadingsave}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="dialog-btn dialog-btn-primary"
                                    onClick={handleSaveAsConfirm}
                                    disabled={loadingsave}
                                >
                                    {loadingsave ? 'Saving...' : 'Save Mission'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </SettingsProvider>
    );
};

export default MissionDetail; 