import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { generateActionId, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import ActionContainer from '../ActionContainer';
import DraggableItem from '../DraggableItem';
import { variableFromJson, variableToJson } from '../utils/actionIdGenerator';
import { getAction, getActionLevel } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';
import ActionParentContent from '../common/ActionParentContent'; // Component bạn đã tạo
import { useTouchSupport } from '../utils/touchHelper';
// Enum mapping cho các field
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

const IfAction = ({
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
    const ifActionData = getAction(action); // Helper để lấy action chính
    const { openSettings } = useSettings();

    // Sync isSettingsOpen with action state
    useEffect(() => {
        const actionData = getAction(action);
        if (actionData && actionData.isSettingsOpen !== undefined) {
            setIsSettingsOpen(actionData.isSettingsOpen);
        }
    }, [action]);

    const handleToggle = () => {
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
        // Update action data with isSettingsOpen state
        if (onActionUpdate) {
            onActionUpdate(panelId, { isSettingsOpen: true });
        }
        openSettings(action, panelId, 'if');
    };

    // Create touch handlers for buttons (after function definitions)
    const cloneTouchHandlers = useTouchSupport(handleCloneClick);
    const settingsTouchHandlers = useTouchSupport(handleSettingsClick);
    const toggleTouchHandlers = useTouchSupport(handleToggle);

    // Lấy giá trị compare và kiểm tra có nên hiển thị index không
    const compareValue = ifActionData.compare?.variable || '0';
    const shouldShowIndex = compareValue !== '0' && compareValue !== '2';

    const ifLevel = getActionLevel(action) || 0;
    const ifPanelBg = getPanelColorForLevel(ifLevel);
    const ifIconBg = getIconColorForLevel(ifLevel);

    return (
        <div className="mission-action-panel-parent">
            {/* --- PHẦN PANEL CHÍNH CỦA IF --- */}
            <div
                className={`mission-action-panel-nav ${isDragging ? 'dragging' : ''}`}
                style={{ backgroundColor: ifPanelBg }}
                draggable={draggable}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                data-action-name={getActionName(action.id)}
                data-level={getActionLevel(action)}
            >
                <div className="mission-action-content">
                    <div className="mission-action-runner-icon-container" style={{ backgroundColor: ifIconBg }}>
                        <span className="mission-action-runner-icon"></span>
                    </div>
                    <div className="mission-action-name-container">
                        <span className="mission-action-name">If</span>
                        <div className="mission-action-condition">
                            <ActionValueDisplay
                                label=""
                                field={ifActionData.compare}
                                enumMapping={COMPARE_ENUM}
                            />
                            {shouldShowIndex && ifActionData.index && (
                                <ActionValueDisplay
                                    label=""
                                    field={ifActionData.index}
                                />
                            )}
                            {ifActionData.operator && (
                                <ActionValueDisplay
                                    label=""
                                    field={ifActionData.operator}
                                    enumMapping={OPERATOR_ENUM}
                                />
                            )}
                            {ifActionData.value && (
                                <ActionValueDisplay
                                    label=""
                                    field={ifActionData.value}
                                />
                            )}
                        </div>
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
                        {...settingsTouchHandlers}
                            onClick={(e) => {
                            e.stopPropagation();

                            setIsSettingsOpen(true);

                            // Update action data with isSettingsOpen state
                            if (onActionUpdate) {
                                onActionUpdate(panelId, { isSettingsOpen: true });
                            }

                            // Use SettingsContext to open settings
                            openSettings(action, panelId, 'if');
                        }}
                    >
                        <span className="mission-action-settings-icon"></span>
                    </button>
                    { }
                </div>
            </div>

            {/* --- PHẦN HIỂN THỊ CÁC NHÁNH CON --- */}
            <div className={`mission-action-parent-content-area-container ${currentIsExpanded ? 'expanded' : 'collapsed'}`}>

                {/* --- NHÁNH TRUE (THEN) --- */}
                <div className="mission-action-branch-container">
                    <div className="mission-action-content-subtitle">
                        True
                    </div>
                    <ActionParentContent
                        key={`${panelId}-thenBlock`}
                        parentAction={{
                            ...action,
                            panelId: `${panelId}-thenBlock`,
                            containerId: `${panelId}-thenBlock`
                        }}
                        onClone={onClone}
                        onSettings={null}
                        branchName="thenBlock"
                        onRemove={onRemove}
                        onActionUpdate={onActionUpdate}
                        onParentContentUpdate={onParentContentUpdate}
                    />
                </div>

                {/* --- NHÁNH FALSE (ELSE) --- */}
                <div className="mission-action-branch-container">
                    <div className="mission-action-content-subtitle">
                        False
                    </div>
                    <ActionParentContent
                        key={`${panelId}-elseBlock`}
                        parentAction={{
                            ...action,
                            panelId: `${panelId}-elseBlock`,
                            containerId: `${panelId}-elseBlock`
                        }}
                        onClone={onClone}
                        onSettings={null}
                        branchName="elseBlock"
                        onRemove={onRemove}
                        onActionUpdate={onActionUpdate}
                        onParentContentUpdate={onParentContentUpdate}
                    />
                </div>
            </div>
        </div>
    );
};

export default IfAction;


// Parse from database format
IfAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
    try {

        console.log('IfAction.parseFromDatabase called with action:', action);
        const properties = JSON.parse(action.Properties);

        // Parse individual field properties
        const compare = variableFromJson(properties.Compare);
        const indicator = variableFromJson(properties.Indicator);
        const operator = variableFromJson(properties.Operator);
        const value = variableFromJson(properties.Value);
        const actionProperties = JSON.parse(properties.Properties);

        // Parse True and False blocks
        let thenBlockData = [];
        let elseBlockData = [];

        try {
            thenBlockData = JSON.parse(actionProperties.True || '[]');
        } catch (parseError) {
            console.warn("Error parsing If thenBlock:", parseError);
        }

        try {
            elseBlockData = JSON.parse(actionProperties.False || '[]');
        } catch (parseError) {
            console.warn("Error parsing If elseBlock:", parseError);
        }

        const actionId = generateActionId().id;
        const newLevel = level + 1; // Child actions are level 1

        // Parse child actions in thenBlock
        const thenBlock = thenBlockData.map((child) => {
            console.log('thenBlock called with child:', child);
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
        }).filter(child => child !== null);

        // Parse child actions in elseBlock
        const elseBlock = elseBlockData.map((child) => {
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
        }).filter(child => child !== null);

        return {
            panelId: actionId,
            actionName: 'If',
            type: 'if',
            parentId: parentId,
            isExpanded: true,
            actions: [{
                id: actionId,
                name: 'If',
                level: level,
                compare: compare,
                index: indicator,
                operator: operator,
                value: value,
                thenBlock: thenBlock,
                elseBlock: elseBlock,
                user_create: action.User_create || "false",
                type: action.Type || "11"
            }]
        };
    } catch (error) {
        console.error('❌ IfAction.parseFromDatabase error:', error);
        // Return default panel if parsing fails
        return IfAction.createPanel();
    }
};

// Transform to database format
IfAction.transformToDatabase = (panel) => {
    try {
        const action = getAction(panel);
        const ifaction = getAction(panel);
        //paser  true block
        // Transform children actions
        const trueBlockActions = [];
        if (ifaction.thenBlock && Array.isArray(ifaction.thenBlock)) {
            ifaction.thenBlock.forEach(child => {

                const actionClass = actionRegistry.getAction(child.type);
                if (actionClass && actionClass.transformToDatabase) {
                    trueBlockActions.push(actionClass.transformToDatabase(child));
                } else {
                    console.error(`❌ Action type not found: ${child.actionName}`);
                    return null;
                }
            });
        }

        //paser else block
        const falseBlockActions = [];
        if (ifaction.elseBlock && Array.isArray(ifaction.elseBlock)) {
            ifaction.elseBlock.forEach(child => {
                const actionClass = actionRegistry.getAction(child.type);
                if (actionClass && actionClass.transformToDatabase) {
                    falseBlockActions.push(actionClass.transformToDatabase(child));
                } else {
                    console.error(`❌ Action type not found: ${child.actionName}`);
                    return null;
                }
            });
        }

        // Prepare True and False blocks
        const actionProperties = {
            True: JSON.stringify(trueBlockActions || []),
            False: JSON.stringify(falseBlockActions || [])
        };

        // Build properties object
        const properties = {
            "Compare": variableToJson(action.compare),
            "Indicator": variableToJson(action.index),
            "Operator": variableToJson(action.operator),
            "Value": variableToJson(action.value),
            "Properties": JSON.stringify(actionProperties)
        };

        return {
            "Action_name": "If",
            "Properties": JSON.stringify(properties, null, 4),
            "Type": action.type || "11",
            "User_create": action.user_create || "false"
        };
    } catch (error) {
        console.error('❌ IfAction.transformToDatabase error:', error);
        return null;
    }
};

// Minimal parse/transform/createPanel
IfAction.createPanel = (action) => {
    const id = generateActionId().id;
    return {
        panelId: id,
        actionName: 'If',
        type: 'if',
        isExpanded: true,
        actions: [{
            id: id,
            name: 'If',
            level: 0,
            compare: {
                message: "",
                userVariable: "false",
                variable: "0"
            },
            indicator: {
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
            thenBlock: [],
            elseBlock: [],
            user_create: "false",
            type: action.type || "11"
        }]
    };
};

IfAction.clonePanel = (originalPanel, parentId = null, level = null) => {
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
    if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].thenBlock && Array.isArray(originalPanel.actions[0].thenBlock)) {
        const newChildrenThenBlock = originalPanel.actions[0].thenBlock.map(child => {
            const actionType = actionRegistry.getActionTypeFromName(child.actionName);
            const ActionClass = actionRegistry.getAction(actionType);
            if (ActionClass && ActionClass.clonePanel) {
                return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
            } else {
                console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
                return null;
            }
        });
        clonedAction.actions[0].thenBlock = newChildrenThenBlock;
    }
    if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].elseBlock && Array.isArray(originalPanel.actions[0].elseBlock)) {
        const newChildrenElseBlock = originalPanel.actions[0].elseBlock.map(child => {
            const actionType = actionRegistry.getActionTypeFromName(child.actionName);
            const ActionClass = actionRegistry.getAction(actionType);
            if (ActionClass && ActionClass.clonePanel) {
                return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
            } else {
                console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
                return null;
            }
        });
        clonedAction.actions[0].elseBlock = newChildrenElseBlock;
    }
    return clonedAction;
};



