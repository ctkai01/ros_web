import React from 'react';
import containerManager from './ContainerManager';
import { getAction } from './utils/actionHelper';
class DraggableItem extends React.Component {
  constructor(props) {
    super(props);
    this.itemId = props.panelId || `item-${Date.now()}`;
    this.containerId = props.data.parentId ? props.data.parentId : 'root-container';
  }

  handleDragStart = (e) => {
    
    e.stopPropagation();

    console.log("🔍 handleDragStart", e);

    const itemData = {
      type: this.props.type,
      id: this.itemId,
      panelId: this.props.panelId,
      data: this.props.data,
      containerId: this.containerId,
      actionName: this.props.actionName,
      description: this.props.description,
      sourceContainerId: this.containerId,
      sourceBranch: this.props.sourceBranch || null
    };
    console.log("🔍 handleDragStart: itemData", itemData);
    // Set window.draggedItem for use in handleContentDrop
    window.draggedItem = itemData;

    containerManager.handleDragStart(this.containerId, itemData);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(itemData));


    // Ensure we add the class on the wrapper element, not a child
    if (e.currentTarget && e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging');
    }

  }

  handleDragEnd = (e) => {
    e.stopPropagation();

    console.log("🔍 handleDragEnd", e);
    if (e.currentTarget && e.currentTarget.classList) {
      e.currentTarget.classList.remove('dragging');
    }
    // If drop was not accepted (no valid target), consumers should revert state.
    // We only clear manager state here.
    containerManager.clearDragState();

    // Clear window.draggedItem
    window.draggedItem = null;

  }

  handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }

  // Touch events for mobile support - DISABLED for debugging
  handleTouchStart = (e) => {
    console.log('🎯 Touch start DISABLED for debugging');
    return; // DISABLED for debugging
    
    // console.log('🎯 Touch start on runner icon container:', e.touches.length);
    // 
    // try {
    //   e.preventDefault();
    // } catch (error) {
    //   // Ignore passive event listener error
    //   console.warn('Cannot preventDefault on passive event:', error);
    // }
    // e.stopPropagation();
    // 
    // if (e.touches.length === 1) {
    //   const touch = e.touches[0];
    //   this.touchStartX = touch.clientX;
    //   this.touchStartY = touch.clientY;
    //   this.touchStartTime = Date.now();
    //   this.isTouchDragging = false;
    //   console.log('🎯 Touch start position:', { x: this.touchStartX, y: this.touchStartY });
    // }
  }

  handleTouchMove = (e) => {
    console.log('🎯 Touch move DISABLED for debugging');
    return; // DISABLED for debugging
    
    // try {
    //   e.preventDefault(); // Prevent scrolling
    // } catch (error) {
    //   // Ignore passive event listener error
    //   console.warn('Cannot preventDefault on passive event:', error);
    // }
    // e.stopPropagation();
    // 
    // if (e.touches.length === 1 && this.touchStartX !== undefined) {
    //   const touch = e.touches[0];
    //   const deltaX = Math.abs(touch.clientX - this.touchStartX);
    //   const deltaY = Math.abs(touch.clientY - this.touchStartY);
    //   const deltaTime = Date.now() - this.touchStartTime;
    //   
    //   // Start drag if moved more than 10px or 200ms
    //   if ((deltaX > 10 || deltaY > 10 || deltaTime > 200) && !this.isTouchDragging) {
    //     this.isTouchDragging = true;
    //     this.startTouchDrag();
    //   }
    //   
    //   // Update drag preview position if dragging
    //   if (this.isTouchDragging && this.touchDragPreview) {
    //     console.log('🎯 Touch dragging, updating preview position...');
    //     this.touchStartX = touch.clientX;
    //     this.touchStartY = touch.clientY;
    //     this.updateTouchDragPreview();
    //   }
    // }
  }

  handleTouchEnd = (e) => {
    console.log('🎯 Touch end DISABLED for debugging');
    return; // DISABLED for debugging
    
    // try {
    //   e.preventDefault();
    // } catch (error) {
    //   // Ignore passive event listener error
    //   console.warn('Cannot preventDefault on passive event:', error);
    // }
    // e.stopPropagation();
    // 
    // if (this.isTouchDragging) {
    //   this.endTouchDrag();
    // }
    // 
    // // Reset touch state
    // this.touchStartX = undefined;
    // this.touchStartY = undefined;
    // this.touchStartTime = undefined;
    // this.isTouchDragging = false;
  }

  startTouchDrag = () => {
    // Create synthetic drag start event
    const syntheticEvent = {
      currentTarget: this.refs.draggableElement,
      dataTransfer: {
        effectAllowed: 'move',
        setData: () => {},
        dropEffect: 'move'
      },
      stopPropagation: () => {},
      preventDefault: () => {},
      // Add offsetX and offsetY for drag image positioning
      offsetX: 0,
      offsetY: 0
    };
    
    try {
      this.handleDragStart(syntheticEvent);
      
      // Forward to ContainerManager if available
      if (window.containerManager) {
        console.log('🎯 Forwarding drag start to ContainerManager...');
        const itemData = {
          type: this.props.type || 'panel',
          id: this.props.id,
          panelId: this.props.panelId,
          data: this.props.data,
          containerId: this.props.containerId,
          actionName: this.props.actionName,
          description: this.props.description,
          sourceBranch: this.props.sourceBranch
        };
        
        window.containerManager.handleDragStart(this.props.containerId || 'root-container', itemData);
      }
      
      // Create custom drag preview for touch
      this.createTouchDragPreview();
    } catch (error) {
      console.warn('Error in startTouchDrag:', error);
    }
  }

  createTouchDragPreview = () => {
    console.log('🎯 Creating touch drag preview...');
    
    // Clone the element for drag preview
    const originalElement = this.refs.draggableElement;
    const clone = originalElement.cloneNode(true);
    
    // Style the clone
    clone.style.position = 'fixed';
    clone.style.top = '0px';
    clone.style.left = '0px';
    clone.style.zIndex = '99999';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.8';
    clone.style.transform = 'rotate(0deg)';
    clone.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
    clone.style.width = originalElement.offsetWidth + 'px';
    clone.style.height = originalElement.offsetHeight + 'px';
    clone.style.backgroundColor = 'white';
    clone.style.border = '1px solid #ccc';
    clone.style.borderRadius = '4px';
    
    // Remove dragging class from clone
    clone.classList.remove('dragging');
    
    // Add to body
    document.body.appendChild(clone);
    this.touchDragPreview = clone;
    
    console.log('🎯 Touch drag preview created:', clone);
    
    // Position at touch location
    this.updateTouchDragPreview();
  }

  updateTouchDragPreview = () => {
    if (this.touchDragPreview && this.touchStartX !== undefined && this.touchStartY !== undefined) {
      this.touchDragPreview.style.left = (this.touchStartX - 25) + 'px';
      this.touchDragPreview.style.top = (this.touchStartY - 25) + 'px';
      console.log('🎯 Updating touch drag preview position:', {
        x: this.touchStartX,
        y: this.touchStartY,
        left: this.touchDragPreview.style.left,
        top: this.touchDragPreview.style.top
      });
    }
  }

  removeTouchDragPreview = () => {
    if (this.touchDragPreview) {
      console.log('🎯 Removing touch drag preview...');
      document.body.removeChild(this.touchDragPreview);
      this.touchDragPreview = null;
    }
  }

  endTouchDrag = () => {
    console.log('🎯 Touch drag ending, checking for drop zones...');
    
    // Check if we're over a drop zone
    const dropTarget = this.findDropTargetAtPosition(this.touchStartX, this.touchStartY);
    console.log('🎯 Drop target found:', dropTarget);
    
    // If we found a drop target, trigger drop event
    if (dropTarget) {
      console.log('🎯 Triggering drop event on target:', dropTarget);
      this.triggerDropEvent(dropTarget);
    }
    
    // Remove drag preview
    this.removeTouchDragPreview();
    
    // Create synthetic drag end event
    const syntheticEvent = {
      currentTarget: this.refs.draggableElement,
      stopPropagation: () => {},
      preventDefault: () => {}
    };
    
    try {
      this.handleDragEnd(syntheticEvent);
      
      // Forward to ContainerManager if available
      if (window.containerManager) {
        console.log('🎯 Forwarding drag end to ContainerManager...');
        window.containerManager.clearDragState();
      }
    } catch (error) {
      console.warn('Error in endTouchDrag:', error);
    }
  }

  triggerDropEvent = (dropTarget) => {
    // Create synthetic drop event
    const dropEvent = new Event('drop', {
      bubbles: true,
      cancelable: true
    });
    
    // Add dataTransfer to the event
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        effectAllowed: 'move',
        dropEffect: 'move',
        getData: () => this.props.panelId || this.props.id,
        setData: () => {}
      }
    });
    
    // Dispatch the drop event
    dropTarget.dispatchEvent(dropEvent);
    console.log('🎯 Drop event dispatched to:', dropTarget);
    
    // Also trigger ContainerManager if available
    if (window.containerManager) {
      console.log('🎯 Forwarding to ContainerManager...');
      
      // Try multiple ways to get container ID
      let containerId = dropTarget.getAttribute('data-container-id') || 
                       dropTarget.getAttribute('data-droppable-id') ||
                       dropTarget.closest('[data-container-id]')?.getAttribute('data-container-id') ||
                       dropTarget.closest('[data-droppable-id]')?.getAttribute('data-droppable-id');
      
      // If still no container ID, try to infer from classes
      if (!containerId) {
        if (dropTarget.classList.contains('action-panels-container-nested')) {
          containerId = 'nested-container';
        } else if (dropTarget.classList.contains('action-panels-container-root')) {
          containerId = 'root-container';
        } else if (dropTarget.classList.contains('mission-action-parent-content-area')) {
          containerId = 'parent-content-area';
        } else {
          containerId = 'root-container'; // fallback
        }
      }
      
      console.log('🎯 Using container ID:', containerId);
      window.containerManager.handleDrop(containerId, dropEvent);
    }
  }

  findDropTargetAtPosition = (x, y) => {
    // Find element at touch position
    const elementAtPoint = document.elementFromPoint(x, y);
    console.log('🎯 Element at touch point:', elementAtPoint);
    
    if (!elementAtPoint) return null;
    
    // Look for drop zone indicators - try multiple selectors
    let dropZone = elementAtPoint.closest('.droppable-area, .action-panels-container, .action-panels-container-nested, .mission-action-parent-content-area, .action-panels-container-root');
    
    // If not found, try looking for containers with data attributes
    if (!dropZone) {
      dropZone = elementAtPoint.closest('[data-container-id], [data-droppable-id]');
    }
    
    // If still not found, try looking for nested containers
    if (!dropZone) {
      dropZone = elementAtPoint.closest('.action-container, .loop-action, .if-action');
    }
    
    console.log('🎯 Drop zone found:', dropZone);
    console.log('🎯 Drop zone classes:', dropZone?.className);
    console.log('🎯 Drop zone data attributes:', {
      containerId: dropZone?.getAttribute('data-container-id'),
      droppableId: dropZone?.getAttribute('data-droppable-id')
    });
    
    return dropZone;
  }

  componentDidMount() {
    console.log('🎯 DraggableItem componentDidMount - touch listeners DISABLED for debugging');
    // this.addTouchListeners(); // DISABLED for debugging
  }

  componentDidUpdate() {
    // Ensure touch listeners are added if ref becomes available
    // this.addTouchListeners(); // DISABLED for debugging
  }

  addTouchListeners = () => {
    // Add touch event listeners only to runner icon container
    if (this.refs.draggableElement && !this.touchListenersAdded) {
      console.log('🎯 Adding touch listeners to runner icon container');
      
      // Find the runner icon container within this draggable item
      const runnerIconContainer = this.refs.draggableElement.querySelector('.mission-action-runner-icon-container');
      
      if (runnerIconContainer) {
        console.log('🎯 Found runner icon container, adding touch listeners');
        runnerIconContainer.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        runnerIconContainer.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        runnerIconContainer.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.touchListenersAdded = true;
        this.runnerIconContainer = runnerIconContainer; // Store reference for cleanup
      } else {
        console.warn('🎯 No runner icon container found in draggable item');
      }
    } else if (!this.refs.draggableElement) {
      console.warn('🎯 No draggableElement ref found!');
    }
  }

  componentWillUnmount() {
    // Remove touch event listeners from runner icon container
    // DISABLED for debugging
    // if (this.runnerIconContainer && this.touchListenersAdded) {
    //   this.runnerIconContainer.removeEventListener('touchstart', this.handleTouchStart);
    //   this.runnerIconContainer.removeEventListener('touchmove', this.handleTouchMove);
    //   this.runnerIconContainer.removeEventListener('touchend', this.handleTouchEnd);
    //   this.touchListenersAdded = false;
    // }
    
    // Cleanup drag preview
    this.removeTouchDragPreview();
  }

  render() {
    const {
      children,
      className,
      style,
      itemId,
      containerId,
      type,
      data,
      panelId,
      actionName,
      description,
      sourceBranch,
      ...domProps
    } = this.props;

    return (
      <div
        ref={(el) => this.refs = { draggableElement: el }}
        className={`draggable-item ${className || ''}`}
        style={{ ...style, touchAction: 'none' }}
        draggable={this.props.draggable !== false}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
        data-item-id={this.itemId}
        data-container-id={this.containerId}
        {...domProps}
      >
        {children}
      </div>
    );
  }
}

export default DraggableItem; 