/**
 * Convert binary data to real values for robot measurements
 */

// Constants for conversion
const SCALE_FACTORS = {
  WIDTH: 0.01,    // 1 cm per unit
  LENGTH: 0.01,   // 1 cm per unit
  HEIGHT: 0.01,   // 1 cm per unit
  SPEED: 0.1,     // 0.1 m/s per unit
  ANGLE: 0.1,     // 0.1 rad per unit
  TEMPERATURE: 0.1, // 0.1 °C per unit
  VOLTAGE: 0.1,   // 0.1 V per unit
  CURRENT: 0.1,   // 0.1 A per unit
  POWER: 0.1,     // 0.1 W per unit
};

/**
 * Convert binary data to width in meters
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Width in meters
 */
export const binaryToWidth = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.WIDTH;
};

/**
 * Convert binary data to length in meters
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Length in meters
 */
export const binaryToLength = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.LENGTH;
};

/**
 * Convert binary data to height in meters
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Height in meters
 */
export const binaryToHeight = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.HEIGHT;
};

/**
 * Convert binary data to speed in m/s
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Speed in m/s
 */
export const binaryToSpeed = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.SPEED;
};

/**
 * Convert binary data to angle in radians
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Angle in radians
 */
export const binaryToAngle = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.ANGLE;
};

/**
 * Convert binary data to temperature in Celsius
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Temperature in °C
 */
export const binaryToTemperature = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.TEMPERATURE;
};

/**
 * Convert binary data to voltage in volts
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Voltage in volts
 */
export const binaryToVoltage = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.VOLTAGE;
};

/**
 * Convert binary data to current in amperes
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Current in amperes
 */
export const binaryToCurrent = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.CURRENT;
};

/**
 * Convert binary data to power in watts
 * @param {number} binaryValue - Binary value from sensor
 * @returns {number} Power in watts
 */
export const binaryToPower = (binaryValue) => {
  return binaryValue * SCALE_FACTORS.POWER;
};

/**
 * Convert binary data to a specific measurement type
 * @param {number} binaryValue - Binary value from sensor
 * @param {string} type - Type of measurement ('width', 'length', 'height', etc.)
 * @returns {number} Converted value in appropriate units
 */
export const convertBinaryToReal = (binaryValue, type) => {
  const typeMap = {
    'width': binaryToWidth,
    'length': binaryToLength,
    'height': binaryToHeight,
    'speed': binaryToSpeed,
    'angle': binaryToAngle,
    'temperature': binaryToTemperature,
    'voltage': binaryToVoltage,
    'current': binaryToCurrent,
    'power': binaryToPower
  };

  const converter = typeMap[type.toLowerCase()];
  if (!converter) {
    throw new Error(`Unknown conversion type: ${type}`);
  }

  return converter(binaryValue);
};

/**
 * Convert an array of binary values to real values
 * @param {Array<number>} binaryArray - Array of binary values
 * @param {string} type - Type of measurement
 * @returns {Array<number>} Array of converted values
 */
export const convertBinaryArrayToReal = (binaryArray, type) => {
  return binaryArray.map(value => convertBinaryToReal(value, type));
};

/**
 * Convert binary data to a formatted string with units
 * @param {number} binaryValue - Binary value from sensor
 * @param {string} type - Type of measurement
 * @returns {string} Formatted string with value and units
 */
export const formatBinaryValue = (binaryValue, type) => {
  const value = convertBinaryToReal(binaryValue, type);
  const units = {
    'width': 'm',
    'length': 'm',
    'height': 'm',
    'speed': 'm/s',
    'angle': 'rad',
    'temperature': '°C',
    'voltage': 'V',
    'current': 'A',
    'power': 'W'
  };

  return `${value.toFixed(2)} ${units[type.toLowerCase()]}`;
};

/**
 * Convert binary data to YAML string
 * @param {Uint8Array} binaryData - Binary data to convert
 * @returns {string} YAML string
 */
export const binaryToYaml = (binaryData) => {
  try {
    // Create TextDecoder to convert binary to string
    const decoder = new TextDecoder('utf-8');
    const yamlString = decoder.decode(binaryData);
    return yamlString;
  } catch (error) {
    console.error('Error converting binary to YAML:', error);
    throw new Error('Failed to convert binary data to YAML');
  }
};

/**
 * Convert binary data to YAML object
 * @param {Uint8Array} binaryData - Binary data to convert
 * @returns {Object} Parsed YAML object
 */
export const binaryToYamlObject = (binaryData) => {
  try {
    const yamlString = binaryToYaml(binaryData);
    // Split YAML string into lines
    const lines = yamlString.split('\n');
    const result = {};

    lines.forEach(line => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) return;

      // Split line into key and value
      const [key, ...valueParts] = line.split(':');
      if (!key || !valueParts.length) return;

      const value = valueParts.join(':').trim();

      // Handle array values
      if (value.startsWith('[') && value.endsWith(']')) {
        result[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map(item => {
            const trimmed = item.trim();
            // Convert to number if possible
            return isNaN(trimmed) ? trimmed : parseFloat(trimmed);
          });
      } else {
        // Convert to number if possible
        result[key.trim()] = isNaN(value) ? value : parseFloat(value);
      }
    });

    return result;
  } catch (error) {
    console.error('Error parsing YAML from binary:', error);
    throw new Error('Failed to parse YAML from binary data');
  }
};

/**
 * Convert binary data to YAML with specific format for map metadata
 * @param {Uint8Array} binaryData - Binary data to convert
 * @returns {Object} Map metadata object
 */
export const binaryToMapMetadata = (binaryData) => {
  try {
    const yamlObject = binaryToYamlObject(binaryData);
    
    // Ensure required fields exist
    const metadata = {
      image: yamlObject.image || '',
      resolution: yamlObject.resolution || 0.05,
      origin: yamlObject.origin || [0, 0, 0],
      occupied_thresh: yamlObject.occupied_thresh || 0.65,
      free_thresh: yamlObject.free_thresh || 0.196,
      negate: yamlObject.negate || 0
    };

    return metadata;
  } catch (error) {
    console.error('Error converting binary to map metadata:', error);
    throw new Error('Failed to convert binary data to map metadata');
  }
};

/**
 * Convert binary data to YAML string with specific format for map metadata
 * @param {Uint8Array} binaryData - Binary data to convert
 * @returns {string} Formatted YAML string for map metadata
 */
export const binaryToMapMetadataYaml = (binaryData) => {
  try {
    const metadata = binaryToMapMetadata(binaryData);
    
    return [
      `image: ${metadata.image}`,
      `resolution: ${metadata.resolution}`,
      `origin: [${metadata.origin.join(', ')}]`,
      `occupied_thresh: ${metadata.occupied_thresh}`,
      `free_thresh: ${metadata.free_thresh}`,
      `negate: ${metadata.negate}`
    ].join('\n');
  } catch (error) {
    console.error('Error formatting map metadata YAML:', error);
    throw new Error('Failed to format map metadata YAML');
  }
};

/**
 * Decode map data info from binary data
 * @param {Uint8Array} binaryData - Binary data containing map info
 * @returns {Object} Decoded map info object
 */
export const decodeMapInfo = (binaryData) => {
  try {
    // Create TextDecoder to convert binary to string
    const decoder = new TextDecoder('utf-8');
    const mapInfoString = decoder.decode(binaryData);
    
    // Parse the map info string into an object
    const mapInfo = {};
    const lines = mapInfoString.split('\n');
    
    lines.forEach(line => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) return;
      
      // Split line into key and value
      const [key, ...valueParts] = line.split(':');
      if (!key || !valueParts.length) return;
      
      const value = valueParts.join(':').trim();
      
      // Handle different value types
      switch (key.trim()) {
        case 'width':
        case 'height':
        case 'resolution':
          mapInfo[key.trim()] = parseFloat(value);
          break;
        case 'origin':
          // Parse array format [x, y, z]
          const originValues = value
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(v => parseFloat(v.trim()));
          mapInfo[key.trim()] = {
            position: {
              x: originValues[0],
              y: originValues[1]
            },
            orientation: {
              z: originValues[2] || 0
            }
          };
          break;
        case 'occupied_thresh':
        case 'free_thresh':
        case 'negate':
          mapInfo[key.trim()] = parseFloat(value);
          break;
        case 'image':
          mapInfo[key.trim()] = value;
          break;
        default:
          mapInfo[key.trim()] = value;
      }
    });
    
    // Set default values if not present
    mapInfo.width = mapInfo.width || 0;
    mapInfo.height = mapInfo.height || 0;
    mapInfo.resolution = mapInfo.resolution || 0.05;
    mapInfo.origin = mapInfo.origin || {
      position: { x: 0, y: 0 },
      orientation: { z: 0 }
    };
    mapInfo.occupied_thresh = mapInfo.occupied_thresh || 0.65;
    mapInfo.free_thresh = mapInfo.free_thresh || 0.196;
    mapInfo.negate = mapInfo.negate || 0;
    mapInfo.image = mapInfo.image || 'map.pgm';
    
    return mapInfo;
  } catch (error) {
    console.error('Error decoding map info:', error);
    throw new Error('Failed to decode map info from binary data');
  }
};

/**
 * Encode map info to binary data
 * @param {Object} mapInfo - Map info object to encode
 * @returns {Uint8Array} Binary data containing map info
 */
export const encodeMapInfo = (mapInfo) => {
  try {
    // Create YAML string from map info
    const yamlString = [
      `image: ${mapInfo.image}`,
      `resolution: ${mapInfo.resolution}`,
      `origin: [${mapInfo.origin.position.x}, ${mapInfo.origin.position.y}, ${mapInfo.origin.orientation.z}]`,
      `occupied_thresh: ${mapInfo.occupied_thresh}`,
      `free_thresh: ${mapInfo.free_thresh}`,
      `negate: ${mapInfo.negate}`
    ].join('\n');
    
    // Convert YAML string to binary
    const encoder = new TextEncoder();
    return encoder.encode(yamlString);
  } catch (error) {
    console.error('Error encoding map info:', error);
    throw new Error('Failed to encode map info to binary data');
  }
};

/**
 * Convert map data info array to JSON object
 * @param {Uint8Array} mapDataInfo - Map data info array
 * @returns {Object} JSON object containing map info
 */
export const convertMapDataInfoToJson = (mapDataInfo) => {
  try {
    // Create TextDecoder to convert binary to string
    const decoder = new TextDecoder('utf-8');
    const mapInfoString = decoder.decode(mapDataInfo);
    
    // Parse the map info string into an object
    const mapInfo = {};
    const lines = mapInfoString.split('\n');
    
    lines.forEach(line => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) return;
      
      // Split line into key and value
      const [key, ...valueParts] = line.split(':');
      if (!key || !valueParts.length) return;
      
      const value = valueParts.join(':').trim();
      
      // Handle different value types
      switch (key.trim()) {
        case 'width':
        case 'height':
        case 'resolution':
          mapInfo[key.trim()] = parseFloat(value);
          break;
        case 'origin':
          // Parse array format [x, y, z]
          const originValues = value
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(v => parseFloat(v.trim()));
          mapInfo[key.trim()] = {
            position: {
              x: originValues[0],
              y: originValues[1]
            },
            orientation: {
              z: originValues[2] || 0
            }
          };
          break;
        case 'occupied_thresh':
        case 'free_thresh':
        case 'negate':
          mapInfo[key.trim()] = parseFloat(value);
          break;
        case 'image':
          mapInfo[key.trim()] = value;
          break;
        default:
          mapInfo[key.trim()] = value;
      }
    });
    
    // Set default values if not present
    mapInfo.width = mapInfo.width || 0;
    mapInfo.height = mapInfo.height || 0;
    mapInfo.resolution = mapInfo.resolution || 0.05;
    mapInfo.origin = mapInfo.origin || {
      position: { x: 0, y: 0 },
      orientation: { z: 0 }
    };
    mapInfo.occupied_thresh = mapInfo.occupied_thresh || 0.65;
    mapInfo.free_thresh = mapInfo.free_thresh || 0.196;
    mapInfo.negate = mapInfo.negate || 0;
    mapInfo.image = mapInfo.image || 'map.pgm';
    
    return mapInfo;
  } catch (error) {
    console.error('Error converting map data info to JSON:', error);
    throw new Error('Failed to convert map data info to JSON');
  }
};

/**
 * Convert map data info array to formatted string
 * @param {Uint8Array} mapDataInfo - Map data info array
 * @returns {string} Formatted string containing map info
 */
export const formatMapDataInfo = (mapDataInfo) => {
  try {
    const mapInfo = convertMapDataInfoToJson(mapDataInfo);
    
    return [
      `Map Info:`,
      `Width: ${mapInfo.width} pixels`,
      `Height: ${mapInfo.height} pixels`,
      `Resolution: ${mapInfo.resolution} m/pixel`,
      `Origin: [${mapInfo.origin.position.x}, ${mapInfo.origin.position.y}, ${mapInfo.origin.orientation.z}]`,
      `Occupied Threshold: ${mapInfo.occupied_thresh}`,
      `Free Threshold: ${mapInfo.free_thresh}`,
      `Negate: ${mapInfo.negate}`,
      `Image: ${mapInfo.image}`
    ].join('\n');
  } catch (error) {
    console.error('Error formatting map data info:', error);
    throw new Error('Failed to format map data info');
  }
};

/**
 * Convert array to ArrayBuffer
 * @param {Array<number>} array - Array of numbers to convert
 * @returns {ArrayBuffer} ArrayBuffer containing the array data
 */
export const arrayToArrayBuffer = (array) => {
  try {
    // Create a new ArrayBuffer with size equal to array length
    const buffer = new ArrayBuffer(array.length);
    // Create a view to write to the buffer
    const view = new Uint8Array(buffer);
    // Copy array data to buffer
    array.forEach((value, index) => {
      view[index] = value;
    });
    return buffer;
  } catch (error) {
    console.error('Error converting array to ArrayBuffer:', error);
    throw new Error('Failed to convert array to ArrayBuffer');
  }
};

/**
 * Convert ArrayBuffer to array
 * @param {ArrayBuffer} buffer - ArrayBuffer to convert
 * @returns {Array<number>} Array containing the buffer data
 */
export const arrayBufferToArray = (buffer) => {
  try {
    // Create a view to read from the buffer
    const view = new Uint8Array(buffer);
    // Convert view to array
    return Array.from(view);
  } catch (error) {
    console.error('Error converting ArrayBuffer to array:', error);
    throw new Error('Failed to convert ArrayBuffer to array');
  }
};

/**
 * Convert array to ArrayBuffer with specific data type
 * @param {Array<number>} array - Array of numbers to convert
 * @param {string} type - Data type ('uint8', 'int8', 'uint16', 'int16', 'uint32', 'int32', 'float32', 'float64')
 * @returns {ArrayBuffer} ArrayBuffer containing the array data
 */
export const arrayToTypedArrayBuffer = (array, type = 'uint8') => {
  try {
    const typeMap = {
      'uint8': Uint8Array,
      'int8': Int8Array,
      'uint16': Uint16Array,
      'int16': Int16Array,
      'uint32': Uint32Array,
      'int32': Int32Array,
      'float32': Float32Array,
      'float64': Float64Array
    };

    const TypedArray = typeMap[type.toLowerCase()];
    if (!TypedArray) {
      throw new Error(`Unsupported data type: ${type}`);
    }

    // Create a new typed array
    const typedArray = new TypedArray(array);
    return typedArray.buffer;
  } catch (error) {
    console.error('Error converting array to typed ArrayBuffer:', error);
    throw new Error('Failed to convert array to typed ArrayBuffer');
  }
};

/**
 * Convert ArrayBuffer to array with specific data type
 * @param {ArrayBuffer} buffer - ArrayBuffer to convert
 * @param {string} type - Data type ('uint8', 'int8', 'uint16', 'int16', 'uint32', 'int32', 'float32', 'float64')
 * @returns {Array<number>} Array containing the buffer data
 */
export const typedArrayBufferToArray = (buffer, type = 'uint8') => {
  try {
    const typeMap = {
      'uint8': Uint8Array,
      'int8': Int8Array,
      'uint16': Uint16Array,
      'int16': Int16Array,
      'uint32': Uint32Array,
      'int32': Int32Array,
      'float32': Float32Array,
      'float64': Float64Array
    };

    const TypedArray = typeMap[type.toLowerCase()];
    if (!TypedArray) {
      throw new Error(`Unsupported data type: ${type}`);
    }

    // Create a view to read from the buffer
    const view = new TypedArray(buffer);
    // Convert view to array
    return Array.from(view);
  } catch (error) {
    console.error('Error converting typed ArrayBuffer to array:', error);
    throw new Error('Failed to convert typed ArrayBuffer to array');
  }
}; 