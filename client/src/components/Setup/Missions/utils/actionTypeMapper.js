/**
 * Action Type Mapper - Maps database action IDs to action types
 * Reference table from database [Actions] table
 */

export const ACTION_TYPE_MAP = {
  // Group 1 - Movement Actions
  1: 'adjustLocalization',  // Adjust Localization
  2: 'docking',             // Docking
  3: 'move',                // Move
  4: 'moveToCoordinate',    // Move to coordinate
  5: 'relativeMove',        // Relative Move
  6: 'setFootprint',        // Set footprint
  7: 'switchMap',           // Switch Map

  // Group 2 - Battery Actions
  8: 'charging',            // Charging

  // Group 3 - Logic Actions
  9: 'break',               // Break
  10: 'continue',           // Continue
  11: 'if',                 // If
  12: 'loop',               // Loop
  13: 'promptUser',         // Prompt User
  14: 'return',             // Return
  15: 'wait',               // Wait
  16: 'while',              // While

  // Group 12 - Error Handling
  17: 'createLog',          // Create Log
  18: 'throwError',         // Throw Error
  19: 'tryCatch',           // Try/Catch

  // Group 4 - Sound/Light
  20: 'playSound',          // Play Sound
  21: 'showLight',          // Show Light

  // Group 5 - PLC
  22: 'setPlcRegister',     // Set PLC Register
  23: 'waitForPlcRegister', // Wait for PCL register

  // Group 6 - Email
  24: 'sendEmail',          // Send E-mail

  // Group 7 - Bluetooth
  25: 'bluetooth',          // Bluetooth
  26: 'waitForBluetooth',   // Wait for Bluetooth
};

/**
 * Reverse mapping - from action type to database ID
 */
export const ACTION_ID_MAP = Object.fromEntries(
  Object.entries(ACTION_TYPE_MAP).map(([id, type]) => [type, parseInt(id)])
);

/**
 * Get action type from database ID
 * @param {number|string} actionId - Database action ID
 * @returns {string} Action type
 */
export const getActionTypeFromId = (actionId) => {
  const id = parseInt(actionId);
  return ACTION_TYPE_MAP[id] || 'unknown';
};

/**
 * Get database ID from action type
 * @param {string} actionType - Action type
 * @returns {number|null} Database action ID
 */
export const getActionIdFromType = (actionType) => {
  return ACTION_ID_MAP[actionType] || null;
};

/**
 * Get action name from database ID
 * @param {number|string} actionId - Database action ID
 * @returns {string} Action name
 */
export const getActionNameFromId = (actionId) => {
  const id = parseInt(actionId);
  const actionNames = {
    1: 'Adjust Localization',
    2: 'Docking',
    3: 'Move',
    4: 'Move to coordinate',
    5: 'Relative Move',
    6: 'Set footprint',
    7: 'Switch Map',
    8: 'Charging',
    9: 'Break',
    10: 'Continue',
    11: 'If',
    12: 'Loop',
    13: 'Prompt User',
    14: 'Return',
    15: 'Wait',
    16: 'While',
    17: 'Create Log',
    18: 'Throw Error',
    19: 'Try/Catch',
    20: 'Play Sound',
    21: 'Show Light',
    22: 'Set PLC Register',
    23: 'Wait for PCL register',
    24: 'Send E-mail',
    25: 'Bluetooth',
    26: 'Wait for Bluetooth',
  };
  return actionNames[id] || 'Unknown';
};

/**
 * Get group ID from database action ID
 * @param {number|string} actionId - Database action ID
 * @returns {number} Group ID
 */
export const getGroupIdFromActionId = (actionId) => {
  const id = parseInt(actionId);
  const groupMap = {
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1,  // Movement
    8: 2,  // Battery
    9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3,  // Logic
    17: 12, 18: 12, 19: 12,  // Error Handling
    20: 4, 21: 4,  // Sound/Light
    22: 5, 23: 5,  // PLC
    24: 6,  // Email
    25: 7, 26: 7,  // Bluetooth
  };
  return groupMap[id] || 0;
};

/**
 * Check if action type is a container (can have children)
 * @param {string} actionType - Action type
 * @returns {boolean} True if it's a container
 */
export const isContainerAction = (actionType) => {
  return ['loop', 'if', 'while', 'tryCatch', 'promptUser'].includes(actionType);
};

/**
 * Check if action type is a movement action
 * @param {string} actionType - Action type
 * @returns {boolean} True if it's a movement action
 */
export const isMovementAction = (actionType) => {
  return ['move', 'relativeMove', 'moveToCoordinate', 'docking', 'adjustLocalization', 'switchMap'].includes(actionType);
};

/**
 * Check if action type is a logic action
 * @param {string} actionType - Action type
 * @returns {boolean} True if it's a logic action
 */
export const isLogicAction = (actionType) => {
  return ['loop', 'if', 'while', 'break', 'continue', 'return', 'wait'].includes(actionType);
};

/**
 * Debug helper to log action mapping
 * @param {number|string} actionId - Database action ID
 * @param {string} label - Label for the log
 */
export const debugActionMapping = (actionId, label = 'Action Mapping') => {
  const id = parseInt(actionId);
  console.log(`🔍 ${label}:`, {
    actionId: id,
    actionType: getActionTypeFromId(id),
    actionName: getActionNameFromId(id),
    groupId: getGroupIdFromActionId(id),
    isContainer: isContainerAction(getActionTypeFromId(id)),
    isMovement: isMovementAction(getActionTypeFromId(id)),
    isLogic: isLogicAction(getActionTypeFromId(id))
  });
}; 