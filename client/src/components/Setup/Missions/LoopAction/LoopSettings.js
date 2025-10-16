import React, { useState, useEffect } from 'react';
import '../common/ActionSettings.css';
import './LoopSettings.css';
import SettingsField from '../common/SettingsField';
import { createActionFieldConfigs, createFormStructure, updateFormDataFromActionWithJson, transformFormDataToAction } from '../common/SettingsFieldTypes';
import { getAction } from '../utils/actionHelper';

const LoopSettings = ({ action, panelId, onClose, onSave }) => {
  const fieldConfigs = createActionFieldConfigs.loop();
  const { formData: initialFormData, formConfig } = createFormStructure(fieldConfigs);
  const [formData, setFormData] = useState(initialFormData);
  const [loopType, setLoopType] = useState('endless');

  // Set initial form data when component mounts
  useEffect(() => {
    if (action) {
      const actionData = getAction(action);
      const updated = updateFormDataFromActionWithJson(formData, actionData);
      setFormData(updated);
      const it = updated.iterations;
      if (it && (it.userVariable === 'true' || it.useVariable === true || it.useVariable === 'true')) {
        // Nếu đang dùng variable cho iterations, vẫn hiển thị dạng number để người dùng chỉnh/switch
        setLoopType('number');
      } else if (it && (it.variable === '-1' || it.variable === -1)) {
        setLoopType('endless');
      } else {
        setLoopType('number');
      }
    } else {
      setFormData(initialFormData);
      setLoopType('endless');
    }
  }, [action]);

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
      undoAction = {
        ...action.actions[0],
        iterations: action.actions[0].iterations || {
          message: "",
          userVariable: "false",
          variable: "1"
        }
      };
    } else {
      // If action is a direct action object, update it directly
      undoAction = {
        ...action,
        iterations: action.iterations || {
          message: "",
          userVariable: "false",
          variable: "1"
        }
      };
    }
    onSave(undoAction);
    onClose();
  };

  const handleRemove = (e) => {
    e.preventDefault();
    onSave(action, true);
  };

  const handleLoopTypeChange = (e) => {
    const value = e.target.value;
    setLoopType(value);
    setFormData(prev => {
      const next = { ...prev };
      if (value === 'endless') {
        next.iterations = {
          ...prev.iterations,
          message: '',
          userVariable: 'false',
          variable: '-1'
        };
      } else {
        const current = prev.iterations && prev.iterations.variable && prev.iterations.variable !== '-1' ? prev.iterations.variable : '1';
        next.iterations = {
          ...prev.iterations,
          message: '',
          userVariable: 'false',
          variable: String(current)
        };
      }
      return next;
    });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h3>Loop</h3>
      </div>
      <form className="settings-form">
        <div className="settings-section">
          <div className="settings-fields-grid">
            <div className="setting-field">
              <label className="setting-label">Repeat</label>
              <div className="setting-input-container">
                <select className="setting-input" value={loopType} onChange={handleLoopTypeChange}>
                  <option value="endless">Endlessly</option>
                  <option value="number">Number of times</option>
                </select>
              </div>
            </div>

            {loopType === 'number' && (
              <SettingsField
                fieldName="iterations"
                label="Iterations"
                field={formData.iterations}
                onChange={(field, value, isVariable) => {
                  setFormData(prev => ({
                    ...prev,
                    [field]: {
                      ...prev[field],
                      variable: isVariable ? (prev[field].variable || '') : value,
                      message: isVariable ? value : (prev[field].message || ''),
                      userVariable: isVariable ? 'true' : 'false'
                    }
                  }));
                }}
                type="int"
                min={1}
                max={100}
                placeholder="Enter number (1-100)"
              />
            )}
          </div>
        </div>

        {formData.loopType === 'endless' && (
          <div className="form-group">
            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <span>This loop will run endlessly until manually stopped.</span>
            </div>
          </div>
        )}

        {formData.loopType === 'userVariable' && (
          <div className="form-group">
            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <span>This loop will use a user-defined variable for the number of iterations.</span>
            </div>
          </div>
        )}

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

export default LoopSettings; 