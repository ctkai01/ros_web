import React, { useState, useEffect } from 'react';
import './MoveAction.css';
import '../ActionStyle.css';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { variableFromJson, variableToJson, generateActionId, generateNestedPanel, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionData, getActionId, getActionChildren, debugAction, getActionLevel, getAction } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import { useTouchSupport } from '../utils/touchHelper';

const MoveAction = ({
  action = {},
  panelId,
  onClone, // Callback function
  onActionUpdate, // Callback function to update action data
  onRemove,
  onAddToSelected,
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

  // Log when component re-renders
  useEffect(() => {
  }, [panelId, renderKey]);

  // Sync isSettingsOpen with action state
  useEffect(() => {
    const actionData = getAction(action);
    if (actionData && actionData.isSettingsOpen !== undefined) {
      setIsSettingsOpen(actionData.isSettingsOpen);
    }
  }, [action]);

  const handleCloneClick = (e) => {
    e.stopPropagation();

    // Gọi callback với action và panelId
    if (onClone && typeof onClone === 'function') {
      onClone( panelId);
    } else {
      console.warn('⚠️ MoveAction: onClone callback not provided or not a function');
      console.warn('⚠️ MoveAction: onClone type:', typeof onClone);
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
    openSettings(action, panelId, 'move');
  };

  // Create touch handlers for buttons
  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);



  // Compute colors by level
  const level = getActionLevel(action) || 0;
  const panelBg = getPanelColorForLevel(level);
  const iconBg = getIconColorForLevel(level);

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
      data-action-name={getActionName(action.id)}
      data-level={level}
    >
      <div className="mission-action-content">
        <div className="mission-action-runner-icon-container" style={{ backgroundColor: iconBg }}>
          <span className="mission-action-runner-icon"></span>
        </div>
        <div className="mission-action-name-container">
          <span className="mission-action-name">Move to</span>
          <ActionValueDisplay field={getAction(action).position} name={getAction(action).positionName} />
        </div>
      </div>
      <div className="mission-action-buttons">
        <button
          className="mission-action-copy-button"
          onClick={handleCloneClick}
          {...cloneTouchHandlers}
        >
          <span className="mission-action-copy-icon"></span>
        </button>
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



// Static methods for data processing (moved from MoveAction class)
/**
 * Parse Move action from database JSON format
 * @param {Object} action - Raw action data from database
 * @param {number} level - Level of the parent nested container
 * @param {Array} mapWithPoints - Array of maps with points data
 * @returns {Object} - Formatted Move panel object
 */
MoveAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
  try {
    const actionPropertiesText = JSON.parse(action.Properties);
    const positionVariable = variableFromJson(actionPropertiesText.Position);
    const retriesVariable = variableFromJson(actionPropertiesText.Retries);
    const distanceThresholdVariable = variableFromJson(actionPropertiesText.Distance_threshold);
    const positionId = positionVariable.variable;
    let positionName = '';

    // Find position name from points
    if (positionId && mapWithPoints) {
      for (const mapGroup of mapWithPoints) {
        const point = mapGroup.points.find(p => p.ID == positionId);
        if (point) {
          positionName = point.PointName;
          break;
        }
      }
    }

    const actionId = generateActionId().id;
    return {
      panelId: actionId,
      actionName: action.Action_name,
      type: 'move',
      parentId: parentId,
      actions: [{
        id: actionId,
        name: action.Action_name,
        level: level,
        position: positionVariable,
        positionName: positionName,
        retries: retriesVariable,
        distance_threshold: distanceThresholdVariable,
        user_create: action.User_create,
        type: action.Type
      }],
    };
  } catch (error) {
    console.error("Error parsing Move action from database:", error, action);
    return {
      null: null
    };
  }
};

/**
 * Transform Move action to database JSON format
 * @param {Object} action - Move action object
 * @returns {Object} - Database JSON format
 */
MoveAction.transformToDatabase = (action) => {

  // Handle different data structures
  let moveAction = action;

  // If action has actions array (panel structure), get the first action
  if (action.actions && Array.isArray(action.actions) && action.actions.length > 0) {
    moveAction = action.actions[0];
  }


  // Create properties object with correct field order
  const properties = {
    "Distance_threshold": variableToJson(moveAction.distance_threshold),
    "Position": variableToJson(moveAction.position),
    "Retries": variableToJson(moveAction.retries)
  };

  // Stringify the entire properties object
  const propertiesString = JSON.stringify(properties);

  return {
    "Action_name": "Move",
    "Properties": propertiesString,
    "Type": "3",
    "User_create": "false"
  };
};


/**
 * Tạo panel cho Move action từ menu
 * @param {Object} action - Action từ menu
 * @returns {Object} - Panel object
 */
MoveAction.createPanel = (action) => {
  const actionId = generateActionId().id;
  return {
    panelId: actionId,
    actionName: 'Move',
    type: 'move',
    parentId: null,
    actions: [{
      id: actionId,
      name: 'Move',
      level: 0,
      position: {
        message: "",
        userVariable: "false",
        variable: ""
      },
      positionName: '',
      retries: {
        message: "",
        userVariable: "false",
        variable: "10"
      },
      distance_threshold: {
        message: "",
        userVariable: "false",
        variable: "0.1"
      },
      user_create: "false",
      type: action.type || "3"
    }]
  };
};

/**
 * Clone một Move panel với tất cả properties của nó
 * @param {Object} originalPanel - Panel gốc cần clone
 * @param {string} parentId - ID của parent mới (nếu có)
 * @param {number} level - Level của parent
 * @returns {Object} - Panel đã clone
 */
MoveAction.clonePanel = (originalPanel, parentId = null, level = null) => {
  // Generate new panelId for the cloned panel
  const newPanelId = generateActionId().id;
  
  // Deep clone actions
  const clonedActions = originalPanel.actions ?
    JSON.parse(JSON.stringify(originalPanel.actions)) : [];

  const clonedPanel = {
    ...originalPanel,
    panelId: newPanelId, // Use new panelId instead of original
    parentId: parentId, // Override parentId at panel level
    actions: clonedActions.map((action, index) => ({
      ...action,
      id: newPanelId,
      level: level || 0
    }))
  };

  return clonedPanel;
};



export default MoveAction; 