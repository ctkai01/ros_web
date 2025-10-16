import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import SettingsField from '../common/SettingsField';
import { createActionFieldConfigs, createFormStructure, updateFormDataFromActionWithJson, transformFormDataToAction } from '../common/SettingsFieldTypes';
import { resetFormData } from '../common/SettingsHelpers';
import { getAction } from '../utils/actionHelper';
import '../common/ActionSettings.css';

const SwitchMapSettings = ({ action, onClose, points, onSave }) => {
  const { updateAction } = useSettings();
  
  // Sử dụng cấu trúc field configs có sẵn - giống MoveAction
  const fieldConfigs = createActionFieldConfigs.switchMap(points);
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

  function findPointNameById_Functional(data, targetId) {
    // 1. Dùng flatMap để "làm phẳng" cấu trúc, tạo ra một mảng duy nhất chứa tất cả các 'point'
    const allPoints = data.flatMap(map => map.points);
    
    // 2. Dùng 'find' để tìm đối tượng 'point' đầu tiên có ID khớp
    const foundPoint = allPoints.find(point => point.ID === targetId);
    
    // 3. Nếu tìm thấy đối tượng, trả về 'PointName', nếu không thì trả về null
    return foundPoint ? foundPoint.PointName : null;
  }

  const handleValidate = () => {
    try {
      // Transform form data to action data với JSON
      const actionData = transformFormDataToAction(formData);
      
      // Lấy action hiện tại
      const currentAction = getAction(action);
      let positionName; // Name of the position to switch to

      if(getAction(actionData).position.userVariable =='false') {
        positionName = findPointNameById_Functional(points, parseInt(getAction(actionData).position.variable));
      } else {
        positionName = '';
      }
      
      const updatedAction = {
        ...action,
        actions: [{
          ...currentAction, // Giữ nguyên tất cả properties của action hiện tại
          ...actionData,     // Chỉ update các field data
          positionName: positionName
        }]
      };

      console.log("updatedAction", updatedAction);
      onSave(updatedAction);
      onClose();
    } catch (error) {
      console.error('Error updating SwitchMap action:', error);
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
      // Reset to initial form data
      setFormData(initialFormData);
    }
  };

  const handleRemove = () => {
    onSave(action, true);
    onClose();
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h3>Switch Map</h3>
      </div>
      <form className="settings-form">
        <div className="settings-section">
          <div className="settings-fields-grid">
            {fieldConfigs.map(fieldConfig => {
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
            })}
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

export default SwitchMapSettings;
