class ContainerManager {
  constructor() {
    this.containers = new Map();
    this.draggedItem = null;
    this.activeContainer = null;
    this.hierarchy = new Map();
    this.eventCallbacks = new Map();
    this.snapshot = null; // store original state for revert
    this.dropAccepted = false;
    this.bufferZones = new Map(); // Track buffer zone states
  }

  // Đăng ký container
  registerContainer(containerId, level, parentId = null, callbacks = {}) {
    const container = {
      id: containerId,
      level,
      parentId,
      children: [],
      draggedItem: null,
      isDragOver: false,
      bufferZone: null, // Track current buffer zone: 'top', 'bottom', 'middle', null
      callbacks
    };
    
    this.containers.set(containerId, container);
    this.updateHierarchy(containerId, parentId);
    
    return container;
  }

  // Cập nhật hierarchy
  updateHierarchy(containerId, parentId) {
    if (parentId) {
      const parent = this.containers.get(parentId);
      if (parent) {
        parent.children.push(containerId);
      }
    }
    this.hierarchy.set(containerId, parentId);
  }

  // Xử lý drag start
  handleDragStart(containerId, itemData) {
    this.draggedItem = {
      ...itemData,
      sourceContainerId: containerId,
      timestamp: Date.now()
    };
    this.activeContainer = containerId;
    this.dropAccepted = false;
    // take a lightweight snapshot for revert
    this.snapshot = {
      sourceContainerId: containerId,
      itemId: itemData.panelId || itemData.id,
      // caller should store ordering externally if needed; keep marker only
    };

  }

  // Xử lý drag over
  handleDragOver(containerId, event) {
    event.preventDefault();
    event.stopPropagation();

    const container = this.containers.get(containerId);
    if (!container) {
      console.log('❌ ContainerManager: Container not found', { containerId });
      return;
    }

    const canDrop = this.validateDrop(containerId);
    
    if (canDrop) {
      event.dataTransfer.dropEffect = 'move';
      container.isDragOver = true;
      this.activeContainer = containerId;
    } else {
      event.dataTransfer.dropEffect = 'none';
      container.isDragOver = false;
    }

     console.log('🟨 ContainerManager: Drag Over', {
      containerId,
      canDrop,
      draggedItem: this.draggedItem ? {
        type: this.draggedItem.type,
        id: this.draggedItem.id,
        sourceContainerId: this.draggedItem.sourceContainerId,
        sourceBranch: this.draggedItem.sourceBranch
      } : null
    });
  }

  // Validate drop permission
  validateDrop(targetContainerId) {
    if (!this.draggedItem) {
      console.log('❌ ContainerManager: No dragged item');
      return false;
    }
    console.log("🔍 validateDrop", {
      draggedItem: this.draggedItem,
      sourceContainerId: this.draggedItem.sourceContainerId,
      targetContainerId: targetContainerId,
      containers: this.containers
    });
    let sourceContainerId = this.draggedItem.sourceContainerId;
    if(this.draggedItem.sourceBranch === 'thenBlock') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-thenBlock`;
    } else if (this.draggedItem.sourceBranch === 'elseBlock') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-elseBlock`;
    } else if (this.draggedItem.sourceBranch === 'yesBlock') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-yesBlock`;
    } else if (this.draggedItem.sourceBranch === 'noBlock') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-noBlock`;
    } else if (this.draggedItem.sourceBranch === 'timeoutBlock') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-timeoutBlock`;
    }else if(this.draggedItem.sourceBranch === 'children') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-children`;
    }else if(this.draggedItem.sourceBranch === 'tryBlock') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-tryBlock`;
    }else if(this.draggedItem.sourceBranch === 'catchBlock') {
      sourceContainerId = `${this.draggedItem.sourceContainerId}-catchBlock`;
    }
    const sourceContainer = this.containers.get(sourceContainerId);
    const targetContainer = this.containers.get(targetContainerId);


    if (!sourceContainer || !targetContainer) {
      console.log('❌ ContainerManager: Container not found', {
        sourceContainer: !!sourceContainer,
        targetContainer: !!targetContainer
      });
      return false;
    }

    // Cho phép reordering trong cùng container
    if (targetContainerId === this.draggedItem.sourceContainerId) {
      // console.log('✅ ContainerManager: Allowing reordering within same container');
      return true;
    }

    // Kiểm tra hierarchy rules cho cross-container drops
    const canDrop = this.checkHierarchyRules(sourceContainer, targetContainer);
    // console.log('✅ ContainerManager: Cross-container drop validation', {
    //   canDrop,
    //   sourceLevel: sourceContainer.level,
    //   targetLevel: targetContainer.level
    // });
    
    return canDrop;
  }

  // Kiểm tra quy tắc hierarchy
  checkHierarchyRules(source, target) {
    // Root container có thể nhận từ tất cả
    if (target.level === 'root') return true;

    // Nested container có thể nhận từ root, nested, hoặc deep_nested
    if (target.level === 'nested') {
      return source.level === 'root' || source.level === 'nested' || source.level === 'deep_nested';
    }

    // Deep nested chỉ nhận từ cùng level
    if (target.level === 'deep_nested') {
      return source.level === 'deep_nested';
    }

    return false;
  }

  // Xử lý drop
  handleDrop(containerId, event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('🔍 ContainerManager.handleDrop called:', { containerId, event });

    const container = this.containers.get(containerId);
    if (!container) {
      console.log('❌ ContainerManager: Container not found for drop', { containerId });
      console.log('🔍 Available containers:', Array.from(this.containers.keys()));
      return;
    }

    console.log('🔍 Container found:', {
      id: container.id,
      level: container.level,
      hasCallbacks: !!container.callbacks,
      hasOnDrop: !!container.callbacks?.onDrop
    });

    container.isDragOver = false;

    const canDrop = this.validateDrop(containerId);

    if (canDrop) {
      console.log('✅ ContainerManager: Drop successful', {
        targetContainer: containerId,
        draggedItem: this.draggedItem ? {
          type: this.draggedItem.type,
          id: this.draggedItem.id,
          sourceContainerId: this.draggedItem.sourceContainerId
        } : null,
        isReordering: containerId === this.draggedItem?.sourceContainerId
      });
      
      // Trigger drop callback
      if (container.callbacks.onDrop) {
        console.log('🔍 Calling onDrop callback...');
        try {
          container.callbacks.onDrop(this.draggedItem, containerId);
          this.dropAccepted = true;
          console.log('✅ onDrop callback executed successfully');
        } catch (error) {
          console.error('❌ Error in onDrop callback:', error);
        }
      } else {
        console.log('❌ No onDrop callback found for container:', containerId);
      }
    } else {
      console.log('❌ ContainerManager: Drop failed validation');
    }

    this.clearDragState();
  }

  // Clear drag state
  clearDragState() {
    console.log('🔄 ContainerManager: Clearing drag state');
    this.draggedItem = null;
    this.activeContainer = null;
    
    // Clear all drag over states
    this.containers.forEach(container => {
      container.isDragOver = false;
    });
    this.snapshot = null;
    this.dropAccepted = false;
  }

  // Get container state
  getContainerState(containerId) {
    return this.containers.get(containerId);
  }

  // Check if container is drag over
  isDragOver(containerId) {
    const container = this.containers.get(containerId);
    return container ? container.isDragOver : false;
  }

  // Get dragged item
  getDraggedItem() {
    return this.draggedItem;
  }

  // Set container callbacks
  setContainerCallbacks(containerId, callbacks) {
    const container = this.containers.get(containerId);
    if (container) {
      container.callbacks = { ...container.callbacks, ...callbacks };
    }
  }

  // Unregister container
  unregisterContainer(containerId) {
    this.containers.delete(containerId);
    this.hierarchy.delete(containerId);
    
    // Remove from parent's children
    this.containers.forEach(container => {
      container.children = container.children.filter(id => id !== containerId);
    });
  }

  // Get all containers
  getAllContainers() {
    return Array.from(this.containers.values());
  }

  // Get containers by level
  getContainersByLevel(level) {
    return Array.from(this.containers.values()).filter(container => container.level === level);
  }

  // Get child containers
  getChildContainers(parentId) {
    return Array.from(this.containers.values()).filter(container => container.parentId === parentId);
  }

  // Buffer zone management
  setBufferZone(containerId, bufferType) {
    const container = this.containers.get(containerId);
    if (container) {
      container.bufferZone = bufferType;
      this.bufferZones.set(containerId, bufferType);
    }
  }

  getBufferZone(containerId) {
    const container = this.containers.get(containerId);
    return container ? container.bufferZone : null;
  }

  clearBufferZone(containerId) {
    const container = this.containers.get(containerId);
    if (container) {
      container.bufferZone = null;
      this.bufferZones.delete(containerId);
    }
  }

  clearAllBufferZones() {
    this.containers.forEach(container => {
      container.bufferZone = null;
    });
    this.bufferZones.clear();
  }

  // Get drop position info for buffer zones
  getDropPositionInfo(containerId) {
    const container = this.containers.get(containerId);
    if (!container) return null;

    return {
      containerId,
      bufferZone: container.bufferZone,
      isDragOver: container.isDragOver,
      canDrop: this.validateDrop(containerId)
    };
  }
}

// Global instance
const containerManager = new ContainerManager();

export default containerManager; 