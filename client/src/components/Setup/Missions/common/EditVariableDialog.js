import React, { useState, useEffect } from 'react';
import './CreateVariableDialog.css';

/**
 * Edit Variable Dialog Component
 * Dialog để chỉnh sửa variable hiện có
 */
const EditVariableDialog = ({
  onClose,
  onVariableUpdate,
  fieldType = 'text',
  options = [],
  variable // { text, value, is_current }
}) => {
  const [variableName, setVariableName] = useState(variable?.text || '');
  const [defaultValue, setDefaultValue] = useState(variable?.value || '');

  useEffect(() => {
    // Sync when variable changes
    setVariableName(variable?.text || '');
    setDefaultValue(variable?.value || '');
  }, [variable]);

  const defaultOptions = Array.isArray(options) ? options : [];

  const handleOK = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variableName.trim()) return;

    const updatedVariable = {
      ...variable,
      text: variableName.trim(),
      value: defaultValue
    };

    onVariableUpdate(updatedVariable);
    onClose();
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleKeyDown = (e) => {
    // Prevent Enter key from submitting form and refreshing page
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // On mobile, blur the input to hide virtual keyboard
      if (e.target && typeof e.target.blur === 'function') {
        e.target.blur();
      }
    }
  };

  const renderDefaultValueField = () => {
    if (fieldType === 'combobox') {
      const isGrouped = Array.isArray(defaultOptions) && defaultOptions.length > 0 && Array.isArray(defaultOptions[0]?.options);
      return (
        <select
          className="create-variable-input"
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          onKeyDown={handleKeyDown}
        >
          <option value="">Select default value</option>
          {isGrouped
            ? defaultOptions.map((group, gIndex) => (
                <optgroup key={`eg-${gIndex}`} label={group.label}>
                  {(group.options || []).map((opt, oIndex) => (
                    <option key={`eg-${gIndex}-o-${oIndex}`} value={opt.value || opt}>
                      {opt.label || opt}
                    </option>
                  ))}
                </optgroup>
              ))
            : defaultOptions.map((option, index) => (
                <option key={index} value={option.value || option}>
                  {option.label || option}
                </option>
              ))}
        </select>
      );
    }

    if (fieldType === 'time') {
      const totalSecs = Math.max(0, parseInt(defaultValue || '0') || 0);
      const hoursVal = Math.floor(totalSecs / 3600);
      const minutesVal = Math.floor((totalSecs % 3600) / 60);
      const secondsVal = totalSecs % 60;

      const setSeconds = (h, m, s) => {
        const toSeconds = (Math.max(0, parseInt(h) || 0) * 3600)
          + (Math.max(0, parseInt(m) || 0) * 60)
          + (Math.max(0, parseInt(s) || 0));
        setDefaultValue(String(toSeconds));
      };

      const inc = (part) => {
        if (part === 'h') setSeconds(hoursVal + 1, minutesVal, secondsVal);
        if (part === 'm') setSeconds(hoursVal, (minutesVal + 1) % 60, secondsVal);
        if (part === 's') setSeconds(hoursVal, minutesVal, (secondsVal + 1) % 60);
      };

      const dec = (part) => {
        if (part === 'h') setSeconds(Math.max(0, hoursVal - 1), minutesVal, secondsVal);
        if (part === 'm') setSeconds(hoursVal, minutesVal === 0 ? 59 : minutesVal - 1, secondsVal);
        if (part === 's') setSeconds(hoursVal, minutesVal, secondsVal === 0 ? 59 : secondsVal - 1);
      };

      const onPartChange = (part, val) => {
        const v = Math.max(0, parseInt(val) || 0);
        if (part === 'h') setSeconds(v, minutesVal, secondsVal);
        if (part === 'm') setSeconds(hoursVal, Math.min(59, v), secondsVal);
        if (part === 's') setSeconds(hoursVal, minutesVal, Math.min(59, v));
      };

      return (
        <div className="create-variable-time-inputs">
          <div className="time-input-group">
            <div className="time-input">
              <label htmlFor="hours">Hours</label>
              <div className="time-input-with-buttons">
                <button
                  type="button"
                  className="time-up-button"
                  onClick={() => inc('h')}
                >
                  ▲
                </button>
                <input
                  type="number"
                  id="hours"
                  min="0"
                  max="99"
                  value={hoursVal}
                  onChange={(e) => onPartChange('h', e.target.value)}
                  className="create-variable-time-input"
                  placeholder="0"
                />
                <button
                  type="button"
                  className="time-down-button"
                  onClick={() => dec('h')}
                >
                  ▼
                </button>
              </div>
            </div>
            <div className="time-separator">:</div>
            <div className="time-input">
              <label htmlFor="minutes">Minutes</label>
              <div className="time-input-with-buttons">
                <button
                  type="button"
                  className="time-up-button"
                  onClick={() => inc('m')}
                >
                  ▲
                </button>
                <input
                  type="number"
                  id="minutes"
                  min="0"
                  max="59"
                  value={minutesVal}
                  onChange={(e) => onPartChange('m', e.target.value)}
                  className="create-variable-time-input"
                  placeholder="0"
                />
                <button
                  type="button"
                  className="time-down-button"
                  onClick={() => dec('m')}
                >
                  ▼
                </button>
              </div>
            </div>
            <div className="time-separator">:</div>
            <div className="time-input">
              <label htmlFor="seconds">Seconds</label>
              <div className="time-input-with-buttons">
                <button
                  type="button"
                  className="time-up-button"
                  onClick={() => inc('s')}
                >
                  ▲
                </button>
                <input
                  type="number"
                  id="seconds"
                  min="0"
                  max="59"
                  value={secondsVal}
                  onChange={(e) => onPartChange('s', e.target.value)}
                  className="create-variable-time-input"
                  placeholder="5"
                />
                <button
                  type="button"
                  className="time-down-button"
                  onClick={() => dec('s')}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          <div className="time-display">
            Total: {hoursVal.toString().padStart(2, '0')}:{minutesVal.toString().padStart(2, '0')}:{secondsVal.toString().padStart(2, '0')} 
            ({totalSecs} seconds)
          </div>
        </div>
      );
    }

    return (
      <input
        type={fieldType === 'int' || fieldType === 'double' || fieldType === 'time' ? 'number' : 'text'}
        className="create-variable-input"
        value={defaultValue}
        onChange={(e) => setDefaultValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={fieldType === 'int' ? 'Enter number' : 'Enter default value'}
        step={fieldType === 'double' || fieldType === 'time' ? '0.1' : undefined}
      />
    );
  };

  return (
    <div className="create-variable-dialog-overlay">
      <div className="create-variable-dialog">
        <div className="create-variable-header">
          <div className="create-variable-title">
            <span className="create-variable-icon"></span>
            <h3>Edit variable</h3>
          </div>
        </div>

        <div className="create-variable-content">
          <div className="create-variable-fields">
            <div className="create-variable-field">
              <label className="create-variable-label">Variable name</label>
              <input
                type="text"
                className="create-variable-input"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Variable name"
              />
            </div>

            <div className="create-variable-field">
              <label className="create-variable-label">Default value</label>
              {renderDefaultValueField()}
            </div>
          </div>
        </div>

        <div className="create-variable-footer">
          <button type="button" className="create-variable-ok-button" onClick={handleOK}>
            OK
          </button>
          <button type="button" className="create-variable-cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVariableDialog;


