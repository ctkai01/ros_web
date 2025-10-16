import React, { useState } from 'react';
import './DialogRequestField.css';

/**
 * Dialog Request Field Component
 * Renders input fields for dialog requests with support for various field types
 * Based on SettingsField but simplified for dialog context
 * 
 * @param {Object} props
 * @param {string} props.fieldName - Name of the field
 * @param {string} props.label - Display label
 * @param {string} props.defaultValue - Default value
 * @param {string} props.placeholder - Placeholder text
 * @param {Object} props.field - Field data object
 * @param {Function} props.onChange - Callback function (fieldName, value)
 * @param {string} props.type - Field type: 'text', 'int', 'double', 'combobox', 'time'
 * @param {number} props.min - Minimum value (for int/double)
 * @param {number} props.max - Maximum value (for int/double)
 * @param {Array} props.options - Options for combobox
 * @param {string} props.helpText - Help text to display below field
 * @param {boolean} props.readOnly - Whether field is read-only
 * @param {Function} props.onKeyPress - Callback for key press events
 */
const DialogRequestField = ({
  fieldName,
  label,
  defaultValue,
  placeholder = '',
  field,
  onChange,
  type = 'text',
  min = null,
  max = null,
  options = [],
  helpText = '',
  readOnly = false,
  disabled = false,
  onKeyPress = null,
  error = null // Add error prop
}) => {
  // Get current value - ưu tiên field.value trước, sau đó mới đến defaultValue
  const getInputValue = () => {
    if (field && field.value !== undefined && field.value !== null && field.value !== '') {
      return field.value;
    }
    return defaultValue || '';
  };

  const value = getInputValue();

  const handleInputChange = (e) => {
    let newValue = e.target.value;

    // Validate based on type
    if (type === 'int') {
      const intValue = parseInt(newValue);
      if (isNaN(intValue)) {
        newValue = '';
      } else if (min !== null && intValue < min) {
        newValue = min.toString();
      } else if (max !== null && intValue > max) {
        newValue = max.toString();
      } else {
        newValue = intValue.toString();
      }
    } else if (type === 'double') {
      // Check for comma instead of dot in decimal numbers
      if (newValue.includes(',')) {
        // Replace comma with dot
        newValue = newValue.replace(',', '.');
      }

      const doubleValue = parseFloat(newValue);
      if (isNaN(doubleValue)) {
        newValue = '';
      } else if (min !== null && doubleValue < min) {
        newValue = min.toString();
      } else if (max !== null && doubleValue > max) {
        newValue = max.toString();
      }
    } else if (type === 'time') {
      // For time type, allow decimal values but validate range
      const timeValue = parseFloat(newValue);
      if (isNaN(timeValue)) {
        newValue = '';
      } else if (timeValue < 0) {
        newValue = '0';
      } else if (min !== null && timeValue < min) {
        newValue = min.toString();
      } else if (max !== null && timeValue > max) {
        newValue = max.toString();
      }
    }

    onChange(fieldName, newValue);
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

  const renderInput = () => {

    if (type === 'message') {
      return (
        <div className="dialog-description-message">
          <div className="description-text">
            {value || defaultValue || 'No message available'}
          </div>
        </div>
      );
    }

    if (type === 'combobox') {
      const isGrouped = Array.isArray(options) && options.length > 0 && options[0] && Array.isArray(options[0].options);
      return (
        <select
          className="dialog-input-field"
          value={value}
          onChange={handleInputChange}
          disabled={readOnly || disabled}
          onKeyPress={onKeyPress}
          onKeyDown={handleKeyDown}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {isGrouped
            ? options.map((group, gIndex) => (
              <optgroup key={`g-${gIndex}`} label={group.label}>
                {group.options.map((opt, oIndex) => (
                  <option key={`g-${gIndex}-o-${oIndex}`} value={opt.value || opt}>
                    {opt.label || opt}
                  </option>
                ))}
              </optgroup>
            ))
            : options.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
        </select>
      );
    }

    if (type === 'time') {
      const totalSecs = Math.max(0, parseInt(value || '0') || 0);
      const hoursVal = Math.floor(totalSecs / 3600);
      const minutesVal = Math.floor((totalSecs % 3600) / 60);
      const secondsVal = totalSecs % 60;

      const setSeconds = (h, m, s) => {
        const toSeconds = (Math.max(0, parseInt(h) || 0) * 3600)
          + (Math.max(0, parseInt(m) || 0) * 60)
          + (Math.max(0, parseInt(s) || 0));
        onChange(fieldName, String(toSeconds));
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
        <div className="dialog-time-inputs">
          <div className="time-input-group">
            <div className="time-input">
              <label htmlFor="hours">Hours</label>
              <div className="time-input-with-buttons">
                <button
                  type="button"
                  className="time-up-button"
                  onClick={() => inc('h')}
                  disabled={readOnly || disabled}
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
                  className="dialog-time-input"
                  placeholder="0"
                  disabled={readOnly || disabled}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="time-down-button"
                  onClick={() => dec('h')}
                  disabled={readOnly || disabled}
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
                  disabled={readOnly || disabled}
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
                  className="dialog-time-input"
                  placeholder="0"
                  disabled={readOnly || disabled}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="time-down-button"
                  onClick={() => dec('m')}
                  disabled={readOnly || disabled}
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
                  disabled={readOnly || disabled}
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
                  className="dialog-time-input"
                  placeholder="5"
                  disabled={readOnly || disabled}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="time-down-button"
                  onClick={() => dec('s')}
                  disabled={readOnly || disabled}
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
        type={type === 'int' || type === 'double' || type === 'value' ? 'number' : 'text'}
        className="dialog-input-field"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder || defaultValue}
        min={min !== null ? min : undefined}
        max={max !== null ? max : undefined}
        step={type === 'double' ? '0.1' : undefined}
        disabled={readOnly || disabled}
        readOnly={readOnly || type === 'message'}
        onKeyPress={onKeyPress}
        onKeyDown={handleKeyDown}
      />
    );
  };

  return (
    <div className="dialog-field">
      <label className="dialog-label">{label}:</label>
      <div className="dialog-input-container">
        {renderInput()}
      </div>
      {error && (
        <div className="dialog-error-text">
          {error}
        </div>
      )}
      {helpText && !error && (
        <div className="dialog-help-text">
          {helpText}
        </div>
      )}
    </div>
  );
};

export default DialogRequestField;
