/**
 * SettingsField Types and Structures
 * Định nghĩa các kiểu dữ liệu và cấu trúc cho SettingsField
 */

/**
 * Field Types Enum
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  INT: 'int',
  DOUBLE: 'double',
  COMBOBOX: 'combobox',
  TIME: 'time'
};

/**
 * Parse message from JSON string
 * Parse message từ JSON string để lấy toàn bộ array
 */
export const parseMessageFromJson = (messageJson) => {
  try {
    if (!messageJson || typeof messageJson !== 'string') {
      return null;
    }
    
    const parsed = JSON.parse(messageJson);
    if (Array.isArray(parsed)) {
      // Trả về toàn bộ array thay vì chỉ một phần tử
      return parsed;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing message JSON:', error);
    return null;
  }
};

/**
 * Create message JSON string for variable
 * Tạo JSON string cho message khi userVariable = true
 */
export const createVariableMessageJson = (text) => {
    if(text === ''){
        return '';
    }
    const message = JSON.stringify(text);
    console.log("message", message);

  
  return message;
};

/**
 * Create message JSON string for direct value
 * Tạo JSON string cho message khi userVariable = false
 */
export const createDirectMessageJson = (text, value, isCurrent = true) => {
  const messageData = {
    is_current: isCurrent,
    text: text || '',
    value: value || ''
  };
  
  return JSON.stringify([messageData]);
};

/**
 * Field Data Structure
 * Cấu trúc dữ liệu chuẩn cho một field
 */
export const createFieldData = (defaultValue = '', useVariable = false) => ({
  message: '',
  userVariable: useVariable ? 'true' : 'false',
  variable: defaultValue
});

/**
 * Field Configuration Structure
 * Cấu trúc cấu hình cho một field
 */
export const createFieldConfig = ({
  name,
  label,
  type = FIELD_TYPES.TEXT,
  defaultValue = '',
  placeholder = '',
  min = null,
  max = null,
  options = [],
  helpText = '',
  required = false,
  validation = null
}) => ({
  name,
  label,
  type,
  defaultValue,
  placeholder,
  min,
  max,
  options,
  helpText,
  required,
  validation
});

/**
 * Form Data Structure
 * Cấu trúc dữ liệu cho toàn bộ form
 */
export const createFormStructure = (fieldsConfig) => {
  const formData = {};
  const formConfig = {};
  
  fieldsConfig.forEach(fieldConfig => {
    const { name, ...config } = fieldConfig;
    formData[name] = createFieldData(config.defaultValue);
    formConfig[name] = config;
  });
  
  return { formData, formConfig };
};

/**
 * Update form data from action data with JSON parsing
 * Cập nhật form data từ action data với parse JSON
 */
export const updateFormDataFromActionWithJson = (formData, actionData) => {
  const updatedFormData = { ...formData };
  
  Object.keys(formData).forEach(fieldName => {
    if (actionData[fieldName]) {
      const field = actionData[fieldName];
      const isVariable = field.userVariable === 'true' || field.useVariable === true || field.useVariable === 'true';
      let parsedMessage = '';
     if(isVariable){
        parsedMessage = parseMessageFromJson(field.message);
        console.log("parsedMessage", parsedMessage);
     }else{
        parsedMessage = field.message;
     }
      
      updatedFormData[fieldName] = {
        message: parsedMessage,
        userVariable: isVariable ? 'true' : 'false',
        variable: field.variable || formData[fieldName].variable
      };
    }
  });
  
  return updatedFormData;
};

/**
 * Transform form data to action data with JSON creation
 * Chuyển đổi form data thành action data với tạo JSON
 */
export const transformFormDataToAction = (formData) => {
  const actionData = {};
  
  console.log("formData", formData);
  Object.keys(formData).forEach(fieldName => {
    const field = formData[fieldName];
    const isVariable = field.userVariable === 'true';
    console.log("transformFormDataToAction field", field);
    
    if (isVariable) {
      console.log("isVariable", isVariable);
      // Nếu là variable, tạo message JSON với text hiển thị cạnh xyz
      const messageJson = createVariableMessageJson(field.message);
      actionData[fieldName] = {
        message: messageJson,
        userVariable: 'true',
        variable: field.variable
      };
      console.log("actionData variable", actionData[fieldName]);
    } else {
      // Nếu không phải variable, tạo JSON message cho direct value
      const messageJson = createDirectMessageJson('', field.variable, false);
      actionData[fieldName] = {
        message: messageJson,
        userVariable: 'false',
        variable: field.variable
      };

      console.log("actionData no variable", actionData[fieldName]);
    }
  });
  console.log("actionData no variable", actionData);

  return actionData;
};

/**
 * Validation Functions
 */
export const VALIDATION_FUNCTIONS = {
  // Validate integer
  validateInt: (value, min = null, max = null) => {
    const intValue = parseInt(value);
    if (isNaN(intValue)) return false;
    if (min !== null && intValue < min) return false;
    if (max !== null && intValue > max) return false;
    return true;
  },
  
  // Validate double
  validateDouble: (value, min = null, max = null) => {
    const doubleValue = parseFloat(value);
    if (isNaN(doubleValue)) return false;
    if (min !== null && doubleValue < min) return false;
    if (max !== null && doubleValue > max) return false;
    return true;
  },
  
  // Validate required
  validateRequired: (value) => {
    return value !== null && value !== undefined && value !== '';
  }
};

/**
 * Predefined Field Configurations
 * Các cấu hình field có sẵn để tái sử dụng
 */
export const PREDEFINED_FIELDS = {
  POSITION: createFieldConfig({
    name: 'position',
    label: 'Position',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select position',
    options: [],
    helpText: ''
  }),
  
  MAP: createFieldConfig({
    name: 'map',
    label: 'Map',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select map',
    options: [],
    helpText: ''
  }),
  // Position fields
  X_COORDINATE: createFieldConfig({
    name: 'x',
    label: 'X (in meters)',
    type: FIELD_TYPES.DOUBLE,
    defaultValue: '0',
    placeholder: 'Enter X coordinate',
    helpText: ''
  }),
  
  Y_COORDINATE: createFieldConfig({
    name: 'y',
    label: 'Y (in meters)',
    type: FIELD_TYPES.DOUBLE,
    defaultValue: '0',
    placeholder: 'Enter Y coordinate',
    helpText: ''
  }),
  
  ORIENTATION: createFieldConfig({
    name: 'orientation',
    label: 'Orientation (in degrees)',
    type: FIELD_TYPES.DOUBLE,
    defaultValue: '0',
    placeholder: 'Enter orientation (degrees)',
    min: -360,
    max: 360,
    helpText: ''
  }),
  
  // Movement parameters
  SPEED: createFieldConfig({
    name: 'speed',
    label: 'Speed (in m/s)',
    type: FIELD_TYPES.DOUBLE,
    defaultValue: '1.0',
    placeholder: 'Enter speed',
    min: 0.1,
    helpText: 'Speed in m/s (minimum 0.1)'
  }),
  COLLISION_DETECTION: createFieldConfig({
    name: 'collisionDetection',
    label: 'Collision Detection',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: 'true',
    placeholder: 'Select',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' }
    ],
    helpText: ''
  }),
  MAX_ANGULAR_SPEED: createFieldConfig({
    name: 'maxAngularSpeed',
    label: 'Max Angular Speed (rad/s)',
    type: FIELD_TYPES.DOUBLE,
    defaultValue: '0.6',
    placeholder: 'Enter max angular speed',
    min: 0,
    helpText: ''
  }),
  MAX_LINEAR_SPEED: createFieldConfig({
    name: 'maxLinearSpeed',
    label: 'Max Linear Speed (m/s)',
    type: FIELD_TYPES.DOUBLE,
    defaultValue: '0.3',
    placeholder: 'Enter max linear speed',
    min: 0,
    helpText: ''
  }),
  
  RETRIES: createFieldConfig({
    name: 'retries',
    label: 'Retries',
    type: FIELD_TYPES.INT,
    defaultValue: '10',
    placeholder: 'Number of retry attempts',
    min: 1,
    max: 100,
    helpText: ''
  }),
  
  DISTANCE_THRESHOLD: createFieldConfig({
    name: 'distance_threshold',
    label: 'Distance Threshold (in meters)',
    type: FIELD_TYPES.DOUBLE,
    defaultValue: '0.1',
    placeholder: 'Distance threshold (meters, min: 0.1)',
    min: 0.1,
    max: 2,
    helpText: 'Distance threshold in meters (minimum 0.1)'
  }),
  
  // Direction combobox
  DIRECTION: createFieldConfig({
    name: 'direction',
    label: 'Direction',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: 'forward',
    placeholder: 'Select direction',
    options: [
      { value: 'forward', label: 'Forward' },
      { value: 'backward', label: 'Backward' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' }
    ],
    helpText: 'Movement direction'
  }),

  COMPARE: createFieldConfig({
    name: 'compare',
    label: 'Compare',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select',
    options: [
      { value: '0', label: 'Battery Percentage' },
      { value: '1', label: 'I/O Input' },
      { value: '2', label: 'Pending Mission' },
      { value: '3', label: 'PLC Register' },
    ],
    helpText: 'Compare input'
  }),

  // I/O Index for I/O Input/Output (X1-X23, Y0-Y15)
  INDEX_IO: createFieldConfig({
    name: 'index',
    label: 'Index',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: 'X1',
    placeholder: 'Select I/O Index',
    options: [
      // I/O Input options (X1 to X23)
      { value: 'X1', label: 'X1' },
      { value: 'X2', label: 'X2' },
      { value: 'X3', label: 'X3' },
      { value: 'X4', label: 'X4' },
      { value: 'X5', label: 'X5' },
      { value: 'X6', label: 'X6' },
      { value: 'X7', label: 'X7' },
      { value: 'X8', label: 'X8' },
      { value: 'X9', label: 'X9' },
      { value: 'X10', label: 'X10' },
      { value: 'X11', label: 'X11' },
      { value: 'X12', label: 'X12' },
      { value: 'X13', label: 'X13' },
      { value: 'X14', label: 'X14 (Back Lidar Output 1)' },
      { value: 'X15', label: 'X15 (Back Lidar Output 2)' },
      { value: 'X16', label: 'X16 (Back Lidar Output 3)' },
      { value: 'X17', label: 'X17 (Back Lidar Status)' },
      { value: 'X18', label: 'X18 (Front Lidar Output 1)' },
      { value: 'X19', label: 'X19 (Front Lidar Output 2)' },
      { value: 'X20', label: 'X20 (Front Lidar Output 3)' },
      { value: 'X21', label: 'X21 (Front Lidar Status)' },
      { value: 'X22', label: 'X22 (Accept)' },
      { value: 'X23', label: 'X23 (Emergency Brake)' },
      // I/O Output options (Y0 to Y15)
      { value: 'Y0', label: 'Y0 (Relay Charger)' },
      { value: 'Y1', label: 'Y1 (LED Light)' },
      { value: 'Y2', label: 'Y2' },
      { value: 'Y3', label: 'Y3' },
      { value: 'Y4', label: 'Y4' },
      { value: 'Y5', label: 'Y5' },
      { value: 'Y6', label: 'Y6' },
      { value: 'Y7', label: 'Y7' },
      { value: 'Y8', label: 'Y8' },
      { value: 'Y9', label: 'Y9' },
      { value: 'Y10', label: 'Y10' },
      { value: 'Y11', label: 'Y11' },
      { value: 'Y12', label: 'Y12' },
      { value: 'Y13', label: 'Y13' },
      { value: 'Y14', label: 'Y14' },
      { value: 'Y15', label: 'Y15' }
    ],
    helpText: 'Select I/O Input (X1-X23) or I/O Output (Y0-Y15)'
  }),

  // PLC Index for PLC Register (1-200)
  INDEX_PLC: createFieldConfig({
    name: 'index',
    label: 'Index',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: 'PLC1',
    placeholder: 'Select PLC Register',
    options: [
      // PLC Register options (1 to 200)
      ...Array.from({ length: 200 }, (_, i) => ({
        value: `PLC${i + 1}`,
        label: `PLC Register ${i + 1}`
      }))
    ],
    helpText: 'Select PLC Register (1-200)'
  }),

  // Generic INDEX (backward compatibility)
  INDEX: createFieldConfig({
    name: 'index',
    label: 'Index',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: 'X1',
    placeholder: 'Select index',
    options: [
      // I/O Input options (X1 to X23)
      { value: 'X1', label: 'X1' },
      { value: 'X2', label: 'X2' },
      { value: 'X3', label: 'X3' },
      { value: 'X4', label: 'X4' },
      { value: 'X5', label: 'X5' },
      { value: 'X6', label: 'X6' },
      { value: 'X7', label: 'X7' },
      { value: 'X8', label: 'X8' },
      { value: 'X9', label: 'X9' },
      { value: 'X10', label: 'X10' },
      { value: 'X11', label: 'X11' },
      { value: 'X12', label: 'X12' },
      { value: 'X13', label: 'X13' },
      { value: 'X14', label: 'X14 (Back Lidar Output 1)' },
      { value: 'X15', label: 'X15 (Back Lidar Output 2)' },
      { value: 'X16', label: 'X16 (Back Lidar Output 3)' },
      { value: 'X17', label: 'X17 (Back Lidar Status)' },
      { value: 'X18', label: 'X18 (Front Lidar Output 1)' },
      { value: 'X19', label: 'X19 (Front Lidar Output 2)' },
      { value: 'X20', label: 'X20 (Front Lidar Output 3)' },
      { value: 'X21', label: 'X21 (Front Lidar Status)' },
      { value: 'X22', label: 'X22 (Accept)' },
      { value: 'X23', label: 'X23 (Emergency Brake)' },
      // I/O Output options (Y0 to Y15)
      { value: 'Y0', label: 'Y0 (Relay Charger)' },
      { value: 'Y1', label: 'Y1 (LED Light)' },
      { value: 'Y2', label: 'Y2' },
      { value: 'Y3', label: 'Y3' },
      { value: 'Y4', label: 'Y4' },
      { value: 'Y5', label: 'Y5' },
      { value: 'Y6', label: 'Y6' },
      { value: 'Y7', label: 'Y7' },
      { value: 'Y8', label: 'Y8' },
      { value: 'Y9', label: 'Y9' },
      { value: 'Y10', label: 'Y10' },
      { value: 'Y11', label: 'Y11' },
      { value: 'Y12', label: 'Y12' },
      { value: 'Y13', label: 'Y13' },
      { value: 'Y14', label: 'Y14' },
      { value: 'Y15', label: 'Y15' },
      // PLC Register options (1 to 200)
      ...Array.from({ length: 200 }, (_, i) => ({
        value: `PLC${i + 1}`,
        label: `PLC Register ${i + 1}`
      }))
    ],
    helpText: 'Select I/O Input (X1-X23), I/O Output (Y0-Y15), or PLC Register (1-200)'
  }),
  OPERATOR: createFieldConfig({
    name: 'operator',
    label: 'Operator',
    type: FIELD_TYPES.COMBOBOX,
    defaultValue: '0',
    placeholder: 'Select',
    options: [
      { value: '0', label: '!=' },
      { value: '1', label: '<' },
      { value: '2', label: '<=' },
      { value: '3', label: '==' },
      { value: '4', label: '>' },
      { value: '5', label: '>=' },
    ],
    helpText: 'Operator of the input'
  }),
  VALUE: createFieldConfig({
    name: 'value',
    label: 'Value',
    type: FIELD_TYPES.INT,
    defaultValue: '0',
    placeholder: 'Enter value',
    helpText: 'Value of the input'
  }),
  
  // Generic fields
  NAME: createFieldConfig({
    name: 'name',
    label: 'Name',
    type: FIELD_TYPES.TEXT,
    defaultValue: '',
    placeholder: 'Enter name',
    required: true,
    helpText: 'Name of the action'
  }),
  
  COUNT: createFieldConfig({
    name: 'count',
    label: 'Count',
    type: FIELD_TYPES.INT,
    defaultValue: '5',
    placeholder: 'Enter count',
    min: 1,
    max: 100,
    helpText: 'Number of iterations (1-100)'
  }),


MARKER: createFieldConfig({ 
  name: 'marker',
  label: 'Marker',
  type: FIELD_TYPES.COMBOBOX,
  defaultValue: '0',
  placeholder: 'Select marker',
  options: [],
  helpText: ''
})
};
/**
 * Helper function to create field configurations for common action types
 */
export const createActionFieldConfigs = {
  // Move action fields
  move: (points = []) => {
    // Build grouped combobox options from points grouped by maps
    const groupedOptions = [];
    try {
      if (Array.isArray(points)) {
        points.forEach(group => {
          const mapName = group?.mapName || '';
          const pts = Array.isArray(group?.points) ? group.points : [];
          if (!mapName || pts.length === 0) return;

          const groupOptions = pts
            .filter(point => point && point.ID != null)
            .map(point => ({
              value: String(point.ID),
              label: point.PointName || String(point.ID)
            }));

          if (groupOptions.length > 0) {
            groupedOptions.push({ label: mapName, options: groupOptions });
          }
        });
      }
    } catch (e) {
      console.error('createActionFieldConfigs.move: failed to build grouped options from points', e);
    }

    const positionField = {
      ...PREDEFINED_FIELDS.POSITION,
      options: groupedOptions
    };

    return [
      positionField,
      PREDEFINED_FIELDS.RETRIES,
      PREDEFINED_FIELDS.DISTANCE_THRESHOLD
    ];
  },
  switchMap:(points = [])=>{
  // Build grouped combobox options from points grouped by maps
  const groupedOptions = [];
  try {
    if (Array.isArray(points)) {
      points.forEach(group => {
        const mapName = group?.mapName || '';
        const pts = Array.isArray(group?.points) ? group.points : [];
        if (!mapName || pts.length === 0) return;

        const groupOptions = pts
          .filter(point => point && point.ID != null)
          .map(point => ({
            value: String(point.ID),
            label: point.PointName || String(point.ID)
          }));

        if (groupOptions.length > 0) {
          groupedOptions.push({ label: mapName, options: groupOptions });
        }
      });
    }
  } catch (e) {
    console.error('createActionFieldConfigs.move: failed to build grouped options from points', e);
  }

  const positionField = {
    ...PREDEFINED_FIELDS.POSITION,
    options: groupedOptions
  };

  return [
    positionField,
  ];
  },
  
  // MoveToCoordinate action fields
  moveToCoordinate: () => [
    PREDEFINED_FIELDS.X_COORDINATE,
    PREDEFINED_FIELDS.Y_COORDINATE,
    PREDEFINED_FIELDS.ORIENTATION,
    PREDEFINED_FIELDS.RETRIES,
    PREDEFINED_FIELDS.DISTANCE_THRESHOLD
  ],
  
  // RelativeMove action fields
  relativeMove: () => [
    PREDEFINED_FIELDS.X_COORDINATE,
    PREDEFINED_FIELDS.Y_COORDINATE,
    PREDEFINED_FIELDS.ORIENTATION,
    PREDEFINED_FIELDS.COLLISION_DETECTION,
    PREDEFINED_FIELDS.MAX_ANGULAR_SPEED,
    PREDEFINED_FIELDS.MAX_LINEAR_SPEED
  ],
  
  // Wait action fields
  wait: () => [
    createFieldConfig({
      name: 'time',
      label: 'Duration',
      type: FIELD_TYPES.TIME,
      defaultValue: '5',
      placeholder: 'hh:mm:ss',
      helpText: ''
    })
  ],
  
  // Loop action fields
  loop: () => [
    createFieldConfig({
      name: 'iterations',
      label: 'Iterations',
      type: FIELD_TYPES.INT,
      defaultValue: '1',
      placeholder: 'Enter iterations (use -1 for endless)',
      min: -1,
      max: 100,
      helpText: 'Use -1 for endless; or a number 1-100'
    })
  ],
  if: (compareValue = '0') => {
    // Chọn INDEX field dựa trên compare value
    let indexField;
    if (compareValue === '3') {
      // PLC Register
      indexField = PREDEFINED_FIELDS.INDEX_PLC;
    } else {
      // I/O Input/Output (0, 1, 2)
      indexField = PREDEFINED_FIELDS.INDEX_IO;
    }

    return [
      PREDEFINED_FIELDS.COMPARE,
      indexField,
      PREDEFINED_FIELDS.OPERATOR,
      PREDEFINED_FIELDS.VALUE
    ];
  },
  
  // While action fields (giống IfAction)
  while:()=>[
  PREDEFINED_FIELDS.COMPARE,
  PREDEFINED_FIELDS.INDEX,
  PREDEFINED_FIELDS.OPERATOR,
  PREDEFINED_FIELDS.VALUE
],
docking: (mapWithMarkers = []) => {
    // Build grouped combobox options from markers grouped by maps
    const groupedOptions = [];
    try {
      if (Array.isArray(mapWithMarkers)) {
        mapWithMarkers.forEach(group => {
          const mapName = group?.mapName || '';
          const markers = Array.isArray(group?.markers) ? group.markers : [];
          if (!mapName || markers.length === 0) return;

          const groupOptions = markers
            .filter(marker => marker && marker.ID != null)
            .map(marker => ({
              value: String(marker.ID),
              label: marker.MarkerName || String(marker.ID)
            }));

          if (groupOptions.length > 0) {
            groupedOptions.push({ label: mapName, options: groupOptions });
          }
        });
      }
    } catch (e) {
      console.error('createActionFieldConfigs.docking: failed to build grouped options from mapWithMarkers', e);
    }

    const markerField = {
      ...PREDEFINED_FIELDS.MARKER,
      options: groupedOptions
    };

    return [
      markerField
    ];
  },
  

  
  // UserCreate action fields
  userCreate: (actionsMap = {}) => {
    // Build grouped combobox options from missions grouped by groups
    const groupedOptions = [];
    try {
      if (actionsMap && typeof actionsMap === 'object') {
        Object.entries(actionsMap).forEach(([groupId, groupActions]) => {
          // Filter only missions (User_create: true)
          const missions = groupActions.filter(item => item.User_create === 'true');
          if (missions.length === 0) return;

          const groupOptions = missions.map(mission => ({
            value: String(mission.missionID || mission.ID),
            label: mission.missionName || mission.actionName || String(mission.missionID || mission.ID)
          }));

          if (groupOptions.length > 0) {
            // Get group name if available, otherwise use groupId
            const groupName = groupActions[0]?.groupName || `Group ${groupId}`;
            groupedOptions.push({ label: groupName, options: groupOptions });
          }
        });
      }
    } catch (e) {
      console.error('createActionFieldConfigs.userCreate: failed to build grouped options from actionsMap', e);
    }

    const missionField = {
      ...PREDEFINED_FIELDS.POSITION, // Reuse position field structure
      name: 'IDMission',
      label: 'Select Mission',
      type: FIELD_TYPES.COMBOBOX,
      defaultValue: '',
      placeholder: 'Select a mission to execute',
      options: groupedOptions,
      helpText: 'Choose a mission to execute when this action runs'
    };

    return [missionField];
  },

  // Create Log action fields
  createLog: () => {
    return [
      {
        name: 'description',
        label: 'Description',
        type: FIELD_TYPES.TEXT,
        defaultValue: '',
        placeholder: 'Enter log description...',
        required: true,
        validation: {
          required: true,
          minLength: 1
        }
      }
    ];
  },

  // Throw Error action fields
  throwError: () => {
    return [
      {
        name: 'description',
        label: 'Description',
        type: FIELD_TYPES.TEXT,
        defaultValue: '',
        placeholder: 'Enter error description...',
        required: true,
        validation: {
          required: true,
          minLength: 1
        }
      }
    ];
  },

  // Prompt User action fields
  promptUser: () => {
    return [
      {
        name: 'question',
        label: 'Question',
        type: FIELD_TYPES.TEXT,
        defaultValue: '',
        placeholder: 'Enter prompt question...',
        required: true,
        validation: {
          required: true,
          minLength: 1
        }
      },
      {
        name: 'userGroupID',
        label: 'User Group ID',
        type: FIELD_TYPES.TEXT,
        defaultValue: '',
        placeholder: 'Enter user group ID...',
        required: true,
        validation: {
          required: true,
          minLength: 1
        }
      },
      {
        name: 'timeout',
        label: 'Timeout (seconds)',
        type: FIELD_TYPES.INT,
        defaultValue: '30',
        placeholder: 'Enter timeout in seconds...',
        required: true,
        validation: {
          required: true,
          min: 1
        }
      }
    ];
  }
}
