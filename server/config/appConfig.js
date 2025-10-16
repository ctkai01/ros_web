const fs = require('fs');
const path = require('path');

// Load config from root config.json
const configPath = path.join(__dirname, '../../config.json');
let config = {};

try {
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configFile);
} catch (error) {
  console.error('Error loading config.json:', error);
  // Fallback config
  config = {
    domain: 'ntu-amr.local',
    server: { port: 3000, host: '0.0.0.0' },
    client: { port: 8080, host: '0.0.0.0' },
    websocket: { port: 8081, host: '0.0.0.0' },
    ros: { port: 8080, host: '0.0.0.0' },
    cors: { allowedOrigins: [] }
  };
}

// Generate URLs based on domain
const getUrls = () => {
  const domain = config.domain;
  return {
    // Server URLs
    serverUrl: `http://${domain}:${config.server.port}`,
    serverUrlHttps: `https://${domain}:${config.server.port}`,
    
    // Client URLs
    clientUrl: `http://${domain}:${config.client.port}`,
    clientUrlHttps: `https://${domain}:${config.client.port}`,
    
    // WebSocket URLs
    wsUrl: `ws://${domain}:${config.websocket.port}`,
    wsUrlSecure: `wss://${domain}:${config.websocket.port}`,
    
    // ROS URLs
    rosUrl: `ws://${domain}:${config.ros.port}`,
    rosUrlSecure: `wss://${domain}:${config.ros.port}`
  };
};

// Generate CORS allowed origins
const getAllowedOrigins = () => {
  const domain = config.domain;
  const baseOrigins = config.cors.allowedOrigins || [];
  
  // Add domain-based origins
  const domainOrigins = [
    `http://${domain}:${config.client.port}`,
    `http://${domain}:${config.server.port}`,
    `https://${domain}:${config.client.port}`,
    `https://${domain}:${config.server.port}`,
    // Allow any .local domain
    /\.local$/,
    // Allow localhost/127.0.0.1
    /^(localhost|127\.0\.0\.1)$/,
    undefined,
    null
  ];
  
  return [...baseOrigins, ...domainOrigins];
};

module.exports = {
  ...config,
  getUrls,
  getAllowedOrigins
};
