import React, { useEffect, useRef } from 'react';
import containerManager from './ContainerManager';
import { getAction } from './utils/actionHelper';
const ActionContainer = (props) => {
  const containerId = props.containerId || `container-${Date.now()}`;
  //const level = props.level || 'root';
  const level = 'root';
  const parentId = props.parentId;
  const forceReload = props.forceReload || 0;
  const containerRef = useRef(null);
  
  // Register with manager
  useEffect(() => {
    
    containerManager.registerContainer(containerId, level, parentId, {
      onDrop: handleContainerDrop
    });

    // Log all registered containers

    // Cleanup on unmount
    return () => {
      containerManager.unregisterContainer(containerId);
    };
  }, [containerId, level, parentId, forceReload]);

  // Log when component re-renders
  useEffect(() => {
  }, [containerId, level, forceReload]);

  const handleContainerDrop = (draggedItem, containerId) => {
    console.log('🔍 ActionContainer.handleContainerDrop called:', { draggedItem, containerId, hasOnDrop: !!props.onDrop });
  
    if (props.onDrop) {
      console.log('🔍 Calling props.onDrop...');
      try {
        props.onDrop(draggedItem, containerId);
        console.log('✅ props.onDrop executed successfully');
      } catch (error) {
        console.error('❌ Error in props.onDrop:', error);
      }
    } else {
      console.log('❌ No props.onDrop provided for container:', containerId);
    }
  };

  const handleDragStart = (e, itemData) => {
    containerManager.handleDragStart(containerId, itemData);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    containerManager.handleDragOver(containerId, e);
    
    // Detect drop position for buffer zones
    detectDropPosition(e);
    
    // Log real-time mouse position during drag
    if (props.onDragOver) {
      props.onDragOver(e);
    }
  };

  // Detect drop position and apply buffer zone styles
  const detectDropPosition = (e) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const mouseY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
    
    if (mouseY === undefined) return;
    
    // Get all draggable items in this container
    const draggableItems = container.querySelectorAll('.draggable-item:not(.dragging)');
    
    // Remove existing buffer classes
    container.classList.remove('buffer-top', 'buffer-bottom');
    draggableItems.forEach(item => {
      item.classList.remove('buffer-zone-top', 'buffer-zone-bottom', 'buffer-zone-middle');
    });
    
    // Clear previous buffer zone in ContainerManager
    containerManager.clearBufferZone(containerId);
    
    // If container is empty, show top buffer
    if (draggableItems.length === 0) {
      container.classList.add('buffer-top');
      containerManager.setBufferZone(containerId, 'top');
      return;
    }
    
    // Get first and last item positions for more accurate detection
    const firstItem = draggableItems[0];
    const lastItem = draggableItems[draggableItems.length - 1];
    const firstRect = firstItem.getBoundingClientRect();
    const lastRect = lastItem.getBoundingClientRect();
    
    // Check if mouse is above first item (top buffer)
    if (mouseY < firstRect.top - 20) {
      container.classList.add('buffer-top');
      containerManager.setBufferZone(containerId, 'top');
      return;
    }
    
    // Check if mouse is below last item (bottom buffer)
    if (mouseY > lastRect.bottom + 20) {
      container.classList.add('buffer-bottom');
      containerManager.setBufferZone(containerId, 'bottom');
      return;
    }
    
    // Check for middle buffer between items
    for (let i = 0; i < draggableItems.length - 1; i++) {
      const currentItem = draggableItems[i];
      const nextItem = draggableItems[i + 1];
      
      const currentRect = currentItem.getBoundingClientRect();
      const nextRect = nextItem.getBoundingClientRect();
      
      // Check if mouse is between current and next item
      if (mouseY > currentRect.bottom && mouseY < nextRect.top) {
        const gapCenter = (currentRect.bottom + nextRect.top) / 2;
        const gapThreshold = 25; // 25px threshold around gap center
        
        if (Math.abs(mouseY - gapCenter) < gapThreshold) {
          currentItem.classList.add('buffer-zone-middle');
          containerManager.setBufferZone(containerId, 'middle');
          return;
        }
      }
    }
    
    // If mouse is near the top of first item, show top buffer
    if (mouseY >= firstRect.top - 20 && mouseY <= firstRect.top + 20) {
      container.classList.add('buffer-top');
      containerManager.setBufferZone(containerId, 'top');
      return;
    }
    
    // If mouse is near the bottom of last item, show bottom buffer
    if (mouseY >= lastRect.bottom - 20 && mouseY <= lastRect.bottom + 20) {
      container.classList.add('buffer-bottom');
      containerManager.setBufferZone(containerId, 'bottom');
      return;
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear buffer zones when leaving container
    clearBufferZones();
  };

  // Clear all buffer zone styles
  const clearBufferZones = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const draggableItems = container.querySelectorAll('.draggable-item');
    
    // Remove container buffer classes
    container.classList.remove('buffer-top', 'buffer-bottom');
    
    // Remove item buffer classes
    draggableItems.forEach(item => {
      item.classList.remove('buffer-zone-top', 'buffer-zone-bottom', 'buffer-zone-middle');
    });
    
    // Clear buffer zone in ContainerManager
    containerManager.clearBufferZone(containerId);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear buffer zones on drop
    clearBufferZones();
    
    // Save drop event for position calculation
    window.lastDropEvent = e;
    
    containerManager.handleDrop(containerId, e);
  };

  // Touch events for mobile support
  const handleTouchStart = (e) => {
    try {
      e.preventDefault();
    } catch (error) {
      // Ignore passive event listener error
      console.warn('Cannot preventDefault on passive event:', error);
    }
    e.stopPropagation();
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      window.touchStartX = touch.clientX;
      window.touchStartY = touch.clientY;
      window.touchStartTime = Date.now();
      window.isTouchDragging = false;
    }
  };

  const handleTouchMove = (e) => {
    try {
      e.preventDefault(); // Prevent scrolling
    } catch (error) {
      // Ignore passive event listener error
      console.warn('Cannot preventDefault on passive event:', error);
    }
    e.stopPropagation();
    
    if (e.touches.length === 1 && window.touchStartX !== undefined) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - window.touchStartX);
      const deltaY = Math.abs(touch.clientY - window.touchStartY);
      const deltaTime = Date.now() - window.touchStartTime;
      
      // Start drag if moved more than 10px or 200ms
      if ((deltaX > 10 || deltaY > 10 || deltaTime > 200) && !window.isTouchDragging) {
        window.isTouchDragging = true;
        // Create synthetic drag over event
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          dataTransfer: {
            dropEffect: 'move'
          }
        };
        handleDragOver(syntheticEvent);
      }
      
      // Update buffer zones during touch move
      if (window.isTouchDragging) {
        const touchEvent = {
          clientY: touch.clientY,
          changedTouches: e.changedTouches
        };
        detectDropPosition(touchEvent);
      }
    }
  };

  const handleTouchEnd = (e) => {
    try {
      e.preventDefault();
    } catch (error) {
      // Ignore passive event listener error
      console.warn('Cannot preventDefault on passive event:', error);
    }
    e.stopPropagation();
    
    if (window.isTouchDragging) {
      // Create synthetic drop event
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY
      };
      handleDrop(syntheticEvent);
    }
    
    // Clear buffer zones on touch end
    clearBufferZones();
    
    // Reset touch state
    window.touchStartX = undefined;
    window.touchStartY = undefined;
    window.touchStartTime = undefined;
    window.isTouchDragging = false;
  };

  const isDragOver = containerManager.isDragOver(containerId);
  const containerClass = `action-panels-container-${level} ${isDragOver ? 'drag-over' : ''}`;

  return (
    <div
      ref={containerRef}
      key={`${containerId}-${forceReload}`}
      className={containerClass}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-container-id={containerId}
      data-parent-id={parentId}
    >
      {props.children}
    </div>
  );
};

export default ActionContainer; 