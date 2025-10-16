import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import SettingsField from '../common/SettingsField';
import { createActionFieldConfigs, createFormStructure, updateFormDataFromActionWithJson, transformFormDataToAction } from '../common/SettingsFieldTypes';
import { resetFormData } from '../common/SettingsHelpers';
import { getAction } from '../utils/actionHelper';
import '../common/ActionSettings.css';
import './WaitSettings.css';

const WaitSettings = ({ action, onClose, onSave }) => {
  const { updateAction } = useSettings();
  
  // Sử dụng cấu trúc field configs có sẵn
  const fieldConfigs = createActionFieldConfigs.wait();
  const { formData: initialFormData, formConfig } = createFormStructure(fieldConfigs);
  
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (action) {
      const actionData = getAction(action);
      console.log("actionData", actionData);
      if (actionData) {
        // Sử dụng function parse JSON mới
        setFormData(updateFormDataFromActionWithJson(formData, actionData));
      }
    } else {
      // Set default values when no action is provided
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

  const handleValidate = () => {
    try {
      // Transform form data to action data với JSON
      const actionData = transformFormDataToAction(formData);
      console.log("actionData", actionData);
      
      // Lấy action hiện tại
      const currentAction = getAction(action);
      
      const updatedAction = {
        ...action,
        actions: [{
          ...currentAction, // Giữ nguyên tất cả properties của action hiện tại
          ...actionData     // Chỉ update các field data
        }]
      };

      console.log("updatedAction", updatedAction);
      onSave(updatedAction);
      onClose();
    } catch (error) {
      console.error('Error updating Wait action:', error);
    }
  };

  const handleUndo = () => {
    // Reset form data to original values
    if (action) {
      const actionData = getAction(action);
      if (actionData) {
        const actionDataWithJson = updateFormDataFromActionWithJson(formData, actionData);
        console.log("actionDataWithJson", actionDataWithJson);
        setFormData(actionDataWithJson);
      }
    } else {
      // Reset to default values if no action
      setFormData(resetFormData(formData));
    }
    onClose();
  };

  const handleRemove = () => {
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
                <h3>Wait</h3>
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

export default WaitSettings; 