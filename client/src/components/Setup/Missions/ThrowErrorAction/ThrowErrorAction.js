import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import { useSettings } from '../SettingsContext';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionLevel, getAction } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import { variableFromJson, variableToJson, generateActionId, generateNestedPanel, getActionName } from '../utils/actionIdGenerator';
import { useTouchSupport } from '../utils/touchHelper';

const ThrowErrorAction = ({
  action = {},
  panelId,
  onClone,
  onActionUpdate,
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
    openSettings(action, panelId, 'throwError');
  };

  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);

  const level = getActionLevel(action) || 0;
  const panelBg = getPanelColorForLevel(level);
  const iconBg = getIconColorForLevel(level);

  // Get error data from action properties
  const actionData = getAction(action);

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
      data-action-name="Throw Error"
    >
      <div className="mission-action-content">
        <div className="mission-action-runner-icon-container" style={{ backgroundColor: iconBg }}>
          <span className="mission-action-runner-icon"></span>
        </div>
        <div className="mission-action-name-container">
          <span className="mission-action-name">Throw Error</span>
          <ActionValueDisplay 
            field={actionData.description} 
          />
        </div>
      </div>
      <div className="mission-action-buttons">
        <button className="mission-action-copy-button" onClick={handleCloneClick} {...cloneTouchHandlers}>
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

// Parse from DB
ThrowErrorAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
  try {
    const actionPropertiesText = JSON.parse(action.Properties);
    const descriptionVariable = variableFromJson(actionPropertiesText.Description);
    const actionId = generateActionId().id;
    return {
      panelId: actionId,
      actionName: action.Action_name || 'Throw Error',
      type: 'throwError',
      parentId: parentId,
      actions: [{
        id: actionId,
        name: action.Action_name,
        level: level || 0,
        description: descriptionVariable,
        user_create: action.User_create,
        type: action.Type
      }]
    };
  } catch (e) {
    console.error('Error parsing Throw Error action from database:', e, action);
    return null;
  }
};

// Transform to DB
ThrowErrorAction.transformToDatabase = (panel) => {
  const actionData = getAction(panel);
  
  return {
    Action_name: 'Throw Error',
    Properties: JSON.stringify({
      Description: variableToJson(actionData.description) || 'Error message',
    }),
    Type: '18',
    User_create: 'false'
  };
};

// Create from menu
ThrowErrorAction.createPanel = (actionFromMenu) => {
  const actionId = generateActionId().id;
  return {
    panelId: actionId,
    actionName: 'Throw Error',
    type: 'throwError',
    parentId: null,
    actions: [{
      id: actionId,
      name: 'Throw Error',
      level: 0,
      user_create: 'false',
      type: actionFromMenu?.ID || '18',
      description: [
        {
          userVariable: 'false',
          variable: '',
          message: ''
        }
      ]
    }]
  };
};

// Clone
ThrowErrorAction.clonePanel = (originalPanel, parentId = null, level = null) => {
  const newPanelId = generateActionId().id;
  const clonedActions = originalPanel.actions ? JSON.parse(JSON.stringify(originalPanel.actions)) : [];
  return {
    ...originalPanel,
    panelId: newPanelId,
    parentId: parentId,
    actions: clonedActions.map(a => ({ ...a, id: newPanelId, level: level || 0 }))
  };
};

export default ThrowErrorAction;
