import React from 'react';
import { parseMessageFromJson } from './SettingsFieldTypes';

/**
 * Action Value Display Component
 * Component render chung cho mission-action-subtitle và mission-action-value
 * 
 * @param {Object} props
 * @param {string} props.label - Label hiển thị (subtitle)
 * @param {Object} props.field - Field object với userVariable, variable, message
 * @param {string} props.name - Override name value
 * @param {Object} props.enumMapping - Enum mapping object để map giá trị sang label
 */
const ActionValueDisplay = ({ label, field, name = null, enumMapping = null }) => {
    const useVariable = field.userVariable === 'true';
    let value = field.variable || '';
    if(name){
        value = name;
    }

    let text = '';
    if (useVariable && field.message) {
        const message = parseMessageFromJson(field.message);
        if (message && Array.isArray(message)) {
            message.forEach(msg => {
                if (msg.is_current) {
                    text = msg.text || '';
                }
            });
        }
    }

    // Map giá trị sang label nếu có enumMapping
    const getDisplayValue = (val) => {
        if (enumMapping && enumMapping[val] !== undefined) {
            return enumMapping[val];
        }
        return val;
    };

    const displayValue = useVariable ? text : getDisplayValue(value);

    return (
        <>
            {label && <span className="mission-action-subtitle">{label}:</span>}
            <span
                className="mission-action-value"
                style={{
                    backgroundColor: useVariable ? '#d6d2d6' : 'white'
                }}
            >
                {displayValue}
            </span>
        </>
    );
};

export default ActionValueDisplay;
