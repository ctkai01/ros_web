const serverConfig = require('./serverConfig');

// Engine can be 'mssql' or 'mysql'. Default to 'mssql' to preserve current behavior
const engine = process.env.DB_ENGINE || 'mssql';

// Common logical config; adapters will map to their own libraries
const baseConfig = {
  engine,
  user: process.env.DB_USER || engine === "mysql" ? "root" : "sa",
  password:
    process.env.DB_PASSWORD || engine === "mysql"
      ? "DDEVN@12345"
      : "Tumaianhlan0",
  database: process.env.DB_NAME || "NTURobot",
  server: "localhost",
//   server: process.env.DB_HOST || serverConfig.ROBOT_IP,
  port: Number(process.env.DB_PORT) || (engine === "mysql" ? 3306 : 1433),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  // Timeouts
  requestTimeout: 300000,
  connectionTimeout: 60000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 60000,
  },
};

module.exports = {
    config: baseConfig
};