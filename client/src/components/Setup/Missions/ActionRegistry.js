import './ActionRegistry.css';

class ActionRegistry {
  constructor() {
    this.actions = new Map();
    this.settings = new Map();
    this.globalState = {
      selectedActions: [],
      points: null,
      footprints: []
    };
    this.updateCallbacks = new Map();
    this.isInitialized = false;
    this.initPromise = null;
  }
  getActionTypeFromName(name) {
    const n = (name || '').toString();
    if (n === 'Move') return 'move';
    if (n === 'Docking' || n === 'docking') return 'docking';
    if (n === 'RelativeMove' || n === 'Relative Move') return 'relativeMove';
    if (n === 'MoveToCoordinate' || n === 'Move To Coordinate' || n === 'Move to coordinate' || n === 'Move to Coordinate' || n === 'move to coordinate') return 'moveToCoordinate';
    if (n === 'Wait') return 'wait';
    if (n === 'Loop' || n === 'loop') return 'loop';
    if (n === 'If' || n === 'if') return 'if';
    if (n === 'Break') return 'break';
    if (n === 'Return') return 'return';
    if (n === 'Continue') return 'continue';
    if (n === 'While' || n === 'while') return 'while';
    if (n === 'Try/Catch' || n === 'TryCatch' || n === 'tryCatch') return 'tryCatch';
    if (n === 'Switch Map' || n === 'SwitchMap' || n === 'switchMap') return 'switchMap';
    if (n === 'Create Log' || n === 'CreateLog' || n === 'createLog') return 'createLog';
    if (n === 'Throw Error' || n === 'ThrowError' || n === 'throwError') return 'throwError';
    if (n === 'Prompt User' || n === 'PromptUser' || n === 'promptUser') return 'promptUser';
    // handle literal user-create names
    if (n === 'userCreate' || n === 'UserCreate' || n === 'User Action' || n === 'UserAction') return 'userCreate';
    return 'userCreate';
  }

  // Đăng ký action type
  registerAction(type, actionClass) {
    this.actions.set(type, actionClass);
  }

 

  // Đăng ký settings component
  registerSettings(type, settingsComponent) {
    this.settings.set(type, settingsComponent);
  }

  // Đăng ký callback để cập nhật state
  registerUpdateCallback(callback) {
    const id = Date.now();
    this.updateCallbacks.set(id, callback);
    return id;
  }

  // Gọi tất cả update callbacks
  notifyUpdate() {
    this.updateCallbacks.forEach(callback => {
      if (typeof callback === 'function') {
        callback(this.globalState.selectedActions);
      }
    });
  }


  // Tạo action panel
  createPanel(type, data = {}) {
    const actionClass = this.actions.get(type);
    if (!actionClass) {
      console.error(`❌ Action type not found: ${type}`);
      return null;
    }

    if (actionClass.createPanel) {
      return actionClass.createPanel(data);
    }
    return null;
  }

  // Parse từ database
  parseFromDatabase(action, index, mapWithPoints = [], actionsMap = {}, markers = []) {

    let actionName;
    if(action.User_create==='false'){
      actionName = action.Action_name || '';
    }else{
      actionName = 'userCreate';
    }
    const type = this.getActionTypeFromName(actionName);
    if (type === 'unknown') {
      console.error(`❌ Unknown action type: ${actionName}`);
      return null;
    }
    const actionClass = this.actions.get(type);
    if (!actionClass || !actionClass.parseFromDatabase) {
      console.error(`❌ Parser not found for: ${type}`);
      return null;
    }

    // Pass all parameters to all actions, let them decide what to use
    return actionClass.parseFromDatabase(action, index, mapWithPoints, actionsMap, markers);
  }

  // Transform to database
  transformToDatabase(action) {
    const type = action.type || 'unknown';
    const actionClass = this.actions.get(type);
    
    if (!actionClass || !actionClass.transformToDatabase) {
      console.error(`❌ Transformer not found for: ${type}`);
      return null;
    }

    return actionClass.transformToDatabase(action);
  }

  // Cập nhật global state
  updateGlobalState(newState) {
    this.globalState = { ...this.globalState, ...newState };
    this.notifyUpdate();
  }

  // Lấy settings component
  getSettingsComponent(type) {
    return this.settings.get(type);
  }

  // Lấy action component
  getAction(type) {
    const action = this.actions.get(type);
    return action;
  }

  // Self-update method (như C++)
  updateAction(actionId, newData) {
    const actionIndex = this.globalState.selectedActions.findIndex(
      action => action.id === actionId || action.panelId === actionId
    );

    if (actionIndex !== -1) {
      this.globalState.selectedActions[actionIndex] = {
        ...this.globalState.selectedActions[actionIndex],
        ...newData
      };
      this.notifyUpdate();
      return true;
    }

    // Tìm trong nested actions
    this.globalState.selectedActions.forEach(panel => {
      if (panel.children) {
        const childIndex = panel.children.findIndex(
          child => child.id === actionId || child.panelId === actionId
        );
        if (childIndex !== -1) {
          panel.children[childIndex] = {
            ...panel.children[childIndex],
            ...newData
          };
          this.notifyUpdate();
        }
      }
    });

    return false;
  }

  // Thêm action mới
  addAction(action) {
    this.globalState.selectedActions.push(action);
    this.notifyUpdate();
  }

  // Xóa action
  removeAction(actionId) {
    const index = this.globalState.selectedActions.findIndex(
      action => action.id === actionId || action.panelId === actionId
    );
    
    if (index !== -1) {
      this.globalState.selectedActions.splice(index, 1);
      this.notifyUpdate();
      return true;
    }

    return false;
  }

  // Clone action
  cloneAction(actionId) {
    const action = this.globalState.selectedActions.find(
      a => a.id === actionId || a.panelId === actionId
    );
    
    if (action) {
      const clonedAction = {
        ...action,
        id: `cloned-${Date.now()}`,
        panelId: `cloned-panel-${Date.now()}`,
        actions: action.actions ? action.actions.map(a => ({
          ...a,
          id: `cloned-action-${Date.now()}`,
          status: 'pending'
        })) : []
      };
      
      this.addAction(clonedAction);
      return clonedAction;
    }
    
    return null;
  }
}

// Singleton instance
const actionRegistry = new ActionRegistry();

// Global toggle registry to manage expansion state
const toggleRegistry = {
  states: new Map(),
  
  // Set expansion state for a panel
  setExpanded: (panelId, isExpanded) => {
    toggleRegistry.states.set(panelId, isExpanded);
  },
  
  // Get expansion state for a panel
  getExpanded: (panelId) => {
    const state = toggleRegistry.states.get(panelId);
    return state !== undefined ? state : true; // Default to expanded
  },
  
  // Toggle expansion state for a panel
  toggle: (panelId) => {
    const currentState = toggleRegistry.getExpanded(panelId);
    const newState = !currentState;
    toggleRegistry.setExpanded(panelId, newState);
    return newState;
  },
  
  // Clear all states
  clear: () => {
    toggleRegistry.states.clear();
  }
};

export default actionRegistry;
export { toggleRegistry }; 