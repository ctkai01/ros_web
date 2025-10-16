/**
 * Global helper functions for action data manipulation
 */
import { getActionTypeFromId, getActionNameFromId, debugActionMapping } from './actionTypeMapper';

export const getAction = (panelOrAction) => {
  if (panelOrAction.actions && Array.isArray(panelOrAction.actions) && panelOrAction.actions.length > 0) {
    return panelOrAction.actions[0];
  }
  return panelOrAction;
};

export const getActionUserCreate = (panelOrAction) => {
  const actionData = getActionData(panelOrAction);
  if (!actionData) return 'false';
  return actionData.User_create === 'true' || actionData.User_create === true;
};

/**
 * Get the actual action data from a panel or action object
 * @param {Object} panelOrAction - Can be either a panel object or direct action object
 * @returns {Object} The actual action data
 */

export const getActionData = (panelOrAction) => {
  if (!panelOrAction) {
    console.warn('⚠️ getActionData: panelOrAction is null or undefined');
    return null;
  }

  // If it's already an action object (has name but no actions array)
  if (panelOrAction.name && !panelOrAction.actions) {
    return panelOrAction;
  }

  // If it's a panel object with actions array - return the panel itself for Loop
  if (panelOrAction.actions && Array.isArray(panelOrAction.actions) && panelOrAction.actions.length > 0) {
    // For Loop actions, return the panel itself to preserve children structure
    if (panelOrAction.actionName === 'Loop' || panelOrAction.type === 'loop') {
      return panelOrAction;
    }
    // For other actions, return the first action
    return panelOrAction.actions[0];
  }

  // If it's a panel object with children (old structure)
  if (panelOrAction.children && Array.isArray(panelOrAction.children)) {
    return panelOrAction;
  }

  // Fallback: return the object as-is
  return panelOrAction;
};

/**
 * Get the action ID from a panel or action object
 * @param {Object} panelOrAction - Can be either a panel object or direct action object
 * @returns {string|null} The action ID
 */
export const getActionId = (panelOrAction) => {
  const actionData = getActionData(panelOrAction);
  if (!actionData) return null;

  // Try different possible ID fields
  return actionData.id || actionData.ID || actionData.panelId || null;
};

/**
 * Get children from a panel or action object
 * @param {Object} panelOrAction - Can be either a panel object or direct action object
 * @returns {Array} Array of children
 */
export const getActionChildren = (panelOrAction) => {
  if (!panelOrAction) return [];

  // If it's a panel with actions array structure
  if (panelOrAction.actions && Array.isArray(panelOrAction.actions) && panelOrAction.actions.length > 0) {
    return panelOrAction.actions[0].children || [];
  }

  // If it's a panel with direct children structure
  if (panelOrAction.children && Array.isArray(panelOrAction.children)) {
    return panelOrAction.children;
  }

  // If it's an action object with children
  if (panelOrAction.children && Array.isArray(panelOrAction.children)) {
    return panelOrAction.children;
  }

  return [];
};

/**
 * Check if an object is a panel (has actions array)
 * @param {Object} obj - Object to check
 * @returns {boolean} True if it's a panel
 */
export const isPanel = (obj) => {
  return obj && obj.actions && Array.isArray(obj.actions) && obj.actions.length > 0;
};

/**
 * Check if an object is an action (has name but no actions array)
 * @param {Object} obj - Object to check
 * @returns {boolean} True if it's an action
 */
export const isAction = (obj) => {
  return obj && obj.name && !obj.actions && obj.actionName !== 'Loop' && obj.type !== 'loop';
};

/**
 * Get action name from panel or action object
 * @param {Object} panelOrAction - Can be either a panel object or direct action object
 * @returns {string} The action name
 */
export const getActionName = (panelOrAction) => {
  const actionData = getActionData(panelOrAction);
  if (!actionData) return 'Unknown';

  // If action has a numeric type (from database), use mapper
  if (actionData.type && !isNaN(actionData.type)) {
    return getActionNameFromId(actionData.type);
  }

  return actionData.name || actionData.actionName || 'Unknown';
};

/**
 * Get action type from panel or action object
 * @param {Object} panelOrAction - Can be either a panel object or direct action object
 * @returns {string} The action type
 */
export const getActionType = (panelOrAction) => {
  const actionData = getActionData(panelOrAction);
  if (!actionData) return 'unknown';

  // If action has a numeric type (from database), use mapper
  if (actionData.type && !isNaN(actionData.type)) {
    return getActionTypeFromId(actionData.type);
  }

  // Special handling for Loop actions
  if (actionData.actionName === 'Loop' || actionData.type === 'loop' || actionData.type === '12') {
    return 'loop';
  }

  return actionData.type || 'unknown';
};

/**
 * Create a consistent action object structure
 * @param {Object} panelOrAction - Input object
 * @returns {Object} Standardized action object
 */
export const normalizeAction = (panelOrAction) => {
  const actionData = getActionData(panelOrAction);
  if (!actionData) return null;

  return {
    id: getActionId(panelOrAction),
    name: getActionName(panelOrAction),
    type: getActionType(panelOrAction),
    children: getActionChildren(panelOrAction),
    ...actionData
  };
};

/**
 * Debug helper to log action structure
 * @param {Object} panelOrAction - Object to debug
 * @param {string} label - Label for the log
 */
export const debugAction = (panelOrAction, label = 'Action Debug') => {
  const actionData = getActionData(panelOrAction);
  console.log(`🔍 ${label}:`, {
    isPanel: isPanel(panelOrAction),
    isAction: isAction(panelOrAction),
    actionId: getActionId(panelOrAction),
    actionName: getActionName(panelOrAction),
    actionType: getActionType(panelOrAction),
    childrenCount: getActionChildren(panelOrAction).length,
    originalObject: panelOrAction
  });

  // If action has numeric type, also log mapping info
  if (actionData && actionData.type && !isNaN(actionData.type)) {
    debugActionMapping(actionData.type, `${label} - Database Mapping`);
  }
}; 

/**
 * Get level (nesting depth) from either panel or action object.
 * Tries several common locations: action.level, actions[0].level.
 */
export const getActionLevel = (panelOrAction) => {
  if (!panelOrAction) return 0;
  // Direct level on object (Move/RelativeMove action objects)
  if (typeof panelOrAction.level === 'number') return panelOrAction.level;
  // Level stored inside first action (Loop panel structure)
  if (panelOrAction.actions && panelOrAction.actions[0] && typeof panelOrAction.actions[0].level === 'number') {
    return panelOrAction.actions[0].level;
  }
  // Fallback
  return 0;
};

