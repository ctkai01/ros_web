import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { generateActionId, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { variableFromJson, variableToJson } from '../utils/actionIdGenerator';
import { getAction, getActionLevel } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import ActionParentContent from '../common/ActionParentContent';
import { useTouchSupport } from '../utils/touchHelper';

// Enum mapping cho các field (giống IfAction)
const COMPARE_ENUM = {
    '0': 'Battery Percentage',
    '1': 'I/O Input',
    '2': 'Pending Mission',
    '3': 'PLC Register'
};

const OPERATOR_ENUM = {
    '0': '!=',
    '1': '<',
    '2': '<=',
    '3': '==',
    '4': '>',
    '5': '>='
};

const WhileAction = ({
    action,
    panelId,
    onClone,
    draggable = false,
    onDragStart,
    onDragEnd,
    isDragging = false,
    onRemove,
    onActionUpdate,
    onParentContentUpdate,
}) => {


    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const currentIsExpanded = toggleRegistry.getExpanded(panelId);
    const whileActionData = getAction(action);
    const { openSettings } = useSettings();

    // Sync isSettingsOpen with action state
    useEffect(() => {
        const actionData = getAction(action);
        if (actionData && actionData.isSettingsOpen !== undefined) {
            setIsSettingsOpen(actionData.isSettingsOpen);
        }
    }, [action]);

    const handleToggle = () => {    
        e.stopPropagation();
        toggleRegistry.toggle(panelId);
        if (onActionUpdate) {
            onActionUpdate(panelId, { isExpanded: !currentIsExpanded });
        }
    };

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
        openSettings(action, panelId, 'while');
    };

    const cloneTouchHandlers = useTouchSupport(handleCloneClick);
    const settingsTouchHandlers = useTouchSupport(handleSettingsClick);
    const toggleTouchHandlers = useTouchSupport(handleToggle);
    
    // Hàm tạo callback để cập nhật children actions
    const createChildrenUpdateHandler = () => {
        return (childId, updatedChildData) => {
            const currentChildren = whileActionData.children || [];

            // Tìm và cập nhật action con
            const newChildren = currentChildren.map(child =>
                (child.id === childId || child.panelId === childId) ? updatedChildData : child
            );

            // Tạo lại toàn bộ đối tượng WhileAction với children đã được cập nhật
            const updatedWhileAction = {
                ...action,
                actions: [{
                    ...whileActionData,
                    children: newChildren
                }]
            };

            // Gọi callback gốc để cập nhật state ở cấp cao nhất
            if (onActionUpdate) {
                onActionUpdate(panelId, updatedWhileAction);
            }
        };
    };

    // Lấy giá trị compare và kiểm tra có nên hiển thị index không (giống IfAction)
    const compareValue = whileActionData.compare?.variable || '0';
    const shouldShowIndex = compareValue !== '0' && compareValue !== '2';

    const whileLevel = getActionLevel(action) || 0;
    const whilePanelBg = getPanelColorForLevel(whileLevel);
    const whileIconBg = getIconColorForLevel(whileLevel);

    return (
        <div className="mission-action-panel-parent">
            {/* --- PHẦN PANEL CHÍNH CỦA WHILE --- */}
            <div
                className={`mission-action-panel-nav ${isDragging ? 'dragging' : ''}`}
                style={{ backgroundColor: whilePanelBg }}
                draggable={draggable}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                data-action-name={getActionName(action.id)}
                data-level={getActionLevel(action)}
            >
                <div className="mission-action-content">
                    <div className="mission-action-runner-icon-container" style={{ backgroundColor: whileIconBg }}>
                        <span className="mission-action-runner-icon"></span>
                    </div>
                    <div className="mission-action-name-container">
                        <span className="mission-action-name">While</span>
                        <div className="mission-action-condition">
                            <ActionValueDisplay
                                label=""
                                field={whileActionData.compare}
                                enumMapping={COMPARE_ENUM}
                            />
                            {shouldShowIndex && whileActionData.index && (
                                <ActionValueDisplay
                                    label=""
                                    field={whileActionData.index}
                                />
                            )}
                            {whileActionData.operator && (
                                <ActionValueDisplay
                                    label=""
                                    field={whileActionData.operator}
                                    enumMapping={OPERATOR_ENUM}
                                />
                            )}
                            {whileActionData.value && (
                                <ActionValueDisplay
                                    label=""
                                    field={whileActionData.value}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="mission-action-buttons">
                    <button
                        className={`mission-action-toggle-button ${currentIsExpanded ? 'expanded' : ''}`}
                        onClick={handleToggle}
                        {...toggleTouchHandlers}
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
                </div>
            </div>

            {/* --- PHẦN HIỂN THỊ CHILDREN ACTIONS --- */}
            <div className={`mission-action-parent-content-area-container ${currentIsExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="mission-action-branch-container">
                    <div className="mission-action-content-subtitle">
                        Content
                    </div>
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
        </div>
    );
};

export default WhileAction;

// Parse from database format
WhileAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
    try {
        const properties = JSON.parse(action.Properties);

        // Parse individual field properties (giống IfAction)
        const compare = variableFromJson(properties.Compare);
        const indicator = variableFromJson(properties.Indicator);
        const operator = variableFromJson(properties.Operator);
        const value = variableFromJson(properties.Value);

        // Parse children from Properties.Children (giống LoopAction)
        let children = [];
        let userCreate = "false";
        let type = "16"; // While action type

        if (action.User_create) {
            userCreate = action.User_create;
        }
        if (action.Type) {
            type = action.Type;
        }

        const actionId = generateActionId().id;
        const newLevel = level + 1;

        if (properties.Children) {
            try {
                let childrenData;
                if (typeof properties.Children === 'string') {
                    childrenData = JSON.parse(properties.Children);
                } else {
                    childrenData = properties.Children;
                }

                children = childrenData.map((child) => {
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
            } catch (parseError) {
                console.warn("Error parsing While children:", parseError);
            }
        }

        return {
            panelId: actionId,
            actionName: 'While',
            type: 'while',
            parentId: parentId,
            isExpanded: true,
            actions: [{
                id: actionId,
                name: 'While',
                level: level,
                compare: compare,
                index: indicator,
                operator: operator,
                value: value,
                children: children,
                user_create: userCreate,
                type: type
            }]
        };
    } catch (error) {
        console.error('❌ WhileAction.parseFromDatabase error:', error);
        return WhileAction.createPanel();
    }
};

// Transform to database format
WhileAction.transformToDatabase = (panel) => {
    try {
        const action = getAction(panel);


        // Transform children actions (giống LoopAction)
        const childrenActions = [];
        if (action.children && Array.isArray(action.children)) {
            action.children.forEach(child => {
                const actionClass = actionRegistry.getAction(child.type);
                if (actionClass && actionClass.transformToDatabase) {
                    childrenActions.push(actionClass.transformToDatabase(child));
                } else {
                    console.error(`❌ Action type not found: ${child.actionName}`);
                }
            });
        }

        // Build properties object
        const properties = {
            Compare: variableToJson(action.compare),
            Indicator: variableToJson(action.index),
            Operator: variableToJson(action.operator),
            Value: variableToJson(action.value),
            Children: JSON.stringify(childrenActions || [])
        };

        return {
            Action_name: "While",
            Properties: JSON.stringify(properties),
            Type: action.type || "16",
            User_create: action.user_create || "false"
        };
    } catch (error) {
        console.error('❌ WhileAction.transformToDatabase error:', error);
        return null;
    }
};

// Create panel
WhileAction.createPanel = (action) => {
    const id = generateActionId().id;
    return {
        panelId: id,
        actionName: 'While',
        type: 'while',
        isExpanded: true,
        actions: [{
            id: id,
            name: 'While',
            level: 0,
            compare: {
                message: "",
                userVariable: "false",
                variable: "0"
            },
            index: {
                message: "",
                userVariable: "false",
                variable: "0"
            },
            operator: {
                message: "",
                userVariable: "false",
                variable: "0"
            },
            value: {
                message: "",
                userVariable: "false",
                variable: "1"
            },
            children: [],
            user_create: "false",
            type: action.type || "16"
        }]
    };
};

// Clone panel
WhileAction.clonePanel = (originalPanel, parentId = null, level = null) => {
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
    if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].children && Array.isArray(originalPanel.actions[0].children)) {
        const newChildren = originalPanel.actions[0].children.map(child => {
            const actionType = actionRegistry.getActionTypeFromName(child.actionName);
            const ActionClass = actionRegistry.getAction(actionType);
            if (ActionClass && ActionClass.clonePanel) {
                return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
            } else {
                console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
                return null;
            }
        });
        clonedAction.actions[0].children = newChildren;
    }


    return clonedAction;
};
