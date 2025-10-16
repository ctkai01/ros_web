import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { variableFromJson, variableToJson, generateActionId, generateNestedPanel, getActionName } from '../utils/actionIdGenerator';
import { getActionLevel, getAction } from '../utils/actionHelper';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { useTouchSupport } from '../utils/touchHelper';

const WaitAction = ({
  action = {},
  panelId,
  onClone, // Callback function
  onActionUpdate,
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
      onClone(action, panelId);
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
    openSettings(action, panelId, 'wait');
  };

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
      data-level={getActionLevel(action)}
    >
      <div className="mission-action-content">
        <div className="mission-action-runner-icon-container" style={{ backgroundColor: iconBg }}>
          <span className="mission-action-runner-icon"></span>
        </div>
        <div className="mission-action-name-container">
          <span className="mission-action-name">Wait for</span>
          {(() => {
            const a = getAction(action) || action;
            const timeField = a.time || { userVariable: 'false', variable: '5' };
            const useVar = timeField.userVariable === 'true' || timeField.useVariable === true || timeField.useVariable === 'true';
            let display = '';
            if (useVar) {
              // try parse message array with is_current
              try {
                let msg = timeField.message;
                if (typeof msg === 'string') {
                  const parsed = JSON.parse(msg);
                  if (Array.isArray(parsed)) msg = parsed;
                }
                if (Array.isArray(msg)) {
                  const cur = msg.find(m => m && m.is_current);
                  display = (cur && cur.text) || '';
                } else if (typeof msg === 'string') {
                  display = msg;
                } else if (msg && typeof msg === 'object') {
                  display = msg.text || '';
                }
              } catch (_) {
                display = '';
              }
            } else {
              const seconds = Math.max(0, parseInt(timeField.variable || '5') || 0);
              const h = Math.floor(seconds / 3600);
              const m = Math.floor((seconds % 3600) / 60);
              const s = seconds % 60;
              const pad = (n) => n.toString().padStart(2, '0');
              display = `${pad(h)}:${pad(m)}:${pad(s)}`;
            }
            return (
              <span
                className="mission-action-value"
                style={{ backgroundColor: useVar ? '#d6d2d6' : 'white' }}
              >
                {display}
              </span>
            );
          })()}
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



// Static methods for data processing (moved from WaitAction class)
/**
 * Parse Wait action from database JSON format
 * @param {Object} action - Raw action data from database
 * @param {number} index - Index in the actions array
 * @param {Array} mapWithPoints - Array of maps with points data
 * @returns {Object} - Formatted Wait panel object
 */
WaitAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
  try {
    const actionPropertiesText = JSON.parse(action.Properties);
    console.log('🔍 SERVER DEBUG - actionPropertiesText:', actionPropertiesText);
    const timeVariable = variableFromJson(actionPropertiesText.Time);
    console.log('🔍 SERVER DEBUG - timeVariable:', timeVariable);

    const actionId = generateActionId();
    return {
      panelId: actionId.id,
      actionName: action.Action_name,
      type: 'wait',
      parentId: parentId,
      actions: [{
        id: actionId.id,
        name: action.Action_name,
        level: level,
        time: timeVariable,
        user_create: action.User_create,
        type: action.Type
      }],
    };
  } catch (error) {
    console.error("Error parsing Wait action from database:", error, action);
    return {
      null: null
    };
  }
};


/**
 * Transform Wait action to database JSON format
 * @param {Object} action - Wait action object
 * @returns {Object} - Database JSON format
 */
WaitAction.transformToDatabase = (action) => {

  // Handle different data structures
  let waitAction = action;

  // If action has actions array (panel structure), get the first action
  if (action.actions && Array.isArray(action.actions) && action.actions.length > 0) {
    waitAction = action.actions[0];
  }

  // Create properties object with correct field order
  const properties = {
    "Time": variableToJson(waitAction.time)
  };

  // Stringify the entire properties object
  const propertiesString = JSON.stringify(properties);


  console.log('🔍 SERVER DEBUG - propertiesString:', propertiesString);
  return {
    "Action_name": "Wait",
    "Properties": propertiesString,
    "Type": "15",
    "User_create": "false"
  };
};


/**
 * Tạo panel cho Wait action từ menu
 * @param {Object} action - Action từ menu
 * @returns {Object} - Panel object
 */
WaitAction.createPanel = (action) => {
  const actionId = generateActionId().id;

  return {
    panelId: actionId,
    actionName: 'Wait',
    type: 'wait',
    isSettingsOpen: false,
    parentId: null,
    actions: [{
      id: actionId,
      name: 'Wait',
      level: 0,
      time: {
        message: "",
        userVariable: "false",
        variable: "5"
      },
      user_create: "false",
      type: action.type || "15"
    }]
  };
};

/**
 * Clone một Wait panel với tất cả properties của nó
 * @param {Object} originalPanel - Panel gốc cần clone
 * @param {string} parentId - ID của parent mới (nếu có)
 * @returns {Object} - Panel đã clone
 */
WaitAction.clonePanel = (originalPanel, parentId = null, level = null) => {

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
      level: level || 0,
      id: newPanelId,
    }))
  };

  return clonedPanel;
};


export default WaitAction; 