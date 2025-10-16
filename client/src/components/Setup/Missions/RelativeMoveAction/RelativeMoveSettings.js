import React, { useState, useEffect } from 'react';
import '../common/ActionSettings.css';
import SettingsField from '../common/SettingsField';
import { createActionFieldConfigs, createFormStructure, updateFormDataFromActionWithJson, transformFormDataToAction } from '../common/SettingsFieldTypes';
import { getAction } from '../utils/actionHelper';

const RelativeMoveSettings = ({ action, panelId, onClose, onSave }) => {
  const fieldConfigs = createActionFieldConfigs.relativeMove();
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
        <h3>Relative Move</h3>
      </div>
      <form className="settings-form">
        <div className="settings-section">
          <div className="settings-fields-grid">
            <SettingsField fieldName="x" label="X (in meters)" field={formData.x} onChange={handleInputChange} type="double" placeholder="Enter X coordinate" />
            <SettingsField fieldName="y" label="Y (in meters)" field={formData.y} onChange={handleInputChange} type="double" placeholder="Enter Y coordinate" />
            <SettingsField fieldName="orientation" label="Orientation (in degrees)" field={formData.orientation} onChange={handleInputChange} type="double" min={-360} max={360} placeholder="Enter orientation (degrees)" />
            <SettingsField fieldName="collisionDetection" label="Collision Detection" field={formData.collisionDetection} onChange={handleInputChange} type="combobox" options={[{value:'true',label:'Enabled'},{value:'false',label:'Disabled'}]} />
            <SettingsField fieldName="maxAngularSpeed" label="Max Angular Speed (rad/s)" field={formData.maxAngularSpeed} onChange={handleInputChange} type="double" min={0} placeholder="Enter max angular speed" />
            <SettingsField fieldName="maxLinearSpeed" label="Max Linear Speed (m/s)" field={formData.maxLinearSpeed} onChange={handleInputChange} type="double" min={0} placeholder="Enter max linear speed" />
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

export default RelativeMoveSettings;