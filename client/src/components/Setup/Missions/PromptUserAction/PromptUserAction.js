import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import { useSettings } from '../SettingsContext';
import { variableFromJson, variableToJson, generateActionId, generateNestedParentId, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import ActionContainer from '../ActionContainer';
import DraggableItem from '../DraggableItem';
import { getAction, getActionLevel } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import ActionParentContent from '../common/ActionParentContent';
import actionRegistry from '../ActionRegistry';
import { useTouchSupport } from '../utils/touchHelper';

const PromptUserAction = ({
  action,
  panelId,
  onClone,
  draggable = false,
  onDragStart,
  onDragEnd,
  onRemove,
  onActionUpdate,
  onParentContentUpdate,
  isDragging = false
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentIsExpanded, setCurrentIsExpanded] = useState(true);
  const { openSettings } = useSettings();


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
    if (onActionUpdate) {
      onActionUpdate(panelId, { isSettingsOpen: true });
    }
    openSettings(action, panelId, 'promptUser');
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setCurrentIsExpanded(!currentIsExpanded);
  };
  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);
  const toggleTouchHandlers = useTouchSupport(handleToggleExpand);

  const level = getActionLevel(action) || 0;
  const promptUserBg = getPanelColorForLevel(level);
  const promptUserIconBg = getIconColorForLevel(level);

  const promptUserActionData = getAction(action);

  return (
    <div className="mission-action-panel-parent">
      {/* Header Panel */}
      <div
        className={`mission-action-panel-nav ${isDragging ? 'dragging' : ''}`}
        style={{ backgroundColor: promptUserBg }}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        data-action-name={getActionName(action.id)}
        data-level={getActionLevel(action)}
      >
        <div className="mission-action-content">
          <div className="mission-action-runner-icon-container" style={{ backgroundColor: promptUserIconBg }}>
            <span className="mission-action-runner-icon"></span>
          </div>
          <div className="mission-action-name-container">
            <span className="mission-action-name">Prompt User</span>
            <div className="mission-action-condition">
              <ActionValueDisplay
                label="Question"
                field={promptUserActionData.question}
              />
              <ActionValueDisplay
                label="Group"
                field={promptUserActionData.userGroupID}
              />
              <ActionValueDisplay
                label="Timeout"
                field={promptUserActionData.timeout}
              />
            </div>
          </div>
        </div>
        <div className="mission-action-buttons">
          <button
            className={`mission-action-toggle-button ${currentIsExpanded ? 'expanded' : ''}`}
            onClick={handleToggleExpand}
            {...toggleTouchHandlers}
          >
            <span className="mission-action-toggle-icon"></span>
          </button>
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

      {/* Content Panels */}
      <div className={`mission-action-parent-content-area-container ${currentIsExpanded ? 'expanded' : 'collapsed'}`}>
    
          {/* --- NHÁNH YES --- */}
          <div className="mission-action-branch-container">
            <div className="mission-action-content-subtitle">
              Yes
            </div>
            <ActionParentContent
              key={`${panelId}-yesBlock`}
              parentAction={{
                ...action,
                panelId: `${panelId}-yesBlock`,
                containerId: `${panelId}-yesBlock`
              }}
              onClone={onClone}
              onSettings={null}
              branchName="yesBlock"
              onRemove={onRemove}
              onActionUpdate={onActionUpdate}
              onParentContentUpdate={onParentContentUpdate}
            />
          </div>

          {/* --- NHÁNH NO --- */}
          <div className="mission-action-branch-container">
            <div className="mission-action-content-subtitle">
              No
            </div>
            <ActionParentContent
              key={`${panelId}-noBlock`}
              parentAction={{
                ...action,
                panelId: `${panelId}-noBlock`,
                containerId: `${panelId}-noBlock`
              }}
              onClone={onClone}
              onSettings={null}
              branchName="noBlock"
              onRemove={onRemove}
              onActionUpdate={onActionUpdate}
              onParentContentUpdate={onParentContentUpdate}
            />
          </div>

          {/* --- NHÁNH TIMEOUT --- */}
          <div className="mission-action-branch-container">
            <div className="mission-action-content-subtitle">
              Timeout
            </div>
            <ActionParentContent
              key={`${panelId}-timeoutBlock`}
              parentAction={{
                ...action,
                panelId: `${panelId}-timeoutBlock`,
                containerId: `${panelId}-timeoutBlock`
              }}
              onClone={onClone}
              onSettings={null}
              branchName="timeoutBlock"
              onRemove={onRemove}
              onActionUpdate={onActionUpdate}
              onParentContentUpdate={onParentContentUpdate}
            />
          </div>
        </div>
    </div>
  );
};

// Parse from DB
PromptUserAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
  try {
    const actionPropertiesText = JSON.parse(action.Properties);
    const userGroupIDVariable = variableFromJson(actionPropertiesText.UserGroupID);
    const timeoutVariable = variableFromJson(actionPropertiesText.Timeout);
    
    // Parse nested Properties if it exists
    const actionProperties = actionPropertiesText.Properties ? JSON.parse(actionPropertiesText.Properties) : {};

    // Parse Yes, No and Timeout blocks
    let yesBlockData = [];
    let noBlockData = [];
    let timeoutBlockData = [];

    try {
      yesBlockData = JSON.parse(actionProperties.Yes || '[]');
    } catch (parseError) {
      console.warn("Error parsing PromptUser yesBlock:", parseError);
    }

    try {
      noBlockData = JSON.parse(actionProperties.No || '[]');
    } catch (parseError) {
      console.warn("Error parsing PromptUser noBlock:", parseError);
    }

    try {
      timeoutBlockData = JSON.parse(actionProperties.Time_out || '[]');
    } catch (parseError) {
      console.warn("Error parsing PromptUser timeoutBlock:", parseError);
    }

    const actionId = generateActionId().id;
    const newLevel = level + 1; // Child actions are level 1

    // Parse child actions in yesBlock
    const yesBlock = yesBlockData.map((child) => {
      let actionType = actionRegistry.getActionTypeFromName(child.Action_name);
      if (actionType === 'unknown') {
        console.error(`❌ Unknown action type: ${child.Action_name}`);
        return null;
      }

      const ActionClass = actionRegistry.getAction(actionType);
      if (ActionClass && ActionClass.parseFromDatabase) {
        const parsedChild = ActionClass.parseFromDatabase(child, newLevel, mapWithPoints, actionsMap, markers, actionId);
        return parsedChild;
      } else {
        console.error(`❌ Action type not found: ${actionType} for child: ${child.Action_name}`);
        return null;
      }
    }).filter(child => child !== null);

    // Parse child actions in noBlock
    const noBlock = noBlockData.map((child) => {
      let actionType = actionRegistry.getActionTypeFromName(child.Action_name);
      if (actionType === 'unknown') {
        console.error(`❌ Unknown action type: ${child.Action_name}`);
        return null;
      }

      const ActionClass = actionRegistry.getAction(actionType);
      if (ActionClass && ActionClass.parseFromDatabase) {
        const parsedChild = ActionClass.parseFromDatabase(child, newLevel, mapWithPoints, actionsMap, markers, actionId);
        return parsedChild;
      } else {
        console.error(`❌ Action type not found: ${actionType} for child: ${child.Action_name}`);
        return null;
      }
    }).filter(child => child !== null);

    // Parse child actions in timeoutBlock
    const timeoutBlock = timeoutBlockData.map((child) => {
      let actionType = actionRegistry.getActionTypeFromName(child.Action_name);
      if (actionType === 'unknown') {
        console.error(`❌ Unknown action type: ${child.Action_name}`);
        return null;
      }

      const ActionClass = actionRegistry.getAction(actionType);
      if (ActionClass && ActionClass.parseFromDatabase) {
        const parsedChild = ActionClass.parseFromDatabase(child, newLevel, mapWithPoints, actionsMap, markers, actionId);
        return parsedChild;
      } else {
        console.error(`❌ Action type not found: ${actionType} for child: ${child.Action_name}`);
        return null;
      }
    }).filter(child => child !== null);

    return {
      panelId: actionId,
      actionName: action.Action_name || 'Prompt User',
      type: 'promptUser',
      parentId: parentId,
      isExpanded: true,
      actions: [{
        id: actionId,
        name: action.Action_name,
        level: level || 0,
        question: variableFromJson(actionPropertiesText.Question) || {
          userVariable: 'false',
          variable: '',
          message: ''
        },
        userGroupID: userGroupIDVariable,
        timeout: timeoutVariable,
        yesBlock: yesBlock,
        noBlock: noBlock,
        timeoutBlock: timeoutBlock,
        user_create: action.User_create || "false",
        type: action.Type || "13"
      }]
    };
  } catch (e) {
    console.error('Error parsing Prompt User action from database:', e, action);
    return PromptUserAction.createPanel();
  }
};

// Transform to DB
PromptUserAction.transformToDatabase = (panel) => {
  try {
    const action = getAction(panel);
    const promptUserAction = getAction(panel);
    
    // Transform yesBlock actions
    const yesBlockActions = [];
    if (promptUserAction.yesBlock && Array.isArray(promptUserAction.yesBlock)) {
      promptUserAction.yesBlock.forEach(child => {
        const actionClass = actionRegistry.getAction(child.type);
        if (actionClass && actionClass.transformToDatabase) {
          yesBlockActions.push(actionClass.transformToDatabase(child));
        } else {
          console.error(`❌ Action type not found: ${child.actionName}`);
          return null;
        }
      });
    }

    // Transform noBlock actions
    const noBlockActions = [];
    if (promptUserAction.noBlock && Array.isArray(promptUserAction.noBlock)) {
      promptUserAction.noBlock.forEach(child => {
        const actionClass = actionRegistry.getAction(child.type);
        if (actionClass && actionClass.transformToDatabase) {
          noBlockActions.push(actionClass.transformToDatabase(child));
        } else {
          console.error(`❌ Action type not found: ${child.actionName}`);
          return null;
        }
      });
    }

    // Transform timeoutBlock actions
    const timeoutBlockActions = [];
    if (promptUserAction.timeoutBlock && Array.isArray(promptUserAction.timeoutBlock)) {
      promptUserAction.timeoutBlock.forEach(child => {
        const actionClass = actionRegistry.getAction(child.type);
        if (actionClass && actionClass.transformToDatabase) {
          timeoutBlockActions.push(actionClass.transformToDatabase(child));
        } else {
          console.error(`❌ Action type not found: ${child.actionName}`);
          return null;
        }
      });
    }

    // Prepare Yes, No and Timeout blocks
    const actionProperties = {
      Yes: JSON.stringify(yesBlockActions || []),
      No: JSON.stringify(noBlockActions || []),
      Time_out: JSON.stringify(timeoutBlockActions || [])
    };

    // Build properties object
    const properties = {
      "Question": variableToJson(action.question) || 'Prompt question',
      "UserGroupID": variableToJson(action.userGroupID) || '',
      "Timeout": variableToJson(action.timeout) || '30',
      "Properties": JSON.stringify(actionProperties)
    };

    return {
      "Action_name": "Prompt User",
      "Properties": JSON.stringify(properties, null, 4),
      "Type": action.type || "13",
      "User_create": action.user_create || "false"
    };
  } catch (error) {
    console.error('❌ PromptUserAction.transformToDatabase error:', error);
    return null;
  }
};

// Create from menu
PromptUserAction.createPanel = (actionFromMenu) => {
  const actionId = generateActionId().id;
  
  return {
    panelId: actionId,
    actionName: 'Prompt User',
    type: 'promptUser',
    parentId: null,
    actions: [{
      id: actionId,
      name: 'Prompt User',
      level: 0,
      question: {
        userVariable: 'false',
        variable: '',
        message: ''
      },
      userGroupID: {
        userVariable: 'false',
        variable: '',
        message: ''
      },
      timeout: {
        userVariable: 'false',
        variable: '30',
        message: ''
      },
      yesBlock: [],
      noBlock: [],
      timeoutBlock: [],
      user_create: 'false',
      type: actionFromMenu?.ID || '13',
  
    }]
  };
};

// Clone
PromptUserAction.clonePanel = (originalPanel, parentId = null, level = null) => {
  const newLevel = level || 0;
  const newPanelId = generateActionId().id;
  let clonedAction = {
    ...originalPanel,
    panelId: newPanelId,
    parentId: parentId,
    actions: originalPanel.actions.map(action => {
      return {
        ...action,
        level: newLevel,
        id: newPanelId,
      };
    }),
  };

  const newChildrenLevel = newLevel + 1;
  
  // Clone yesBlock
  if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].yesBlock && Array.isArray(originalPanel.actions[0].yesBlock)) {
    const newChildrenYesBlock = originalPanel.actions[0].yesBlock.map(child => {
      const actionType = actionRegistry.getActionTypeFromName(child.actionName);
      const ActionClass = actionRegistry.getAction(actionType);
      if (ActionClass && ActionClass.clonePanel) {
        return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
      } else {
        console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
        return null;
      }
    });
    clonedAction.actions[0].yesBlock = newChildrenYesBlock;
  }
  
  // Clone noBlock
  if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].noBlock && Array.isArray(originalPanel.actions[0].noBlock)) {
    const newChildrenNoBlock = originalPanel.actions[0].noBlock.map(child => {
      const actionType = actionRegistry.getActionTypeFromName(child.actionName);
      const ActionClass = actionRegistry.getAction(actionType);
      if (ActionClass && ActionClass.clonePanel) {
        return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
      } else {
        console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
        return null;
      }
    });
    clonedAction.actions[0].noBlock = newChildrenNoBlock;
  }
  
  // Clone timeoutBlock
  if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].timeoutBlock && Array.isArray(originalPanel.actions[0].timeoutBlock)) {
    const newChildrenTimeoutBlock = originalPanel.actions[0].timeoutBlock.map(child => {
      const actionType = actionRegistry.getActionTypeFromName(child.actionName);
      const ActionClass = actionRegistry.getAction(actionType);
      if (ActionClass && ActionClass.clonePanel) {
        return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
      } else {
        console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
        return null;
      }
    });
    clonedAction.actions[0].timeoutBlock = newChildrenTimeoutBlock;
  }
  
  return clonedAction;
};

export default PromptUserAction;
