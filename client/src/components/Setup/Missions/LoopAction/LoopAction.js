import React, { useState, useRef, useCallback, useEffect } from 'react';
import './LoopAction.css';
import ActionContainer from '../ActionContainer';
import DraggableItem from '../DraggableItem';
import containerManager from '../ContainerManager';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { variableFromJson, variableToJson, generateActionId, generateNestedParentId, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionData, getActionId, getActionChildren, debugAction, getActionLevel, getActionUserCreate, getAction } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import ActionParentContent from '../common/ActionParentContent';
import { useTouchSupport } from '../utils/touchHelper';


const LoopAction = ({
  action,
  panelId,
  onClone,
  onActionUpdate,
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
  onRemove,
  onParentContentUpdate,

}) => {


  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Use global toggle registry for expansion state
  const currentIsExpanded = toggleRegistry.getExpanded(panelId);
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
    } else {
      console.warn('⚠️ LoopAction: onClone callback not provided or not a function');
    }
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setIsSettingsOpen(true);
    // Update action data with isSettingsOpen state
    if (onActionUpdate) {
      onActionUpdate(panelId, { isSettingsOpen: true });
    }
    openSettings(action, panelId, 'loop');
  };

  const handleToggle = () => {
    // Use global toggle registry
    toggleRegistry.toggle(panelId);

    // Force re-render by updating action through onActionUpdate if available
    if (onActionUpdate) {
      const actionId = action.id || action.ID || panelId;
      onActionUpdate(panelId, {
        isExpanded: toggleRegistry.getExpanded(panelId)
      });
    }
  };

  const cloneTouchHandlers = useTouchSupport(handleCloneClick);
  const settingsTouchHandlers = useTouchSupport(handleSettingsClick);
  const toggleTouchHandlers = useTouchSupport(handleToggle);

  // Compute colors by level for panel and icon
  const loopLevel = getActionLevel(action) || 0;
  const loopPanelBg = getPanelColorForLevel(loopLevel);
  const loopIconBg = getIconColorForLevel(loopLevel);

  return (
    <div className="mission-action-panel-parent">
      <div
        className={`mission-action-panel-nav ${isDragging ? 'dragging' : ''}`}
        style={{ backgroundColor: loopPanelBg }}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        data-action-name={getActionName(action.id)}
        data-level={getActionLevel(action)}
      >
        <div className="mission-action-content">
          <div className="mission-action-runner-icon-container" style={{ backgroundColor: loopIconBg }}>
            <span className="mission-action-runner-icon"></span>
          </div>
          <div className="mission-action-name-container">
            <span className="mission-action-name">Loop</span>
            <ActionValueDisplay label="Iterations" field={getAction(action).iterations} name={getAction(action).iterations.variable == '-1' ? 'endless' : getAction(action).iterations?.variable || getAction(action).iterations?.message || 'endless'} />
          </div>
        </div>
        <div className="mission-action-buttons">
          <button
            className={`mission-action-toggle-button ${currentIsExpanded ? 'expanded' : ''}`}
            {...toggleTouchHandlers}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            <span className="mission-action-toggle-icon"></span>
          </button>

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
          { }
        </div>
      </div>

      <div className={`mission-action-parent-content-area-container ${currentIsExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="mission-action-content-subtitle">
          {'Content'}
        </div>
        {/* SỬ DỤNG COMPONENT MỚI Ở ĐÂY */}
        <ActionParentContent
          key={`${panelId}-children`}
          parentAction={{
            ...action,
            panelId: `${panelId}-children`,
            containerId: `${panelId}-children`
          }}
          onClone={onClone}
          onSettings={null}
          branchName="children"
          onRemove={onRemove}
          onActionUpdate={onActionUpdate}
          onParentContentUpdate={onParentContentUpdate}
        />

      </div>
    </div>
  );
};


/**
 * Parse Loop action from database JSON format
 * @param {Object} action - Raw action data from database
 * @param {number} level - Level of the parent nested container
 * @param {Array} mapWithPoints - Array of maps with points data
 * @param {Object} actionsMap - Actions map for UserCreateAction
 * @returns {Object} Parsed Loop action object
 */
LoopAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {

  try {
    let parsedProperties = {};
    try {
      parsedProperties = JSON.parse(action.Properties);
    } catch (parseError) {
      console.warn("Error parsing Loop properties:", parseError);
    }

    // Parse children from Properties.Children
    let children = [];
    let userCreate = "false";
    let type = "12";
    //  get user create and type from action
    if (action.User_create) {
      userCreate = action.User_create;
    }
    if (action.Type) {
      type = action.Type;
    }

    // Generate unique parent ID for this Loop

    const actionId = generateActionId().id;
    const newLevel = level + 1;

    if (parsedProperties.Children) {
      try {
        // Children có thể là string JSON hoặc array
        let childrenData;
        if (typeof parsedProperties.Children === 'string') {
          childrenData = JSON.parse(parsedProperties.Children);
        } else {
          childrenData = parsedProperties.Children;
        }

        children = childrenData.map((child) => {
          // Determine action type
          let actionType = actionRegistry.getActionTypeFromName(child.Action_name);
          if (actionType === 'unknown') {
            console.error(`❌ Unknown action type: ${child.Action_name}`);
            return null;
          }

          // Try to use ActionRegistry to parse child with parent context
          const ActionClass = actionRegistry.getAction(actionType);
          if (ActionClass && ActionClass.parseFromDatabase) {
            // Pass all parameters to all child actions
            const parsedChild = ActionClass.parseFromDatabase(child, newLevel, mapWithPoints, actionsMap, markers, actionId);
            return parsedChild;
          } else {
            console.error(`❌ Action type not found: ${actionType} for child: ${child.Action_name}`);
            return null;
          }
        });
      } catch (parseError) {
        console.warn("Error parsing Loop children:", parseError);
      }
    }


    // Read additional properties
    const iterations = variableFromJson(parsedProperties.Iterations);
    const loopAction = {
      panelId: actionId,
      type: 'loop',
      actionName: 'Loop',
      parentId: parentId,
      actions: [{
        id: actionId,
        name: 'Loop',
        level: level,
        user_create: userCreate,
        type: type,
        iterations: iterations,
        children: children,
      }],
      isExpanded: false,
    };

    return loopAction;
  } catch (error) {
    console.error("Error parsing Loop action from database:", error);
    return null;
  }
};


/**
 * Transform Loop action to database JSON format
 * @param {Object} action - Loop action object
 * @returns {Object} Database format action object
 */
LoopAction.transformToDatabase = (action) => {

  // Handle different data structures
  let loopAction = action;

  // If action has actions array (panel structure), get the first action
  if (action.actions && Array.isArray(action.actions) && action.actions.length > 0) {
    loopAction = action.actions[0];
  }


  // Transform children actions
  const childrenActions = [];
  if (loopAction.children && Array.isArray(loopAction.children)) {
    loopAction.children.forEach(child => {

      const actionClass = actionRegistry.getAction(child.type);
      if (actionClass && actionClass.transformToDatabase) {
        childrenActions.push(actionClass.transformToDatabase(child));
      } else {
        console.error(`❌ Action type not found: ${child.actionName}`);
        return null;
      }
    });
  }

  // Create properties object with correct field order
  const properties = {
    "Children": JSON.stringify(childrenActions),
    "Iterations": variableToJson(loopAction.iterations)
  };

  // Stringify the entire properties object with proper formatting
  const propertiesString = JSON.stringify(properties, null, 4);


  return {
    "Action_name": "Loop",
    "Properties": propertiesString,
    "Type": "12",
    "User_create": "false"
  };
};


export default LoopAction;

/**
 * Tạo panel cho Loop action từ menu
 * @param {Object} action - Action từ menu
 * @returns {Object} - Panel object
 */
LoopAction.createPanel = (action) => {
  const actionId = generateActionId().id;

  return {
    panelId: actionId,
    actionName: 'Loop',
    type: 'loop',
    isExpanded: true,
    isSettingsOpen: false,
    parentId: null,
    actions: [{
      id: actionId,
      name: 'Loop',
      level: 0,
      description: action.description,
      groupId: action.groupID,
      iterations: {
        message: "",
        userVariable: "false",
        variable: "-1"
      },
      children: [],
      user_create: "false",
      type: action.type || "12"
    }]
  };
};

/**
 * Recursively clone nested actions with new IDs using ActionRegistry
 * @param {Object} originalPanel - Action to clone
 * @param {string} parentId - Parent ID for the new action
 * @param {number} level - nested level of parent the action
 * @returns {Object} - Cloned action with new IDs
 */
LoopAction.clonePanel = (originalPanel, parentId = null, level = null) => {

  console.log('🔄 LoopAction.clonePanel:', { originalPanel, parentId, level });
  const newLevel = level || 0;
  const newPanelId = generateActionId().id; // Generate new panelId for the cloned panel

  let clonedAction = {
    ...originalPanel,
    panelId: newPanelId, // Use new panelId instead of original
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
  // Recursively clone children if this is a Loop action
  if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].children && Array.isArray(originalPanel.actions[0].children)) {
    const clonedChildren = originalPanel.actions[0].children.map((child, childIndex) => {
      const actionType = actionRegistry.getActionTypeFromName(child.actionName);
      const ActionClass = actionRegistry.getAction(actionType);
      if (ActionClass && ActionClass.clonePanel) {
        return ActionClass.clonePanel(child, newPanelId, newChildrenLevel); // Use newPanelId as parentId for children
      } else {
        console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
        return null;
      }
    });

    // Update the actions[0].children reference
    if (clonedAction.actions && clonedAction.actions[0]) {
      clonedAction.actions[0].children = clonedChildren;
    }
  }

  return clonedAction;


}; 