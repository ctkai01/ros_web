/**
 * Helper functions for action settings
 */

/**
 * Create a field data structure
 * @param {string} defaultValue - Default value
 * @param {boolean} useVariable - Whether to use variable mode
 * @returns {Object} Field data structure
 */
export const createField = (defaultValue = '', useVariable = false) => ({
  message: '',
  userVariable: useVariable ? 'true' : 'false',
  variable: defaultValue
});

/**
 * Create form data structure for an action
 * @param {Object} fields - Object with field names as keys and default values as values
 * @returns {Object} Form data structure
 */
export const createFormData = (fields) => {
  const formData = {};
  Object.entries(fields).forEach(([fieldName, defaultValue]) => {
    formData[fieldName] = createField(defaultValue);
  });
  return formData;
};

/**
 * Update form data from action data
 * @param {Object} formData - Current form data
 * @param {Object} actionData - Action data to merge
 * @returns {Object} Updated form data
 */
export const updateFormDataFromAction = (formData, actionData) => {
  const updatedFormData = { ...formData };
  
  Object.keys(formData).forEach(fieldName => {
    if (actionData[fieldName]) {
      const field = actionData[fieldName];
      // Handle both old (useVariable) and new (userVariable) field structures
      const isVariable = field.userVariable === 'true' || field.useVariable === true || field.useVariable === 'true';
      
      updatedFormData[fieldName] = {
        message: field.message || '',
        userVariable: isVariable ? 'true' : 'false',
        variable: field.variable || formData[fieldName].variable
      };
    }
  });
  
  return updatedFormData;
};

/**
 * Reset form data to default values
 * @param {Object} formData - Current form data
 * @param {Object} actionData - Action data to reset to (optional)
 * @returns {Object} Reset form data
 */
export const resetFormData = (formData, actionData = null) => {
  if (actionData) {
    return updateFormDataFromAction(formData, actionData);
  }
  
  // Reset to default values
  const resetFormData = {};
  Object.keys(formData).forEach(fieldName => {
    resetFormData[fieldName] = {
      message: '',
      userVariable: 'false',
      variable: formData[fieldName].variable // Keep the default variable value
    };
  });
  
  return resetFormData;
};


