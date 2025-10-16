import React, { useState, useEffect } from 'react';
import CreateVariableDialog from './CreateVariableDialog';
import EditVariableDialog from './EditVariableDialog';
import './VariablesDialog.css';

/**
 * Variables Dialog Component
 * Dialog để chọn variable cho field
 */
const VariablesDialog = ({ 
  field, 
  fieldName, 
  onClose, 
  onVariableSelect,
  fieldType = 'text', // Loại field để truyền cho CreateVariableDialog
  options = []
}) => {
  const [selectedOption, setSelectedOption] = useState('direct');
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); // Global check index
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render
  const [showCreateDialog, setShowCreateDialog] = useState(false); // Hiển thị CreateVariableDialog

  // Hàm xử lý khi thay đổi radio button
  const handleRadioChange = (option, variable = null) => {
    if (option === 'direct') {
      // Thay đổi field object
      field.userVariable = false;
      field.message.forEach(msg => {
        msg.is_current = false;
      });
      setCurrentIndex(0);
    } else if (option === 'variable' && variable) {
      // Thay đổi field object
      field.userVariable = true;
      field.variable = variable.name;
      field.message.forEach(msg => {
        msg.is_current = false;
      });
      field.message[variable.index].is_current = true;
      setCurrentIndex(variable.index + 1);
    }
    // force re-render
    setSelectedOption(option);
    setSelectedVariable(variable);
    setForceUpdate(prev => prev + 1); // Force re-render
  };

  // Lấy danh sách variables từ field.message (đã là array sau khi parse)
  const getAvailableVariables = () => {
    const variables = [];
    
    // Kiểm tra field.message có tồn tại và không rỗng
    if (!field.message || field.message === '') {
      // Khởi tạo field.message thành array rỗng nếu không có
      field.message = [];
      return variables;
    }
    
    if (Array.isArray(field.message)) {
      field.message.forEach((msg, index) => {
        if (msg && typeof msg === 'object') {
          const variable = {
            name: msg.text || `Variable ${index + 1}`,
            description: msg.description || '',
            index: index,
            isCurrent: msg.is_current || false
          };
          variables.push(variable);
        }
      });
    } else {
      console.error('field.message is not array:', typeof field.message);
      // Khởi tạo field.message thành array rỗng nếu không phải array
      field.message = [];
    }
    
    return variables;
  };

  const availableVariables = getAvailableVariables();

  useEffect(() => {
    // Chỉ khởi tạo state lần đầu, không override khi user đã chọn
    if (currentIndex === 0 && selectedOption === 'direct') {
      // Tạo global check index dựa trên field
      let globalCheckIndex = 0; // Mặc định là "Don't use variables"
      
      if (field.userVariable === 'true') {
        // Tìm variable có is_current = true
        const currentVariable = availableVariables.find(v => v.isCurrent === true);
        if (currentVariable) {
          globalCheckIndex = currentVariable.index + 1; // +1 vì index 0 là "Don't use variables"
          setSelectedOption('variable');
          setSelectedVariable(currentVariable);
        }
      } else {
        globalCheckIndex = 0; // "Don't use variables"
        setSelectedOption('direct');
        setSelectedVariable(null);
      }
      
      // Set global check index
      setCurrentIndex(globalCheckIndex);
    }
  }, [field, availableVariables]);

  const handleCreateVariable = () => {
    setShowCreateDialog(true);
  };

  const handleVariableCreate = (newVariable) => {
    // enable user variable
    field.userVariable = true;

    // Đảm bảo field.message là array
    if (!field.message || !Array.isArray(field.message)) {
      field.message = [];
    }

    // reset all variables
    field.message.forEach(msg => {
      msg.is_current = false;
    });
    
    // Thêm variable mới vào field.message
    field.message.push(newVariable);

    setCurrentIndex(field.message.length);
    // force re-render
    setSelectedOption('variable');
    setSelectedVariable(newVariable);
    // Force re-render để cập nhật danh sách variables
    setForceUpdate(prev => prev + 1);
  };

  const handleEditVariable = (variable) => {
    setSelectedVariable(variable);
    setEditText(variable.name);
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const handleSaveEdit = (updatedVariable) => {
    try {
      // Đảm bảo field.message là array
      if (!field.message || !Array.isArray(field.message)) {
        field.message = [];
        return;
      }
      
      const idx = field.message.findIndex((m, i) => i === selectedVariable.index);
      if (idx !== -1) {
        field.message[idx] = {
          ...field.message[idx],
          text: updatedVariable.text,
          value: updatedVariable.value
        };
      }
      setIsEditing(false);
      setShowEditDialog(false);
      setForceUpdate(prev => prev + 1);
    } catch (e) {
      console.error('Failed to save edited variable', e);
    }
  };

  const handleOK = () => {
    // Trả về toàn bộ field đã được cập nhật trạng thái (userVariable, message, variable...)
    if (selectedOption === 'variable' && selectedVariable) {
      onVariableSelect(field, selectedVariable.name, true);

      console.log("handleOK field", field);
    } else {
      onVariableSelect(field, '', false);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      <div className="variables-dialog-overlay">
        <div className="variables-dialog">
          <div className="variables-header">
            <h3>Variables</h3>
            <button
              type="button"
              className="variables-create-button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCreateVariable(); }}
            >
              Create variable
            </button>
          </div>
          
          <div className="variables-content">
            <div className="variables-explanation">
              All actions that require the user to specify something, for example a position, 
              a number of retries, a distance or a subject text, have the option to define a 
              variable typically in the form of a question. The question pops up on the operator's 
              user interface every time the mission is queued and the user must select an answer 
              before the mission can begin.
            </div>
            
            <div className="variables-options">
              <div className="variable-option">
                <input
                  type="radio"
                  id="direct-value"
                  name="variable-option"
                  checked={currentIndex === 0}
                  onChange={() => handleRadioChange('direct')}
                />
                <label htmlFor="direct-value">Don't use variables for this field.</label>
              </div>
              
              {availableVariables.map((variable, index) => (
                <div key={index} className="variable-option">
                  <input
                    type="radio"
                    id={`variable-${index}`}
                    name="variable-option"
                    checked={currentIndex === variable.index + 1}
                    onChange={() => handleRadioChange('variable', variable)}
                  />
                  <label htmlFor={`variable-${index}`}>
                    {variable.name}
                  </label>
                  <button 
                    type="button"
                    className="variable-edit-button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditVariable(variable); }}
                    title="Edit variable"
                  >
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="variables-footer">
            <button type="button" className="variables-ok-button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOK(); }}>
              OK
            </button>
            <button type="button" className="variables-cancel-button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancel(); }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showCreateDialog && (
        <CreateVariableDialog
          onClose={() => setShowCreateDialog(false)}
          onVariableCreate={handleVariableCreate}
          fieldType={fieldType}
          options={options}
        />
      )}

      {showEditDialog && selectedVariable && (
        <EditVariableDialog
          onClose={() => { setIsEditing(false); setShowEditDialog(false); }}
          onVariableUpdate={handleSaveEdit}
          fieldType={fieldType}
          options={options}
          variable={{
            text: selectedVariable.name,
            value: (Array.isArray(field.message) && field.message[selectedVariable.index]?.value) || ''
          }}
        />
      )}
    </>
  );
};

export default VariablesDialog;
