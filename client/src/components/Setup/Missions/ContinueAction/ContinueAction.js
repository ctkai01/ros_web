import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import { useSettings } from '../SettingsContext';
import { generateActionId } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionLevel, getAction } from '../utils/actionHelper';
import { useTouchSupport } from '../utils/touchHelper';

const ContinueAction = ({
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
    openSettings(action, panelId, 'continue');
  };

  // Create touch handlers for buttons (after function definitions)
  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);

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
      data-level={level}
      data-action-name="Continue"
    >
      <div className="mission-action-content">
        <div className="mission-action-runner-icon-container" style={{ backgroundColor: iconBg }}>
          <span className="mission-action-runner-icon"></span>
        </div>
        <div className="mission-action-name-container">
          <span className="mission-action-name">Continue</span>
        </div>
      </div>
      <div className="mission-action-buttons">
        <button className="mission-action-copy-button" onClick={handleCloneClick} {...cloneTouchHandlers}>
          <span className="mission-action-copy-icon"></span>
        </button>
        <button
          className={`mission-action-settings-button ${isSettingsOpen ? 'settings-open' : ''}`}
          onClick={handleSettingsClick} {...settingsTouchHandlers}
        >
          <span className="mission-action-settings-icon"></span>
        </button>
      </div>
    </div>
  );
};

// Parse from DB
ContinueAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
  try {
    const actionId = generateActionId().id;
    return {
      panelId: actionId,
      actionName: action.Action_name || 'Continue',
      type: 'continue',
      parentId: parentId,
      actions: [{
        id: actionId,
        name: 'Continue',
        level: level || 0,
        user_create: action.User_create,
        type: action.Type
      }]
    };
  } catch (e) {
    console.error('Error parsing Continue action from database:', e, action);
    return null;
  }
};

// Transform to DB
ContinueAction.transformToDatabase = (panel) => {
  let act = panel;
  if (panel.actions && Array.isArray(panel.actions) && panel.actions.length > 0) {
    act = panel.actions[0];
  }
  return {
    Action_name: 'Continue',
    Properties: '{}',
    Type: '10',
    User_create: 'false'
  };
};

// Create from menu
ContinueAction.createPanel = (actionFromMenu) => {
  const actionId = generateActionId().id;
  return {
    panelId: actionId,
    actionName: 'Continue',
    type: 'continue',
    parentId: null,
    actions: [{
      id: actionId,
      name: 'Continue',
      level: 0,
      user_create: 'false',
      type: actionFromMenu?.ID || '10'
    }]
  };
};

// Clone
ContinueAction.clonePanel = (originalPanel, parentId = null, level = null) => {
  const newPanelId = generateActionId().id;
  const clonedActions = originalPanel.actions ? JSON.parse(JSON.stringify(originalPanel.actions)) : [];
  return {
    ...originalPanel,
    panelId: newPanelId,
    parentId: parentId,
    actions: clonedActions.map(a => ({ ...a, id: newPanelId, level: level || 0 }))
  };
};

export default ContinueAction;


