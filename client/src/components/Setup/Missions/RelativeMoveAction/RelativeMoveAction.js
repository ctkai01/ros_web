import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { variableFromJson, variableToJson, generateActionId, generateNestedPanel, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionData, getActionId, getActionChildren, debugAction, getActionLevel, getAction } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import { useTouchSupport } from '../utils/touchHelper';

const RelativeMoveAction = ({ 
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
    openSettings(action, panelId, 'relativeMove');
  };



  const handleCloneClick = (e) => {
    e.stopPropagation();

    // Gọi callback với action và panelId
    if (onClone && typeof onClone === 'function') {
      onClone(panelId);
    } else {
      console.warn('⚠️ RelativeMoveAction: onClone callback not provided or not a function');
      console.warn('⚠️ RelativeMoveAction: onClone type:', typeof onClone);
    }
  };

  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);

  // Helper function to get display value
  const getDisplayValue = (param) => {
    if (!action || !action[param]) return '0';
    
    const value = action[param];
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
          <span className="mission-action-name">Relative Move</span>
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
 * Parse RelativeMove action from database JSON format
 * @param {Object} action - Raw action data from database
 * @param {number} level - Level of the parent nested container
 * @param {Array} mapWithPoints - Array of maps with points data
 * @returns {Object} - Formatted RelativeMove panel object
 */
RelativeMoveAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
  try {
    const actionPropertiesText = JSON.parse(action.Properties);
    const xVariable = variableFromJson(actionPropertiesText.X);
    const yVariable = variableFromJson(actionPropertiesText.Y);
    const orientationVariable = variableFromJson(actionPropertiesText.Orientation);
    const collisionDetectionVariable = variableFromJson(actionPropertiesText.CollisionDetection);
    const maxAngularSpeedVariable = variableFromJson(actionPropertiesText.MaxAngularSpeed);
    const maxLinearSpeedVariable = variableFromJson(actionPropertiesText.MaxLinearSpeed);
    const actionId = generateActionId().id;
    return {
      panelId: actionId,
      actionName: action.Action_name,
      type: 'relativeMove',
      parentId: parentId,
      actions: [{
        id: actionId,
        name: action.Action_name,
        level: level,
        x: xVariable,
        y: yVariable,
        orientation: orientationVariable,
        collisionDetection: collisionDetectionVariable,
        maxAngularSpeed: maxAngularSpeedVariable,
        maxLinearSpeed: maxLinearSpeedVariable,
        user_create: action.User_create,
        type: action.Type
      }],
    };
  } catch (error) {
    console.error("Error parsing Move action from database:", error, action);
    // Return a basic panel structure if parsing fails
    return null;
  }
};

/**
 * Transform RelativeMove action to database JSON format
 * @param {Object} action - RelativeMove action object
 * @returns {Object} - Database JSON format
 */
RelativeMoveAction.transformToDatabase = (action) => {
  console.log(' RelativeMoveAction.transformToDatabase called with action:', action);
  
  // Handle different data structures
  let relativeMoveAction = action;

  // If action has actions array (panel structure), get the first action
  if (action.actions && Array.isArray(action.actions) && action.actions.length > 0) {
      relativeMoveAction = action.actions[0];
  }

  console.log(' RelativeMoveAction: relativeMoveAction:', relativeMoveAction);
  
  // Create properties object with correct field order
  const properties = {
      "X": variableToJson(relativeMoveAction.x),
      "Y": variableToJson(relativeMoveAction.y),
      "Orientation": variableToJson(relativeMoveAction.orientation),
      "CollisionDetection": variableToJson(relativeMoveAction.collisionDetection),
      "MaxAngularSpeed": variableToJson(relativeMoveAction.maxAngularSpeed),
      "MaxLinearSpeed": variableToJson(relativeMoveAction.maxLinearSpeed)
  };

  // Stringify the entire properties object
  const propertiesString = JSON.stringify(properties);
  
  console.log(' RelativeMoveAction: propertiesString:', propertiesString);

  return {
      "Action_name": "Relative Move",
      "Properties": propertiesString,
      "Type": "5",
      "User_create": "false"
  };
};

/**
 * Create a new RelativeMove panel
 * @param {Object} action - RelativeMove action object
 * @returns {Object} - New RelativeMove panel object
 */
RelativeMoveAction.createPanel = (action) => {

  const actionId = generateActionId().id;
  return {
      panelId: actionId,
      actionName: 'RelativeMove',
      type: 'relativeMove',
      parentId: null,
      actions: [{
          id: actionId,
          name: 'RelativeMove',
          level: 0,
          x: {
              message: '',
              useVariable: false,
              variable: '0'
          },
          y: {
              message: '',
              useVariable: false,
              variable: '0'
          },
          orientation: {
              message: '',
              useVariable: false,
              variable: '0'
          },
          collisionDetection: {
              message: '',
              useVariable: false,
              variable: 'true'
          },
          maxAngularSpeed: {
              message: '',
              useVariable: false,
              variable: '0.6'
          },
          maxLinearSpeed: {
              message: '',
              useVariable: false,
              variable: '0.3'
          },
          user_create: "false",
          type: action.type || "5"
      }]
  };
};

/**
 * Clone a RelativeMove panel
 * @param {Object} originalPanel - Original RelativeMove panel object
 * @param {string} parentId - ID of the parent panel
 * @param {number} level - Level of the parent nested container
 * @returns {Object} - Cloned RelativeMove panel object
 */
RelativeMoveAction.clonePanel = (originalPanel, parentId = null, level = null) => {
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


export default RelativeMoveAction; 