import React from 'react';
import { useSettings } from './SettingsContext';
import actionRegistry from './ActionRegistry';

const SettingsDialog = ({ points, markers, actionsMap, siteId }) => {
  const { isOpen, action, panelId, actionType, closeSettings, updateAction } = useSettings();

  if (!isOpen || !action) {
    return null;
  }

  console.log('🔄 SettingsDialog: Rendering for actionType:', actionType, 'action:', action);
  console.log('🔄 SettingsDialog: isOpen:', isOpen, 'panelId:', panelId);

  // Get the appropriate settings component based on actionType
  const SettingsComponent = actionRegistry.getSettingsComponent(actionType);
  console.log('🔄 SettingsDialog: SettingsComponent found:', !!SettingsComponent, 'for actionType:', actionType);

  if (!SettingsComponent) {
    console.warn('🔄 SettingsDialog: No settings component found for actionType:', actionType);
    return (
      <div className="settings-panel-container active">
        <div className="settings-header">
          <h3>Settings</h3>
          <button onClick={closeSettings}>×</button>
        </div>
        <div className="settings-content">
          <p>No settings available for {actionType} action.</p>
        </div>
      </div>
    );
  }

  console.log('🔄 SettingsDialog: Rendering SettingsComponent:', SettingsComponent.name);
  return (
    <div className="settings-panel-container active">
      <SettingsComponent
        action={action}
        panelId={panelId}
        points={points}
        markers={markers}
        actionsMap={actionsMap}
        siteId={siteId}
        onClose={closeSettings}
        onSave={updateAction}
      />
    </div>
  );
};

export default SettingsDialog; 