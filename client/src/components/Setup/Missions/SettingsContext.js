import React, { createContext, useContext, useState, useCallback } from 'react';
import { variableFromJson, variableToJson, generateActionId, generateNestedPanel, getActionLevel, getActionName } from './utils/actionIdGenerator';
import { getActionId, getActionData, debugAction } from './utils/actionHelper';

// Create Settings Context
const SettingsContext = createContext();

// Settings Provider Component
export const SettingsProvider = ({ children, onActionUpdate, onRemove }) => {
  const [settingsState, setSettingsState] = useState({
    isOpen: false,
    action: null,
    panelId: null,
    actionType: null
  });

  // Open settings dialog
  const openSettings = useCallback((action, panelId, actionType) => {
    setSettingsState({
      isOpen: true,
      action,
      panelId,
      actionType
    });
  }, []);

  // Close settings dialog
  const closeSettings = useCallback(() => {
    // Update isSettingsOpen to false in action data
    if (settingsState.panelId && onActionUpdate) {
      onActionUpdate(settingsState.panelId, { isSettingsOpen: false });
    }
    
    setSettingsState({
      isOpen: false,
      action: null,
      panelId: null,
      actionType: null
    });
  }, [settingsState.panelId, onActionUpdate]);

  // Update action in settings - directly call MissionDetail callback
  const updateAction = useCallback((updatedAction, shouldRemove = false) => {
    console.log('🔄 SettingsContext: updateAction called with:', updatedAction, 'shouldRemove:', shouldRemove);
    console.log('🔄 SettingsContext: Current settingsState:', settingsState);
    console.log('🔄 SettingsContext: Current action:', settingsState.action);
    console.log('🔄 SettingsContext: onActionUpdate callback exists:', !!onActionUpdate);
    
    // Debug the original action structure
    if (settingsState.action) {
      debugAction(settingsState.action, 'SettingsContext - Original Action');
    }
    
    // Use helper functions to get consistent data
    const originalActionId = getActionId(settingsState.action);
    const updatedActionId = getActionId(updatedAction);
    
    console.log('🔄 SettingsContext: Action IDs:', {
      originalActionId,
      updatedActionId,
      settingsStatePanelId: settingsState.panelId
    });
    
    // Determine target panelId and parentId
    let targetPanelId = updatedActionId || originalActionId;
    let parentId = null;
    
    // If the updated action has a parentId, use it
    if (updatedAction.parentId) {
      parentId = updatedAction.parentId;
      console.log('🔄 SettingsContext: Using parentId from updatedAction:', parentId);
    }
    // If the original action has a parentId, use it
    else if (settingsState.action && settingsState.action.parentId) {
      parentId = settingsState.action.parentId;
      console.log('🔄 SettingsContext: Using parentId from original action:', parentId);
    }
    
    if (onActionUpdate) {
      console.log('🔄 SettingsContext: Calling onActionUpdate with:', {
        panelId: targetPanelId,
        updatedAction: updatedAction,
        shouldRemove: shouldRemove,
        parentId: parentId
      });
      
      // Ensure isSettingsOpen is set to false when action is updated
      const updatedActionWithSettingsClosed = {
        ...updatedAction,
        isSettingsOpen: false
      };
      if (shouldRemove) {
        onRemove(targetPanelId);
      } else {
        onActionUpdate(targetPanelId, updatedActionWithSettingsClosed, shouldRemove, parentId);
      }
      console.log('🔄 SettingsContext: onActionUpdate called successfully');
    } else {
      console.warn('🔄 SettingsContext: No onActionUpdate callback provided');
    }
    closeSettings();
  }, [settingsState.panelId, settingsState.action, onActionUpdate, closeSettings]);

  const value = {
    ...settingsState,
    openSettings,
    closeSettings,
    updateAction
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext; 