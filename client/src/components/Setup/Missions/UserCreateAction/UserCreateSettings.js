import React, { useState, useEffect } from 'react';
import { getAction } from '../utils/actionHelper';
import { createActionFieldConfigs, createFormStructure, updateFormDataFromActionWithJson, transformFormDataToAction } from '../common/SettingsFieldTypes';
import SettingsField from '../common/SettingsField';

const UserCreateSettings = ({ action, panelId, points, actionsMap, siteId, onClose, onSave }) => {
  // Use the new field configs structure
  const fieldConfigs = createActionFieldConfigs.userCreate(actionsMap);
  const { formData: initialFormData, formConfig } = createFormStructure(fieldConfigs);
  const [formData, setFormData] = useState(initialFormData);

  // Initialize form data from action
  useEffect(() => {
    if (action) {
      const actionData = getAction(action);
      if (actionData) {
        const updated = updateFormDataFromActionWithJson(formData, actionData);
        setFormData(updated);
      }
    }
  }, [action]);

  const handleInputChange = (field, value, isVariable) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        variable: isVariable ? (prev[field].variable || '') : value,
        message: isVariable ? value : (prev[field].message || ''),
        userVariable: isVariable ? 'true' : 'false'
      }
    }));
  };

  const handleValidate = (e) => {
    e.preventDefault();
    const actionData = transformFormDataToAction(formData);
    const baseAction = getAction(action);
    const updatedAction = { ...baseAction, ...actionData };
    onSave(updatedAction);
    onClose();
  };

  const handleUndo = (e) => {
    e.preventDefault();
    // Restore original action parameters
    let undoAction;
    if (action.actions && action.actions.length > 0) {
      // If action has actions array, return only the updated action (not the panel)
      undoAction = action.actions[action.actions.length - 1];
    } else {
      undoAction = action;
    }
    setFormData(undoAction);
    onSave(undoAction);
    onClose();  
  };

  const handleRemove = (e) => {
    e.preventDefault();
    onSave(action, true);
    onClose();
  };

  const renderFields = () => {
    return fieldConfigs.map(fieldConfig => {
      const { name, ...config } = fieldConfig;
      return (
        <SettingsField
          key={name}
          fieldName={name}
          field={formData[name]}
          onChange={handleInputChange}
          {...config}
        />
      );
    });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h3>User Action</h3>
      </div>
      <form className="settings-form">
        <div className="settings-section">
          <div className="settings-fields-grid">
            {renderFields()}
          </div>
        </div>

        <div className="form-actions-vertical">
          <button 
            type="button" 
            className="validate-button"
            onClick={handleValidate}
          >
            Validate and close
          </button>
          <button 
            type="button" 
            className="undo-button"
            onClick={handleUndo}
          >
            Undo and close
          </button>
          <button 
            type="button" 
            className="remove-button"
            onClick={handleRemove}
          >
            Remove action
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreateSettings;


