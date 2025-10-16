import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique action ID với format thống nhất
 * @param {string} actionName - Tên action (Move, Loop, If, While, etc.)
 * @param {number} level - Level của action (0 = root, 1 = nested, 2 = deep-nested, etc.)
 * @param {string} parentId - ID của parent (optional)
 * @returns {Object} - Object chứa id, panelId, và các thông tin khác
 */

export const variableFromJson = (json) => {
    const userVariablejson = JSON.parse(json);
    return {
        userVariable: userVariablejson.UserVariable || 'false',
        variable: userVariablejson.Variable || "",
        message: userVariablejson.Message || ""
    }
};

/**
 * Convert variable object to JSON string with correct field order
 * @param {Object} variableObj - Variable object
 * @returns {string} - JSON string
 */
export const variableToJson = (variableObj) => {
    if (!variableObj) {
        return JSON.stringify({
            "Message": "",
            "UserVariable": "false",
            "Variable": ""
        });
    }

    // Ensure correct field order: Message first, then UserVariable, then Variable
    const orderedObj = {
        "Message": variableObj.message || "",
        "UserVariable": variableObj.userVariable || "false",
        "Variable": variableObj.variable || ""
    };

    return JSON.stringify(orderedObj);
};

export const generateActionId = () => {
    let baseId = uuidv4();
    return {
        id: baseId,
    };
};

/**
 * Parse action ID để lấy thông tin
 * @param {string} id - Action ID
 * @returns {Object} - Thông tin parsed
 */
export const parseActionId = (id) => {
    if (!id) return null;

    const parts = id.split('-');
    if (parts.length < 3) return null;

    // Tìm actionName (phần cuối trước timestamp)
    const timestamp = parseInt(parts[parts.length - 1]);
    const actionName = parts[parts.length - 2];

    // Tính level dựa trên số lượng 'nested'
    let level = 0;
    let prefix = '';

    if (parts[0] === 'root') {
        level = 0;
        prefix = 'root';
    } else {
        // Đếm số lượng 'nested' liên tiếp
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === 'nested') {
                level++;
            } else {
                break;
            }
        }
        prefix = 'nested'.repeat(level);
    }

    return {
        level: level,
        actionName: actionName,
        timestamp: timestamp,
        prefix: prefix
    };
};

/**
 * Kiểm tra action có phải nested không
 * @param {string} id - Action ID
 * @returns {boolean}
 */
export const isNestedAction = (id) => {
    const parsed = parseActionId(id);
    return parsed && parsed.level > 0;
};


/**
 * Lấy tên action
 * @param {string} id - Action ID
 * @returns {string} - Action name
 */
export const getActionName = (id) => {
    const parsed = parseActionId(id);
    return parsed ? parsed.actionName : 'unknown';
};

/**
 * Tạo child ID từ parent ID
 * @param {string} parentId - Parent ID
 * @param {string} childActionName - Tên action của child
 * @returns {string} - Child ID
 */
export const generateChildId = (parentId, childActionName) => {
    const parentLevel = getActionLevel(parentId);
    const childLevel = parentLevel + 1;
    const timestamp = Date.now();
    const prefix = 'nested'.repeat(childLevel);
    return `${prefix}-${childActionName}-${timestamp}`;
};

/**
 * Tạo nested panel từ parent
 * @param {string} parentId - Parent ID
 * @param {string} actionName - Tên action
 * @returns {Object} - Panel object với ID mới
 */
export const generateNestedPanel = (parentId, actionName) => {
    const childLevel = getActionLevel(parentId) + 1;
    const actionId = generateActionId(actionName, childLevel, parentId);

    return {
        id: actionId.id,
        panelId: actionId.panelId,
        parentId: actionId.parentId,
        level: actionId.level,
        actionName: actionName,
        type: actionName.toLowerCase(),
        isExpanded: true,
        children: [],
        actions: [],
        isSettingsOpen: false
    };
}; 