import React, { useState } from 'react';
import VariablesDialog from './VariablesDialog';
import './SettingsField.css';

/**
 * Common Settings Field Component
 * Renders an input field with "Use Variable" button
 * 
 * @param {Object} props
 * @param {string} props.fieldName - Name of the field
 * @param {string} props.label - Display label
 * @param {string} props.defaultValue - Default value
 * @param {string} props.placeholder - Placeholder text
 * @param {Object} props.field - Field data object with { message, variable, userVariable }
 * @param {Function} props.onChange - Callback function (fieldName, value, isVariable)
 * @param {string} props.type - Field type: 'text', 'int', 'double', 'combobox'
 * @param {number} props.min - Minimum value (for int/double)
 * @param {number} props.max - Maximum value (for int/double)
 * @param {Array} props.options - Options for combobox
 * @param {string} props.helpText - Help text to display below field
 */
const SettingsField = ({
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
  disabled = false
}) => {
  const [showVariablesDialog, setShowVariablesDialog] = useState(false);

  // Handle both old (useVariable) and new (userVariable) field structures
  const isVariable = field.userVariable === 'true' || field.useVariable === true || field.useVariable === 'true';

  // Đảm bảo value luôn là string/number cho input field
  const getInputValue = () => {
    if (!isVariable) {
      // Không tự động chọn option đầu tiên cho combobox
      return field.variable || '';
    } else {
      return '';
    }
  };

  const value = getInputValue();

  const getText = (field) => {
    const usingVariable = field.userVariable === 'true' || field.useVariable === true || field.useVariable === 'true';
    if (!usingVariable) {
      return field.variable || '';
    }

    const { message } = field || {};
    if (!message) return '';

    // If array of message entries
    if (Array.isArray(message)) {
      const current = message.find((m) => m && m.is_current);
      if (current) return current.text || '';
      const first = message[0];
      return (first && first.text) || '';
    }

    // If string, try to parse JSON; could be a JSON array or a JSON string
    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        if (Array.isArray(parsed)) {
          const current = parsed.find((m) => m && m.is_current);
          if (current) return current.text || '';
          const first = parsed[0];
          return (first && first.text) || '';
        }
        // Parsed scalar string
        if (typeof parsed === 'string') return parsed;
      } catch (e) {
        // Plain text (not JSON)
        return message;
      }
    }

    // If object with text
    if (typeof message === 'object' && message !== null) {
      return message.text || '';
    }

    return '';
  }


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
      const doubleValue = parseFloat(newValue);
      if (isNaN(doubleValue)) {
        newValue = '';
      } else if (min !== null && doubleValue < min) {
        newValue = min.toString();
      } else if (max !== null && doubleValue > max) {
        newValue = max.toString();
      }
    }

    onChange(fieldName, newValue, isVariable);
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

  const handleVariableButtonClick = () => {
    setShowVariablesDialog(true);
  };

  const handleVariableSelect = (selectedField, selectedVariable, useVariable) => {
    // Cập nhật trực tiếp field để phản ánh lựa chọn
    if (useVariable) {
      field.userVariable = 'true';
      // Ưu tiên dùng message array được VariablesDialog cập nhật sẵn
      if (selectedField && Array.isArray(selectedField.message)) {
        field.message = selectedField.message;
      } else if (selectedField && typeof selectedField.message === 'string') {
        field.message = selectedField.message;
      } else if (selectedVariable) {
        // Fallback: chỉ có tên biến
        field.message = selectedVariable;
      }
      // Thông báo lên parent: truyền message (array/string) để parent set formData[field].message
      onChange(fieldName, field.message, true);
    } else {
      field.userVariable = 'false';
      // Không dùng variable: giữ nguyên giá trị trực tiếp hiện có
      const directValue = field.variable || '';
      onChange(fieldName, directValue, false);
    }
  };

  const renderInput = () => {


    if (type === 'combobox') {
      const isGrouped = Array.isArray(options) && options.length > 0 && options[0] && Array.isArray(options[0].options);
      return (
        <select
          className="setting-input"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isVariable || disabled}
          style={{ display: isVariable ? 'none' : 'block' }}
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
      const totalSecs = Math.max(0, parseInt(field.variable || '0') || 0);
      const hoursVal = Math.floor(totalSecs / 3600);
      const minutesVal = Math.floor((totalSecs % 3600) / 60);
      const secondsVal = totalSecs % 60;

      const setSeconds = (h, m, s) => {
        const toSeconds = (Math.max(0, parseInt(h) || 0) * 3600)
          + (Math.max(0, parseInt(m) || 0) * 60)
          + (Math.max(0, parseInt(s) || 0));
        onChange(fieldName, String(toSeconds), false);
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
        <div className="setting-time-inputs" style={{ display: isVariable ? 'none' : 'flex', gap: 8, alignItems: 'center' }}>
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
                  onKeyDown={handleKeyDown}
                  className="wait-form-input"
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
                  onKeyDown={handleKeyDown}
                  className="wait-form-input"
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
                  onKeyDown={handleKeyDown}
                  className="wait-form-input"
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
        </div>
      );
    }

    return (
      <input
        type={type === 'int' || type === 'double' ? 'number' : 'text'}
        className="setting-input"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || defaultValue}
        min={min !== null ? min : undefined}
        max={max !== null ? max : undefined}
        step={type === 'double' ? '0.1' : undefined}
        disabled={isVariable || disabled}
        style={{ display: isVariable ? 'none' : 'block' }}
      />
    );
  };

  return (
    <>
      <div className="setting-field">
        <label className="setting-label">{label}:</label>
        <div className="setting-input-container">
          {renderInput()}
          <button
            type="button"
            className={`setting-variable-button ${isVariable ? 'active' : ''}`}
            onClick={handleVariableButtonClick}
            title={isVariable ? 'Switch to direct value' : 'Use variable'}
            disabled={disabled}
          >
            <img
              src="/assets/icons/xyz.png"
              alt="Variable"
              className="setting-variable-icon"
            />
            {isVariable && (
              <span className="setting-variable-text">{getText(field)}</span>
            )}
          </button>
        </div>
        {helpText && (
          <div className="setting-help-text">
            {helpText}
          </div>
        )}
      </div>

      {showVariablesDialog && (
        <VariablesDialog
          field={field}
          fieldName={fieldName}
          onClose={() => setShowVariablesDialog(false)}
          onVariableSelect={handleVariableSelect}
          fieldType={type}
          options={options}
        />
      )}
    </>
  );
};

export default SettingsField;
