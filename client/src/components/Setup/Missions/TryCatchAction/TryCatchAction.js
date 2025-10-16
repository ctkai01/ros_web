import React, { useState, useEffect } from 'react';
import '../ActionStyle.css';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { generateActionId, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getAction, getActionLevel } from '../utils/actionHelper';
import ActionParentContent from '../common/ActionParentContent';
import { useTouchSupport } from '../utils/touchHelper';

const TryCatchAction = ({
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
    const tryCatchActionData = getAction(action);
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

    const cloneTouchHandlers = useTouchSupport(handleCloneClick);
    const settingsTouchHandlers = useTouchSupport(handleSettingsClick);

    const tryCatchLevel = getActionLevel(action) || 0;
    const tryCatchPanelBg = getPanelColorForLevel(tryCatchLevel);
    const tryCatchIconBg = getIconColorForLevel(tryCatchLevel);

    return (
        <div className="mission-action-panel-parent">
            {/* --- PHẦN PANEL CHÍNH CỦA TRY/CATCH --- */}
            <div
                className={`mission-action-panel-nav ${isDragging ? 'dragging' : ''}`}
                style={{ backgroundColor: tryCatchPanelBg }}
                draggable={draggable}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                data-action-name={getActionName(action.id)}
                data-level={getActionLevel(action)}
            >
                <div className="mission-action-content">
                    <div className="mission-action-runner-icon-container" style={{ backgroundColor: tryCatchIconBg }}>
                        <span className="mission-action-runner-icon"></span>
                    </div>
                    <div className="mission-action-name-container">
                        <span className="mission-action-name">Try/Catch</span>
                    </div>
                </div>
                <div className="mission-action-buttons">
                    <button
                        className={`mission-action-toggle-button ${currentIsExpanded ? 'expanded' : ''}`}
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
                        onClick={(e) => {
                            e.stopPropagation();

                            setIsSettingsOpen(true);

                            // Update action data with isSettingsOpen state
                            if (onActionUpdate) {
                                onActionUpdate(panelId, { isSettingsOpen: true });
                            }

                            // Use SettingsContext to open settings
                            openSettings(action, panelId, 'tryCatch');
                        }}
                        {...settingsTouchHandlers}
                    >
                        <span className="mission-action-settings-icon"></span>
                    </button>
                </div>
            </div>

            {/* --- PHẦN HIỂN THỊ CÁC NHÁNH CON --- */}
            <div className={`mission-action-parent-content-area-container ${currentIsExpanded ? 'expanded' : 'collapsed'}`}>

                {/* --- NHÁNH TRY --- */}
                <div className="mission-action-branch-container">
                    <div className="mission-action-content-subtitle">
                        Try
                    </div>
                    <ActionParentContent
                        key={`${panelId}-tryBlock`}
                        parentAction={{
                            ...action,
                            panelId: `${panelId}-tryBlock`,
                            containerId: `${panelId}-tryBlock`
                        }}
                        onClone={onClone}
                        onSettings={null}
                        branchName="tryBlock"
                        onRemove={onRemove}
                        onActionUpdate={onActionUpdate}
                        onParentContentUpdate={onParentContentUpdate}
                    />
                </div>

                {/* --- NHÁNH CATCH --- */}
                <div className="mission-action-branch-container">
                    <div className="mission-action-content-subtitle">
                        Catch
                    </div>
                    <ActionParentContent
                        key={`${panelId}-catchBlock`}
                        parentAction={{
                            ...action,
                            panelId: `${panelId}-catchBlock`,
                            containerId: `${panelId}-catchBlock`
                        }}
                        onClone={onClone}
                        onSettings={null}
                        branchName="catchBlock"
                        onRemove={onRemove}
                        onActionUpdate={onActionUpdate}
                        onParentContentUpdate={onParentContentUpdate}
                    />
                </div>
            </div>
        </div>
    );
};

export default TryCatchAction;

// Parse from database format
TryCatchAction.parseFromDatabase = (action, level, mapWithPoints = [], actionsMap = {}, markers = [], parentId = null) => {
    try {
        const properties = JSON.parse(action.Properties);

        // Parse Try and Catch blocks
        let tryBlockData = [];
        let catchBlockData = [];

        try {
            tryBlockData = JSON.parse(properties.Try || '[]');
        } catch (parseError) {
            console.warn("Error parsing TryCatch tryBlock:", parseError);
        }

        try {
            catchBlockData = JSON.parse(properties.Catch || '[]');
        } catch (parseError) {
            console.warn("Error parsing TryCatch catchBlock:", parseError);
        }

        const actionId = generateActionId().id;
        const newLevel = level + 1; // Child actions are level 1

        // Parse child actions in tryBlock
        const tryBlock = tryBlockData.map((child) => {
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

        // Parse child actions in catchBlock
        const catchBlock = catchBlockData.map((child) => {
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
            actionName: 'Try/Catch',
            type: 'tryCatch',
            parentId: parentId,
            isExpanded: true,
            actions: [{
                id: actionId,
                name: 'Try/Catch',
                level: level,
                tryBlock: tryBlock,
                catchBlock: catchBlock,
                user_create: action.User_create || "false",
                type: action.Type || "19"
            }]
        };
    } catch (error) {
        console.error('❌ TryCatchAction.parseFromDatabase error:', error);
        // Return default panel if parsing fails
        return TryCatchAction.createPanel();
    }
};

// Transform to database format
TryCatchAction.transformToDatabase = (panel) => {
    try {
        const action = getAction(panel);

        // Transform children actions in tryBlock
        const tryBlockActions = [];
        if (action.tryBlock && Array.isArray(action.tryBlock)) {
            action.tryBlock.forEach(child => {
                const actionClass = actionRegistry.getAction(child.type);
                if (actionClass && actionClass.transformToDatabase) {
                    tryBlockActions.push(actionClass.transformToDatabase(child));
                } else {
                    console.error(`❌ Action type not found: ${child.actionName}`);
                }
            });
        }

        // Transform children actions in catchBlock
        const catchBlockActions = [];
        if (action.catchBlock && Array.isArray(action.catchBlock)) {
            action.catchBlock.forEach(child => {
                const actionClass = actionRegistry.getAction(child.type);
                if (actionClass && actionClass.transformToDatabase) {
                    catchBlockActions.push(actionClass.transformToDatabase(child));
                } else {
                    console.error(`❌ Action type not found: ${child.actionName}`);
                }
            });
        }

        // Build properties object
        const properties = {
            Try: JSON.stringify(tryBlockActions || []),
            Catch: JSON.stringify(catchBlockActions || [])
        };

        return {
            "Action_name": "Try/Catch",
            "Properties": JSON.stringify(properties, null, 4),
            "Type": action.type || "19",
            "User_create": action.user_create || "false"
        };
    } catch (error) {
        console.error('❌ TryCatchAction.transformToDatabase error:', error);
        return null;
    }
};

// Create panel
TryCatchAction.createPanel = (action) => {
    const id = generateActionId().id;
    return {
        panelId: id,
        actionName: 'Try/Catch',
        type: 'tryCatch',
        isExpanded: true,
        actions: [{
            id: id,
            name: 'Try/Catch',
            level: 0,
            tryBlock: [],
            catchBlock: [],
            user_create: "false",
            type: action.type || "19"
        }]
    };
};

// Clone panel
TryCatchAction.clonePanel = (originalPanel, parentId = null, level = null) => {
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

    // Clone tryBlock
    if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].tryBlock && Array.isArray(originalPanel.actions[0].tryBlock)) {
        const newTryBlock = originalPanel.actions[0].tryBlock.map(child => {
            const actionType = actionRegistry.getActionTypeFromName(child.actionName);
            const ActionClass = actionRegistry.getAction(actionType);
            if (ActionClass && ActionClass.clonePanel) {
                return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
            } else {
                console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
                return null;
            }
        });
        clonedAction.actions[0].tryBlock = newTryBlock;
    }

    // Clone catchBlock
    if (originalPanel.actions && originalPanel.actions[0] && originalPanel.actions[0].catchBlock && Array.isArray(originalPanel.actions[0].catchBlock)) {
        const newCatchBlock = originalPanel.actions[0].catchBlock.map(child => {
            const actionType = actionRegistry.getActionTypeFromName(child.actionName);
            const ActionClass = actionRegistry.getAction(actionType);
            if (ActionClass && ActionClass.clonePanel) {
                return ActionClass.clonePanel(child, newPanelId, newChildrenLevel);
            } else {
                console.error('❌ cloneNestedAction: No clonePanel method found for:', actionType);
                return null;
            }
        });
        clonedAction.actions[0].catchBlock = newCatchBlock;
    }

    console.log('🔄 cloneTryCatchAction result:', clonedAction);
    return clonedAction;
};
