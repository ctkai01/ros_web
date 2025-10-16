const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const rosConnection = require('./shared/rosConnection');
const { config } = require('./config/database');
let sql;
if (config.engine === 'mysql') {
    const initShim = require('./lib/mssqlMysqlShim');
    sql = initShim({
        host: config.server,
        user: config.user,
        password: config.password,
        database: config.database,
        port: config.port,
        pool: config.pool,
    });
    console.log('Database engine: MySQL (via mssql shim)');
} else {
    sql = require('mssql');
    console.log('Database engine: SQL Server (mssql)');
}

// Import API routes
const authRoutes = require('./api/auth');
const mapsRoutes = require('./api/maps');
const sitesRoutes = require('./api/sites');
const robotRoutes = require('./api/robot');
const monitoringRoutes = require('./api/monitoring');
const settingsRoutes = require('./api/settings');
const joystickRoutes = require('./api/joystick');
const missionRoutes = require('./api/missions');
const missionsMsgpackRoutes = require('./routes/missionsMsgpack');
const groupsRoutes = require('./api/groups');
const actionsRoutes = require('./api/actions');
const usersRoutes = require('./api/users');
const footprintsRoutes = require('./api/footprints');
const dashboardsRoutes = require('./api/dashboards');
const transitionsRoutes = require('./api/transitions');
const missionLogsRoutes = require('./api/mission-logs');
const actionLogsRoutes = require('./api/action-logs');
const errorLogsRoutes = require('./api/error-logs');
const systemLogsRoutes = require('./api/system-logs');
const markersRoutes = require('./api/markers');
const analyticsRoutes = require('./api/analytics');
const dialogRoutes = require('./api/dialog');
// Import subscribers
const { initBatterySubscriber } = require('./subscribers/batterySubscriber');
const { initComputerSubscriber } = require('./subscribers/computerSubscriber');
const { initMotorsSubscriber } = require('./subscribers/motorsSubscriber');
const { initSensorsSubscriber } = require('./subscribers/sensorsSubscriber');
const { initMissionLogSubscriber } = require('./subscribers/missionLogSubscriber');
const { initRobotStatusSubscriber, sendCurrentStatusToClient } = require('./subscribers/robotStatusSubscriber');
const { initMissionQueueAddedSubscriber } = require('./subscribers/missionQueueAddedSubscriber');
const { initMissionQueueStatusSubscriber } = require('./subscribers/missionQueueStatusSubscriber');
const { initMapChangeSubscriber, sendCurrentMapChangeToClient } = require('./subscribers/mapChangeSubscriber');
const { initDialogSubscriber } = require('./subscribers/dialogSubscriber');
const { initSelfInputsSubscriber } = require('./subscribers/selfInputsSubscriber');
const { robotCommands } = require('./config/robotCommands');

// Import TF and scan subscriber functions from robot API
const robotAPI = require('./api/robot');
const initTFSubscriber = robotAPI.initTFSubscriber;
const initScanSubscriber = robotAPI.initScanSubscriber;
const initBrakeSubscriber = robotAPI.initBrakeSubscriber;
const initNavGlobalPathPlanningSubscriber = robotAPI.initNavGlobalPathPlanningSubscriber;

const app = express();
const appConfig = require('./config/appConfig');
const PORT = process.env.PORT || appConfig.server.port;

// Tăng giới hạn kích thước request
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// CORS configuration using official cors library
app.use(cors({
    origin: [
        'http://localhost:8080',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:3000',
        'http://192.168.127.10:8080',
        'http://192.168.127.10:3000',
        'https://192.168.127.10:8080',
        'https://192.168.127.10:3000',
        'http://ntu-amr-1.local:8080',
        'http://ntu-amr-1.local:3000',
        'https://ntu-amr-1.local:8080',
        'https://ntu-amr-1.local:3000',
        'http://dde-amr.local:8080',
        'http://dde-amr.local:3000',
        'https://dde-amr.local:8080',
        'https://dde-amr.local:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-refresh-token', 'x-new-token'],
    exposedHeaders: ['x-new-token']
}));

// Redirect to mDNS hostname on Ubuntu/Linux (skip API calls and static files)
app.use((req, res, next) => {
    try {
        if (process.platform === 'linux') {
            // Skip redirect for API calls and static files to prevent origin: null issues
            if (req.path.startsWith('/api/') ||
                req.path.startsWith('/static/') ||
                req.path.includes('.') ||
                req.path === '/favicon.ico') {
                return next();
            }

            const host = req.headers.host || '';
            // If not already using localhost or ntu-amr-1.local, redirect to it
            if (!/ntu-amr-1\.local(?::\d+)?$/i.test(host) && !/localhost(?::\d+)?$/i.test(host)) {
                const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http');
                const url = `${proto}://localhost:${PORT}${req.originalUrl}`;
                return res.redirect(301, url);
            }
        }
    } catch (_) { }
    next();
});

// CẢI TIẾN: Tạo một Connection Pool duy nhất khi server khởi động
const pool = new sql.ConnectionPool(config);
console.log("Config DB: ", config)
let poolConnect; // Biến để theo dõi promise kết nối

// Middleware để inject connection pool vào mỗi request
// Điều này giúp các file route có thể truy cập vào pool một cách dễ dàng
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// Serve static files (React build)
const path = require('path');
const fs = require('fs');
const buildPath = path.join(__dirname, '../client/dist');
console.log('📁 [SERVER] Static files path:', buildPath);

// Add logging for static file requests
app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
        console.log('🌐 [SERVER] Static file request:', req.method, req.path);
    }
    next();
});

app.use(express.static(buildPath));


// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/robot', robotRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/joystick', joystickRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api', missionsMsgpackRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/footprints', footprintsRoutes);
app.use('/api/dashboards', dashboardsRoutes);
app.use('/api/transitions', transitionsRoutes);
app.use('/api/mission-logs', missionLogsRoutes);
app.use('/api/action-logs', actionLogsRoutes);
app.use('/api/error-logs', errorLogsRoutes);
app.use('/api/system-logs', systemLogsRoutes);
app.use('/api/markers', markersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dialog', dialogRoutes);

// Initialize subscribers when ROS connection is established
function initSubscribers(ros, wss) {
    console.log('🚀 [SERVER] Initializing all subscribers...');
    console.log('🚀 [SERVER] ROS connection status:', rosConnection.isConnected());
    console.log('🚀 [SERVER] WebSocket server available:', !!wss);

    // initialize battery subscriber
    console.log('🔋 [SERVER] Initializing battery subscriber...');
    initBatterySubscriber(ros, wss);

    // initialize computer subscriber
    console.log('💻 [SERVER] Initializing computer subscriber...');
    initComputerSubscriber(ros, wss);

    // initialize motors subscriber
    console.log('⚙️ [SERVER] Initializing motors subscriber...');
    initMotorsSubscriber(ros, wss);

    // initialize sensors subscriber
    console.log('📊 [SERVER] Initializing sensors subscriber...');
    initSensorsSubscriber(ros, wss);

    // initialize mission log subscriber
    console.log('📝 [SERVER] Initializing mission log subscriber...');
    initMissionLogSubscriber(ros, wss);

    // initialize robot status subscriber
    console.log('🤖 [SERVER] Initializing robot status subscriber...');
    initRobotStatusSubscriber(ros, wss);

    // initialize mission queue added subscriber
    console.log('📋 [SERVER] Initializing mission queue added subscriber...');
    initMissionQueueAddedSubscriber(rosConnection, wss);

    // initialize mission queue status subscriber
    console.log('📊 [SERVER] Initializing mission queue status subscriber...');
    initMissionQueueStatusSubscriber(rosConnection, wss);

    // initialize map change subscriber
    console.log('🗺️ [SERVER] Initializing map change subscriber...');
    initMapChangeSubscriber(ros, wss);

    // initialize dialog subscriber
    console.log('💬 [SERVER] Initializing dialog subscriber...');
    initDialogSubscriber(ros, wss);

    // initialize self inputs subscriber
    console.log('🔌 [SERVER] Initializing self inputs subscriber...');
    initSelfInputsSubscriber(ros, wss);

    // initialize TF subscriber for robot transforms
    console.log('🔄 [SERVER] Initializing TF subscriber...');
    initTFSubscriber(wss);

    // initialize scan subscriber for laser data
    console.log('🔍 [SERVER] Initializing scan subscriber...');
    initScanSubscriber(wss);

    // initialize brake subscriber for brake status
    console.log('🛑 [SERVER] Initializing brake subscriber...');
    initBrakeSubscriber(wss);

    // initialize nav global path planning subscriber
    console.log('🗺️ [SERVER] Initializing nav global path planning subscriber...');
    initNavGlobalPathPlanningSubscriber(wss);

    console.log('✅ [SERVER] All subscribers initialized successfully');
}

// WebSocket server
const wss = new WebSocket.Server({
    port: 8081,
    verifyClient: (info) => {
        return true;
    }
});

// Make WebSocket server available to API routes
app.set('wss', wss);

// Register callback to initialize subscribers when ROS connects
rosConnection.onConnect((ros) => {
    console.log('🔌 [SERVER] ROS connection established, initializing subscribers...');
    initSubscribers(ros, wss);
});

wss.on('connection', (ws, req) => {
    console.log('Client connected to WebSocket from:', req.socket.remoteAddress);

    // Send current robot status to new client immediately
    setTimeout(() => {
        sendCurrentStatusToClient(ws);
        sendCurrentMapChangeToClient(ws);
    }, 100); // Small delay to ensure connection is fully established

    ws.on('ping', () => {
        console.log('Received ping from rosbridge');
    });

    ws.on('pong', () => {
        console.log('Pong sent back to rosbridge');
    });


    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
    });
});

// Thêm error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: err.message
    });
});

// Khởi động server
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);

    // Kết nối pool tới database
    try {
        poolConnect = pool.connect();
        await poolConnect;
        console.log('Database connection pool established successfully');
    } catch (err) {
        console.error('Database connection pool failed:', err);
        // Nếu không kết nối được DB, server vẫn chạy nhưng các API sẽ báo lỗi
    }

    setTimeout(() => {
        console.log('Starting ROS connection...');
        rosConnection.initConnection();
    }, 1000);
});

// Xử lý lỗi không bắt được
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// THAY ĐỔI: Xóa `index: false` trong express.static và thêm một route duy nhất cho index.html
// để đảm bảo mọi URL không phải là API đều trả về index.html
app.get('*', (req, res) => {
    // Nếu yêu cầu không phải là một route API, hãy trả về index.html
    if (!req.path.startsWith('/api/')) {
        const indexPath = path.join(buildPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            console.log('✅ [SERVER] Serving index.html for client-side routing:', req.path);
            return res.sendFile(indexPath);
        } else {
            console.error('❌ [SERVER] index.html not found:', indexPath);
            return res.status(404).send('React build not found. Please run "npm run build" in the client directory.');
        }
    }
    // Nếu là API mà không khớp, sẽ được xử lý bởi middleware tiếp theo
    console.log('❌ [SERVER] API endpoint not found:', req.path);
    res.status(404).json({ error: 'API endpoint not found' });
});

// Thêm error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: err.message
    });
});

module.exports = app; 