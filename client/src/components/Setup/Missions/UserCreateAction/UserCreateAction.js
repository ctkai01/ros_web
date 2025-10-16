import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import { useSettings } from '../SettingsContext';
import { generateActionId, variableFromJson, variableToJson } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionLevel, getAction } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import { useTouchSupport } from '../utils/touchHelper';

const UserCreateAction = ({
  action = {},
  panelId,
  onClone,
  onActionUpdate,
  onRemove,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging = false,
  renderKey = 0
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { openSettings } = useSettings();

  useEffect(() => {}, [panelId, renderKey]);

  // Sync isSettingsOpen with action state
  useEffect(() => {
    const actionData = getAction(action);
    if (actionData && actionData.isSettingsOpen !== undefined) {
      setIsSettingsOpen(actionData.isSettingsOpen);
    }
  }, [action]);

  const handleCloneClick = (e) => {
    e.stopPropagation();
    if (onClone && typeof onClone === 'function') {
      onClone(panelId);
    }
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setIsSettingsOpen(true);
    // Update action data with isSettingsOpen state
    if (onActionUpdate) {
      onActionUpdate(panelId, { isSettingsOpen: true });
    }
    // Use SettingsContext to open settings
    openSettings(action, panelId, 'userCreate');
  };

  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);

  const level = getActionLevel(action) || 0;
  const panelBg = getPanelColorForLevel(level);
  const iconBg = getIconColorForLevel(level);

  // Determine mission display: if variable userVariable is true -> blank; else show mission name if available
  const idMission = action?.IDMission;
  const usesUserVariable = idMission && typeof idMission === 'object' && (idMission.userVariable === 'true' || idMission.userVariable === true);
  const missionLabel = usesUserVariable ? '' : (action?.missionName || '');

  console.log(" UserCreateAction action", action);
  return (
    <div
      className={`mission-action-panel-nav ${isDragging ? 'dragging' : ''}`}
      style={{ backgroundColor: panelBg }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'none';
        e.currentTarget.style.cursor = 'not-allowed';
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.currentTarget.style.cursor = 'move';
      }}
      onDrop={onDrop}
      data-level={level}
      data-action-name="UserAction"
    >
      <div className="mission-action-content">
        <div className="mission-action-runner-icon-container" style={{ backgroundColor: iconBg }}>
          <span className="mission-action-runner-icon"></span>
        </div>
        <div className="mission-action-name-container">
          <ActionValueDisplay field={getAction(action).IDMission} name={getAction(action).missionName} />
        </div>
      </div>
      <div className="mission-action-buttons">
        {onRemove && (
          <button className="mission-action-copy-button" onClick={handleCloneClick} {...cloneTouchHandlers}>
            <span className="mission-action-copy-icon"></span>
          </button>
        )}
        <button
          className={`mission-action-settings-button ${isSettingsOpen ? 'settings-open' : ''}`}
          onClick={handleSettingsClick}
          {...settingsTouchHandlers}
        >
          <span className="mission-action-settings-icon"></span>
        </button>
      </div>
    </div>
  );
};

// Parse from DB (user-created mission)
UserCreateAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {

  console.log("UserCreateAction.parseFromDatabase called with action:", action);
  try {
    const actionId = generateActionId().id;
    let props = {};
    try {
      props = action && action.Properties ? JSON.parse(action.Properties) : {};
    } catch (_) {
      props = {};
    }

    // Use variableFromJson to parse IDMission field like MoveAction does
    const idMissionVar = variableFromJson(props.IDMission);
    const description = props.Description || action.description || '';
    let missionName = props.MissionName || action.missionName || '';
    const groupID = props.groupID || action.groupID || '';

    // Find mission name from actionsMap if not provided
    if (!missionName && idMissionVar.variable && Object.keys(actionsMap).length > 0) {
      // Search through all groups in actionsMap
      for (const groupId in actionsMap) {
        const groupActions = actionsMap[groupId];
        const mission = groupActions.find(m => m.missionID == idMissionVar.variable);
        if (mission) {
          missionName = mission.missionName || '';
          break;
        }
      }
    }

    return {
      panelId: actionId,
      actionName: 'userCreate',
      type: 'userCreate',
      parentId: parentId,
      actions: [{
        id: actionId,
        name: 'userCreate',
        level: level || 0,
        groupID: groupID,
        IDMission: idMissionVar,
        user_create: action.User_create === 'true' || action.User_create === true ? 'true' : 'true',
        type: action.Type || '0',
        description: description,
        missionName: missionName
      }]
    };
  } catch (e) {
    console.error('Error parsing UserCreate action from database:', e, action);
    return null;
  }
};

// Transform to DB (store minimal info)
UserCreateAction.transformToDatabase = (panel) => {
  const action = getAction(panel);
  return {
    Mission_id: action.IDMission.variable || '',
    Mission_name: action.missionName || 'User Action',
    Properties: JSON.stringify({ 
      Description: action.description || '', 
      IDMission: variableToJson(action.IDMission || { message: '', userVariable: 'true', variable: '' })
    }),
    User_create: 'true'
  };
};

// Create from menu
UserCreateAction.createPanel = (actionFromMenu) => {

  console.log("actionFromMenu", actionFromMenu);
  const actionId = generateActionId().id;
  return {
    panelId: actionId,
    actionName: 'userCreate',
    type: 'userCreate',
    parentId: null,
    actions: [{
      id: actionId,
      name: 'userCreate',
      missionName: actionFromMenu?.missionName || 'User Action',
      level: 0,
      groupID: String(actionFromMenu?.groupID) || "",
      IDMission: {
        message: "",
        userVariable: "false",
        variable: String(actionFromMenu?.missionID) || ""
      },
      user_create: 'true',
      type: '0',
      description: actionFromMenu?.description || ''
    }]
  };
};

// Clone
UserCreateAction.clonePanel = (originalPanel, parentId = null, level = null) => {
  const newPanelId = generateActionId().id;
  const clonedActions = originalPanel.actions ? JSON.parse(JSON.stringify(originalPanel.actions)) : [];
  return {
    ...originalPanel,
    panelId: newPanelId,
    parentId: parentId,
    actions: clonedActions.map(a => ({ ...a, id: newPanelId, level: level || 0 }))
  };
};

export default UserCreateAction;


