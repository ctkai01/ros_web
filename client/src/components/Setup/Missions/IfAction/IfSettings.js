import React, { useState, useEffect } from 'react';
import '../common/ActionSettings.css';
import { createActionFieldConfigs, createFormStructure, updateFormDataFromActionWithJson, transformFormDataToAction } from '../common/SettingsFieldTypes';
import { getAction } from '../utils/actionHelper';
import SettingsField from '../common/SettingsField';


const IfSettings = ({ action, panelId, onClose, onSave }) => {
  const [fieldConfigs, setFieldConfigs] = useState(createActionFieldConfigs.if());
  const { formData: initialFormData, formConfig } = createFormStructure(fieldConfigs);
  const [formData, setFormData] = useState(initialFormData);
//set initial form data
useEffect(() => {
  if (action) {
    const actionData = getAction(action);
    const updated = updateFormDataFromActionWithJson(formData, actionData);
    setFormData(updated);
    
    // Cập nhật fieldConfigs dựa trên compare value từ action
    const compareValue = updated.compare?.variable || updated.compare?.message || '0';
    updateFieldConfigsForCompare(compareValue);
  }
}, [action]);

  const handleValidate = (e) => {
    e.preventDefault();
    const actionData = transformFormDataToAction(formData);
    console.log('🔍 SERVER DEBUG - actionData:', actionData);
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

  const handleInputChange = (field, value, isVariable) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: {
          ...prev[field],
          variable: isVariable ? (prev[field].variable || '') : value,
          message: isVariable ? value : (prev[field].message || ''),
          userVariable: isVariable ? 'true' : 'false'
        }
      };

      // Nếu field compare thay đổi, cập nhật fieldConfigs
      if (field === 'compare') {
        const compareValue = isVariable ? value : value;
        // Cập nhật fieldConfigs với compare value mới
        setTimeout(() => {
          updateFieldConfigsForCompare(compareValue);
        }, 0);
      }

      return newFormData;
    });
  };

  const updateFieldConfigsForCompare = (compareValue) => {
    // Tạo field configs mới dựa trên compare value
    const newFieldConfigs = createActionFieldConfigs.if(compareValue);
    setFieldConfigs(newFieldConfigs);
  };

  const renderFields = () => {
    // Lấy giá trị của field compare để kiểm tra
    const compareValue = formData.compare?.variable || formData.compare?.message || '0';
    const shouldDisableIndex = compareValue === '0' || compareValue === '2';

    return fieldConfigs.map(fieldConfig => {
      const { name, ...config } = fieldConfig;
      
      // Nếu là field index và compare là 0 hoặc 2, thì disable
      if (name === 'index' && shouldDisableIndex) {
        return (
          <SettingsField
            key={name}
            fieldName={name}
            field={formData[name]}
            onChange={handleInputChange}
            {...config}
            disabled={true}
          />
        );
      }
      
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
        <h3>If</h3>
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

export default IfSettings;


