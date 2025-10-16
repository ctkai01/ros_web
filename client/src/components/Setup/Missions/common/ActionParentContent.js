import React, { useState, useRef, useCallback, useEffect } from 'react';
import '../LoopAction/LoopAction.css';
import ActionContainer from '../ActionContainer';
import DraggableItem from '../DraggableItem';
import containerManager from '../ContainerManager';
import actionRegistry, { toggleRegistry } from '../ActionRegistry';
import { useSettings } from '../SettingsContext';
import { variableFromJson, variableToJson, generateActionId, generateNestedParentId, getActionName } from '../utils/actionIdGenerator';
import { getIconColorForLevel, getPanelColorForLevel } from '../utils/colorHelper';
import { getActionData, getActionId, getActionChildren, debugAction, getActionLevel, getActionUserCreate, getAction } from '../utils/actionHelper';
import ActionValueDisplay from '../common/ActionValueDisplay';

// hàm tìm phần tử theo panelId
const findElementByPanelId = (containerElement, panelId) => {
    console.log("containerElement", panelId);
    const element = containerElement.querySelector(`[data-item-id="${panelId}"]`);
    return element;
}

// Helper function to calculate drop zones - copied from MissionDetail
const calculateDropZones = (e, actionChildren) => {

    // Calculate drop position based on mouse position
    const containerElement = e.currentTarget;


    if (!containerElement || !actionChildren) {
        return {
            targetIndex: null,
            availabel: false
        };
    }

    if (actionChildren.length == 0) {
        return {
            targetIndex: 0,
            available: true
        };
    }
    const containerRect = containerElement.getBoundingClientRect();
    const dropY = e.clientY - containerRect.top;
    const zones = [];

    // Calculate zones for each possible drop position
    for (let i = 0; i <= actionChildren.length; i++) {
        let zoneStart, zoneEnd;

        if (i === 0) {
            // Zone before first child
            const firstChild = findElementByPanelId(containerElement, actionChildren[0].panelId);
            if (firstChild) {
                const firstChildRect = firstChild.getBoundingClientRect();
                zoneStart = 0;
                zoneEnd = firstChildRect.top - containerRect.top + firstChildRect.height / 2;
            }
        } else if (i === actionChildren.length) {
            // Zone after last child
            const lastChild = findElementByPanelId(containerElement, actionChildren[actionChildren.length - 1].panelId);
            if (lastChild) {
                const lastChildRect = lastChild.getBoundingClientRect();
                zoneStart = lastChildRect.bottom - containerRect.top - lastChildRect.height / 2;
                zoneEnd = containerRect.height;
            }
        } else {
            // Zone between children
            const prevChild = findElementByPanelId(containerElement, actionChildren[i - 1].panelId);
            const currentChild = findElementByPanelId(containerElement, actionChildren[i].panelId);

            if (prevChild && currentChild) {
                const prevChildRect = prevChild.getBoundingClientRect();
                const currentChildRect = currentChild.getBoundingClientRect();
                zoneStart = prevChildRect.bottom - containerRect.top - prevChildRect.height / 2;
                zoneEnd = currentChildRect.top - containerRect.top + currentChildRect.height / 2;
            }
        }

        zones.push({
            index: i,
            start: zoneStart,
            end: zoneEnd,
            center: (zoneStart + zoneEnd) / 2
        });
    }

    // Find target index
    let targetIndex = actionChildren.length; // Default to end
    for (let i = 0; i < zones.length; i++) {
        if (dropY >= zones[i].start && dropY < zones[i].end) {
            targetIndex = zones[i].index;
            break;
        }
    }


    return {
        targetIndex: targetIndex,
        available: true
    };
};

const ActionParentContent = ({
    parentAction,
    onClone,
    onSettings,
    branchName,            // Tên của nhánh con cần render ('children', 'thenBlock', 'elseBlock', 'yesBlock', 'noBlock', 'timeoutBlock', 'tryBlock', 'catchBlock')
    onRemove,
    onActionUpdate,
    onParentContentUpdate, // Sử dụng một trong hai callback này để cập nhật
    forceReload = 0,
    renderKey = 0
}) => {


    const [isDragOver, setIsDragOver] = useState(false);
    const [dropIndicatorIndex, setDropIndicatorIndex] = useState(-1);
    
    // Monitor parentAction changes
    useEffect(() => {
        const actionData = getAction(parentAction);
    }, [parentAction, branchName]);
    
    // Lấy ra mảng các action con từ đúng nhánh được chỉ định
    const getChildren = useCallback(() => {
        const actionData = getAction(parentAction);
        const children = actionData[branchName] || [];

        return children;
    }, [parentAction, branchName]);


    const handleDragEnter = (e) => {
        // e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Ngăn sự kiện nổi bọt lên các container cha
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDropEvent = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("🔍 ActionParentContent handleDropEvent:", {
            branchName,
            parentActionId: parentAction.panelId,
            eventTarget: e.currentTarget.className
        });
        
        // Save drop event for position calculation
        window.lastDropEvent = e;
        
        // Get draggedItem from window
        const draggedItem = window.draggedItem;
        if (draggedItem) {
            console.log("🔍 Calling handleDrop with:", {
                draggedItem: {
                    type: draggedItem.type,
                    panelId: draggedItem.panelId,
                    sourceContainerId: draggedItem.sourceContainerId,
                    sourceBranch: draggedItem.sourceBranch
                },
                containerId: parentAction.panelId,
                branchName
            });
            handleDrop(draggedItem, parentAction.panelId);
        }
    };

    const handleDrop = (draggedItem, containerId) => {
        console.log("handleDrop", draggedItem, containerId);

        // Get drop event from window or from the event parameter
        let dropEvent = window.lastDropEvent;
        
        // If no dropEvent in window, try to get it from the event parameter
        if (!dropEvent && draggedItem && draggedItem.event) {
            dropEvent = draggedItem.event;
        }
        
        // Fallback: try to get draggedItem from dataTransfer if window.draggedItem is not available
        if (!draggedItem) {
            console.log("❌ No draggedItem found");
            return;
        }
        if (!dropEvent) {
            console.log("❌ No dropEvent found");
            return;
        }


        const result = calculateDropZones(dropEvent, getChildren());
        if (!result.available) {
            console.log("❌ warning not available");
            return;
        }
        const targetIndex = result.targetIndex;
        console.log("🔍 targetIndex", targetIndex);

        // Handle cross-container drops when draggedItem is available
        const children = getChildren();
        console.log("🔍 children", children);
        // --- Xử lý khi SẮP XẾP LẠI các item trong cùng một khối ---
        console.log("🔍 draggedItem.sourceContainerId", draggedItem.sourceContainerId);
        console.log("🔍 parentAction.panelId", parentAction.panelId);
        if (draggedItem.type === 'panel' && draggedItem.sourceContainerId === parentAction.panelId && draggedItem.sourceBranch === branchName) {

            console.log("🔍 draggedItem.sourceBranch", draggedItem.sourceBranch);
            console.log("🔍 branchName", branchName);
            console.log("🔍 draggedItem.panelId", draggedItem.panelId);
            console.log("🔍 children", children);
            const draggedIndex = children.findIndex(c => c.panelId === draggedItem.panelId);
            if (draggedIndex === -1) return;

            const newChildren = [...children];
            const [movedItem] = newChildren.splice(draggedIndex, 1);

            // Điều chỉnh targetIndex nếu item được kéo từ vị trí trước đó
            const finalIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
            newChildren.splice(finalIndex, 0, movedItem);

            console.log("🔍 newChildren", newChildren);
            console.log("🔍 parentAction.panelId", parentAction.panelId);
            console.log("🔍 branchName", branchName);
            console.log("🔍 onParentaction", parentAction);
            console.log("🔍 Calling onParentContentUpdate with:", { [branchName]: newChildren });
            let newParentActionId = parentAction.panelId;
            if (parentAction.panelId.includes('thenBlock')) {
                newParentActionId = parentAction.panelId.replace('-thenBlock', '');
            } else if (parentAction.panelId.includes('elseBlock')) {
                newParentActionId = parentAction.panelId.replace('-elseBlock', '');
            } else if (parentAction.panelId.includes('yesBlock')) {
                newParentActionId = parentAction.panelId.replace('-yesBlock', '');
            } else if (parentAction.panelId.includes('noBlock')) {
                newParentActionId = parentAction.panelId.replace('-noBlock', '');
            } else if (parentAction.panelId.includes('timeoutBlock')) {
                newParentActionId = parentAction.panelId.replace('-timeoutBlock', '');
            } else if (parentAction.panelId.includes('children')) {
                newParentActionId = parentAction.panelId.replace('-children', '');
            } else if (parentAction.panelId.includes('tryBlock')) {
                newParentActionId = parentAction.panelId.replace('-tryBlock', '');
            } else if (parentAction.panelId.includes('catchBlock')) {
                newParentActionId = parentAction.panelId.replace('-catchBlock', '');
            }
            onParentContentUpdate(newParentActionId, { [branchName]: newChildren });
        }
        // --- Xử lý khi kéo một item từ khối/nhánh KHÁC vào ---
        else if (draggedItem.type === 'panel') {
            console.log("🔍 draggedItem.type === 'panel'", draggedItem);

            // Lấy lớp Action tương ứng từ registry để sử dụng hàm clonePanel
            const actionType = actionRegistry.getActionTypeFromName(draggedItem.data.actionName);
            const ActionClass = actionRegistry.getAction(actionType);

            if (!ActionClass || !ActionClass.clonePanel) {
                console.error(`Lỗi: Không tìm thấy clonePanel cho action type: ${actionType}`);
                return;
            }

            // 1. Tạo một bản sao SÂU (deep clone) của item được kéo.
            // clonePanel sẽ tạo ra các ID mới, giải quyết vấn đề xung đột ID.
            const parentLevel = getActionLevel(parentAction);
            let  newParentActionId = parentAction.panelId;
            if (parentAction.panelId.includes('thenBlock')) {
                newParentActionId = parentAction.panelId.replace('-thenBlock', '');
            } else if (parentAction.panelId.includes('elseBlock')) {
                newParentActionId = parentAction.panelId.replace('-elseBlock', '');
            } else if (parentAction.panelId.includes('yesBlock')) {
                newParentActionId = parentAction.panelId.replace('-yesBlock', '');
            } else if (parentAction.panelId.includes('noBlock')) {
                newParentActionId = parentAction.panelId.replace('-noBlock', '');
            } else if (parentAction.panelId.includes('timeoutBlock')) {
                newParentActionId = parentAction.panelId.replace('-timeoutBlock', '');
            } else if (parentAction.panelId.includes('children')) {
                newParentActionId = parentAction.panelId.replace('-children', '');
            } else if (parentAction.panelId.includes('tryBlock')) {
                newParentActionId = parentAction.panelId.replace('-tryBlock', '');
            } else if (parentAction.panelId.includes('catchBlock')) {
                newParentActionId = parentAction.panelId.replace('-catchBlock', '');
            } 
            const newPanel = ActionClass.clonePanel(draggedItem.data, newParentActionId, parentLevel + 1);

            // 2. Thêm bản sao MỚI vào vị trí mới.
            const newChildren = [...children];
            newChildren.splice(targetIndex, 0, newPanel);
            onParentContentUpdate(newParentActionId, { [branchName]: newChildren });

            // 3. Gọi hàm xóa item GỐC khỏi vị trí cũ.
            // Sử dụng setTimeout để đảm bảo việc thêm mới được xử lý trước khi xóa,
            // tránh các xung đột render của React.

            console.log("🔍 onRemove", draggedItem.panelId);
            setTimeout(() => onRemove(draggedItem.panelId), 0);
        }

    };


    return (
        <div
            className={`mission-action-parent-content-area  ${isDragOver ? 'drag-over' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropEvent}
        >
            {getChildren().length > 0 && (
                <div className="mission-action-children">
                    {/* Nested Container cho Loop children */}
                    <ActionContainer
                        key={`${parentAction.panelId}-${forceReload || 0}-${renderKey}-${Date.now()}`}
                        containerId={parentAction.panelId}
                        level={parentAction.level}
                        parentId={parentAction.parentId}
                        forceReload={forceReload}
                        renderKey={renderKey}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={handleDrop}
                        onDragLeave={() => {
                            setDropIndicatorIndex(-1);
                        }}
                    >
                        {getChildren().map((child, index) => {

                            // Try to use ActionRegistry to get the appropriate component
                            let actionType = 'unknown';
                            // Determine the type of action and render accordingly
                            const actionName = child.actionName || '';

                            // Skip rendering if child is invalid
                            if (!child || !actionName) {
                                console.warn('Skipping invalid child:', child);
                                return null;
                            }

                            // Ensure unique key - use child.id if available, otherwise use index
                            const uniqueKey = child.id || `child-${index}-${Date.now()}`;

                            // Render drop indicator before this child if needed
                            const showDropIndicatorBefore = dropIndicatorIndex === index;

                            actionType = actionRegistry.getActionTypeFromName(child.actionName);
                            if (actionType === 'unknown') {
                                console.error(`❌ Unknown action type: ${child.actionName}`);
                                return null;
                            }

                            // Get action class from registry
                            const ActionComponent = actionRegistry.getAction(actionType);

                            if (ActionComponent) {
                                // Use registered action component
                                // For Loop panels, pass the entire child object to preserve children structure
                                const actionData = getActionData(child);

                                // Add parentId to action data for nested actions
                                const actionDataWithParent = {
                                    ...actionData,
                                    parentId: child.parentId // Use child's actual parentId, don't override it
                                };
    

                                return (
                                    <React.Fragment key={uniqueKey}>
                                        {showDropIndicatorBefore && (
                                            <div className="drop-indicator" style={{ top: '-1px' }} />
                                        )}
                                        <DraggableItem
                                            key={`${child.id}-${forceReload}-${renderKey}`}
                                            itemId={child.id}
                                            containerId={getAction(parentAction).panelId}
                                            type="panel"
                                            data={child}
                                            panelId={child.panelId}
                                            actionName={child.actionName}
                                            description={child.description}
                                            sourceBranch={branchName}
                                            className="action-child-item"
                                        >
                                            <ActionComponent
                                                key={child.panelId}
                                                action={actionDataWithParent}
                                                panelId={child.panelId} // Use child's own panelId for nested actions
                                                parentId={child.parentId} // Pass the actual parentId to the component
                                                containerId={getAction(parentAction).panelId}
                                                onClone={onClone}
                                                onSettings={onSettings}
                                                onRemove={onRemove}
                                                onActionUpdate={onActionUpdate}
                                                onParentContentUpdate={onParentContentUpdate}
                                                forceReload={forceReload}
                                                renderKey={renderKey}
                                            />
                                        </DraggableItem>
                                    </React.Fragment>
                                );
                            }


                        })}
                        {/* Drop indicator for append to end */}
                        {dropIndicatorIndex === getChildren().length && (
                            <div className="drop-indicator" style={{ top: '0px' }} />
                        )}
                    </ActionContainer>
                </div>
            )}
        </div>
    );
};

export default ActionParentContent;
