import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { variableFromJson, variableToJson, generateActionId, generateNestedPanel, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionData, getActionId, getActionChildren, debugAction, getActionLevel, getAction } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import { useTouchSupport } from '../utils/touchHelper';

const MoveToCoordinateAction = ({
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


  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setIsSettingsOpen(true);

    // Update action data with isSettingsOpen state
    if (onActionUpdate) {
      onActionUpdate(panelId, { isSettingsOpen: true });
    }
    // Use SettingsContext to open settings
    openSettings(action, panelId, 'moveToCoordinate');
  };



  const handleCloneClick = (e) => {
    e.stopPropagation();

    // Gọi callback với action và panelId
    if (onClone && typeof onClone === 'function') {
      onClone(panelId);
    } else {
      console.warn('⚠️ MoveToCoordinateAction: onClone callback not provided or not a function');
      console.warn('⚠️ MoveToCoordinateAction: onClone type:', typeof onClone);
    }
  };

  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);

  // Helper function to get display value
  const getDisplayValue = (param) => {
    if (!action || !action[param]) return '0';

    const value = getAction(action)[param];
    console.log("getDisplayValue value", value);
    if (typeof value === 'object' && value !== null) {
      return value.variable || value.message || '0';
    }
    return value.toString() || '0';
  };

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
      data-level={getActionLevel(action)}
    >
      <div className="mission-action-content">
        <div className="mission-action-runner-icon-container" style={{ backgroundColor: iconBg }}>
          <span className="mission-action-runner-icon"></span>
        </div>
        <div className="mission-action-name-container">
          <span className="mission-action-name">Move To Coordinate</span>
          <ActionValueDisplay label="X" field={getAction(action).x} />
          <ActionValueDisplay label="Y" field={getAction(action).y} />
          <ActionValueDisplay label="Orientation" field={getAction(action).orientation} />
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



/**
 * Parse MoveToCoordinate action from database JSON format
 * @param {Object} action - Raw action data from database
 * @param {number} level - Level of the parent nested container
 * @param {Array} mapWithPoints - Array of maps with points data
 * @returns {Object} - Formatted MoveToCoordinate panel object
 */
MoveToCoordinateAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
  try {

    console.log(' MoveToCoordinateAction.parseFromDatabase called with action:', action);
    const actionPropertiesText = JSON.parse(action.Properties);
    const xVariable = variableFromJson(actionPropertiesText.X);
    const yVariable = variableFromJson(actionPropertiesText.Y);
    const orientationVariable = variableFromJson(actionPropertiesText.Orientation);
    const retriesVariable = variableFromJson(actionPropertiesText.Retries);
    const distanceThresholdVariable = variableFromJson(actionPropertiesText.Distance_threshold);
    const actionId = generateActionId().id;
    return {
      panelId: actionId,
      actionName: action.Action_name,
      type: 'moveToCoordinate',
      parentId: parentId,
      actions: [{
        id: actionId,
        name: action.Action_name,
        level: level,
        x: xVariable,
        y: yVariable,
        orientation: orientationVariable,
        retries: retriesVariable,
        distance_threshold: distanceThresholdVariable,
        user_create: action.User_create,
        type: action.Type
      }],
    };
  } catch (error) {
    console.error("Error parsing MoveToCoordinate action from database:", error, action);
    // Return a basic panel structure if parsing fails
    return null;
  }
};

/**
 * Transform MoveToCoordinate action to database JSON format
 * @param {Object} action - MoveToCoordinate action object
 * @returns {Object} - Database JSON format
 */
MoveToCoordinateAction.transformToDatabase = (action) => {
  console.log(' MoveToCoordinateAction.transformToDatabase called with action:', action);

  // Handle different data structures
  let moveToCoordinateAction = action;

  // If action has actions array (panel structure), get the first action
  if (action.actions && Array.isArray(action.actions) && action.actions.length > 0) {
    moveToCoordinateAction = action.actions[0];
  }

  console.log(' MoveToCoordinateAction: moveToCoordinateAction:', moveToCoordinateAction);

  // Create properties object with correct field order
  const properties = {
    "X": variableToJson(moveToCoordinateAction.x),
    "Y": variableToJson(moveToCoordinateAction.y),
    "Orientation": variableToJson(moveToCoordinateAction.orientation),
    "Retries": variableToJson(moveToCoordinateAction.retries),
    "Distance_threshold": variableToJson(moveToCoordinateAction.distance_threshold)
  };

  // Stringify the entire properties object
  const propertiesString = JSON.stringify(properties);

  console.log(' MoveToCoordinateAction: propertiesString:', propertiesString);

  return {
    "Action_name": "Move To Coordinate",
    "Properties": propertiesString,
    "Type": "4", // New type for MoveToCoordinate
    "User_create": "false"
  };
};

/**
 * Create a new MoveToCoordinate panel
 * @param {Object} action - MoveToCoordinate action object
 * @returns {Object} - New MoveToCoordinate panel object
 */
MoveToCoordinateAction.createPanel = (action) => {

  console.log(' MoveToCoordinateAction.createPanel called with action:', action);
  const actionId = generateActionId().id;
  return {
    panelId: actionId,
    actionName: 'MoveToCoordinate',
    type: 'moveToCoordinate',
    parentId: null,
    actions: [{
      id: actionId,
      name: 'MoveToCoordinate',
      level: 0,
      x: {
        message: '',
        useVariable: 'false',
        variable: '0'
      },
      y: {
        message: '',
        useVariable: 'false',
        variable: '0'
      },
      orientation: {
        message: '',
        useVariable: 'false',
        variable: '0'
      },
      retries: {
        message: '',
        useVariable: 'false',
        variable: '10'
      },
      distance_threshold: {
        message: '',
        useVariable: 'false',
        variable: '0.1'
      },
      user_create: "false",
      type: action.type || "4"
    }]
  };
};

/**
 * Clone a MoveToCoordinate panel
 * @param {Object} originalPanel - Original MoveToCoordinate panel object
 * @param {string} parentId - ID of the parent panel
 * @param {number} level - Level of the parent nested container
 * @returns {Object} - Cloned MoveToCoordinate panel object
 */
MoveToCoordinateAction.clonePanel = (originalPanel, parentId = null, level = null) => {
  // create new panel with new ID
  const actionId = generateActionId().id;

  //deep clone actions
  const clonedActions = originalPanel.actions ?
    JSON.parse(JSON.stringify(originalPanel.actions)) : [];

  // create new panel with all properties of original panel
  const newPanel = {
    ...originalPanel,
    panelId: actionId,
    parentId: parentId,
    actions: clonedActions.map((action, index) => ({
      ...action,
      id: actionId,
      level: level || 0,
    }))
  };

  return newPanel;
};


export default MoveToCoordinateAction;
