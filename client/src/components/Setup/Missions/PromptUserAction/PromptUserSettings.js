import React, { useState, useEffect } from 'react';
import '../common/ActionSettings.css';
import SettingsField from '../common/SettingsField';
import { createActionFieldConfigs, createFormStructure, updateFormDataFromActionWithJson, transformFormDataToAction } from '../common/SettingsFieldTypes';
import { getAction } from '../utils/actionHelper';

const PromptUserSettings = ({ action, panelId, onClose, onSave }) => {
  const fieldConfigs = createActionFieldConfigs.promptUser();
  const { formData: initialFormData } = createFormStructure(fieldConfigs);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (action) {
      const actionData = getAction(action);
      setFormData(updateFormDataFromActionWithJson(formData, actionData));
    } else {
      setFormData(initialFormData);
    }
  }, [action]);

  const handleInputChange = (field, value, isVariable = false) => {
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
    const base = getAction(action);
    const updatedAction = {
      ...action,
      actions: [{
        ...base,
        ...actionData
      }]
    };
    onSave(updatedAction);
    onClose();
  };

  const handleUndo = (e) => {
    e.preventDefault();
    if (action) {
      const actionData = getAction(action);
      const reset = updateFormDataFromActionWithJson(formData, actionData);
      setFormData(reset);
    } else {
      setFormData(initialFormData);
    }
    onClose();
  };

  const handleRemove = (e) => {
    e.preventDefault();
    onSave(action, true);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h3>Prompt User</h3>
      </div>
      <form className="settings-form">
        <div className="settings-section">
          <div className="settings-fields-grid">
            <SettingsField 
              fieldName="question" 
              label="Question" 
              field={formData.question} 
              onChange={handleInputChange} 
              type="text" 
              placeholder="Enter prompt question..." 
              required={true}
            />
            <SettingsField 
              fieldName="userGroupID" 
              label="User Group ID" 
              field={formData.userGroupID} 
              onChange={handleInputChange} 
              type="text" 
              placeholder="Enter user group ID..." 
              required={true}
            />
            <SettingsField 
              fieldName="timeout" 
              label="Timeout (seconds)" 
              field={formData.timeout} 
              onChange={handleInputChange} 
              type="int" 
              placeholder="Enter timeout in seconds..." 
              min={1}
              required={true}
            />
          </div>
        </div>

        <div className="form-actions-vertical">
          <button type="button" className="validate-button" onClick={handleValidate}>Validate and close</button>
          <button type="button" className="undo-button" onClick={handleUndo}>Undo and close</button>
          <button type="button" className="remove-button" onClick={handleRemove}>Remove action</button>
        </div>
      </form>
    </div>
  );
};

export default PromptUserSettings;
