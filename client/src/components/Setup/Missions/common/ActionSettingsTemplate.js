import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import SettingsField from './SettingsField';
import { createFormData, updateFormDataFromAction, resetFormData } from './SettingsHelpers';

/**
 * Template component for action settings
 * 
 * @param {Object} props
 * @param {Object} props.action - Action object
 * @param {Function} props.onClose - Close callback
 * @param {string} props.title - Settings dialog title
 * @param {Object} props.fields - Fields configuration object
 * @param {Function} props.onValidate - Custom validation function (optional)
 */
const ActionSettingsTemplate = ({ 
  action, 
  onClose, 
  title, 
  fields, 
  onValidate = null 
}) => {
  const { updateAction } = useSettings();
  const [formData, setFormData] = useState(createFormData(fields));

  useEffect(() => {
    if (action) {
      const actionData = action.actions ? action.actions[0] : action;
      if (actionData) {
        setFormData(updateFormDataFromAction(formData, actionData));
      }
    }
  }, [action]);

  const handleInputChange = (field, value, isVariable = false) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [isVariable ? 'variable' : 'message']: value || '',
        useVariable: isVariable
      }
    }));
  };

  const handleValidate = () => {
    try {
      // Run custom validation if provided
      if (onValidate && !onValidate(formData)) {
        return;
      }

      const updatedAction = {
        ...action,
        actions: [{
          ...action.actions[0],
          ...formData
        }]
      };

      updateAction(action.id, updatedAction);
      onClose();
    } catch (error) {
      console.error('Error updating action:', error);
    }
  };

  const handleUndo = () => {
    if (action) {
      const actionData = action.actions ? action.actions[0] : action;
      if (actionData) {
        setFormData(updateFormDataFromAction(formData, actionData));
      }
    } else {
      setFormData(resetFormData(formData));
    }
  };

  const renderFields = () => {
    return Object.entries(fields).map(([fieldName, config]) => {
      const fieldConfig = typeof config === 'string' ? { defaultValue: config } : config;
      
      return (
        <SettingsField
          key={fieldName}
          fieldName={fieldName}
          label={fieldConfig.label || fieldName}
          defaultValue={fieldConfig.defaultValue || ''}
          placeholder={fieldConfig.placeholder || ''}
          field={formData[fieldName]}
          onChange={handleInputChange}
        />
      );
    });
  };

  return (
    <div className="settings-dialog-overlay">
      <div className="settings-dialog">
        <div className="settings-header">
          <h3>{title}</h3>
          <button className="settings-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          {renderFields()}
        </div>

        <div className="settings-footer">
          <button className="undo-button" onClick={handleUndo}>
            Undo Changes
          </button>
          <div className="settings-button-group">
            <button className="undo-button" onClick={onClose}>
              Cancel
            </button>
            <button className="validate-button" onClick={handleValidate}>
              Validate and Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionSettingsTemplate;
