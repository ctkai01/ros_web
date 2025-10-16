const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const { config } = require('../../config/database');

const JWT_SECRET = 'robot_secret_key';
const JWT_REFRESH_SECRET = 'robot_refresh_secret_key';

// Login route
router.post('/login', async (req, res) => {
    const { username, password, pincode, loginType } = req.body;
    console.log('Login attempt:', { loginType, username, hasPincode: !!pincode });

    try {
        // SỬ DỤNG POOL TỪ REQUEST
        const pool = req.pool;
        if (!pool.connected) {
            return res.status(503).json({ error: 'Database service is unavailable.' });
        }

        let user = null;
        let loginMethod = '';

        if (loginType === 'credentials') {
            console.log('Attempting credentials login for user:', username);
            
            // First get user by username
            const userResult = await pool.request()
                .input('username', sql.NVarChar, username)
                .query(`
                    SELECT 
                        u.id,
                        u.username,
                        u.password,
                        u.email,
                        u.full_name,
                        u.group_id,
                        u.is_active,
                        u.last_login,
                        u.login_method,
                        u.created_at,
                        u.updated_at,
                        g.name AS group_name,
                        g.level AS group_level
                    FROM Users u
                    INNER JOIN UserGroups g ON u.group_id = g.id
                    WHERE u.username = @username 
                        AND u.is_active = 1 
                        AND g.is_active = 1
                `);

            if (userResult.recordset.length > 0) {
                const userData = userResult.recordset[0];
                
                // Compare password using bcrypt
                const isPasswordValid = await bcrypt.compare(password, userData.password);
                
                if (isPasswordValid) {
                    user = userData;
                    loginMethod = 'password';
                    console.log('Password authentication successful for:', user.username);
                } else {
                    console.log('Password authentication failed for:', username);
                    return res.json({ success: false, message: 'Invalid username or password' });
                }
            } else {
                console.log('User not found:', username);
                return res.json({ success: false, message: 'Invalid username or password' });
            }
        } else if (loginType === 'pincode') {
            console.log('Attempting pincode login with:', pincode);
            
            // Authenticate by pincode via inline SQL (no stored procedure required)
            const result = await pool.request()
                .input('pincode', sql.NVarChar, pincode)
                .query(`
                    SELECT 
                        u.id,
                        u.username,
                        u.password,
                        u.email,
                        u.full_name,
                        u.group_id,
                        u.is_active,
                        u.last_login,
                        u.login_method,
                        u.created_at,
                        u.updated_at,
                        g.name AS group_name,
                        g.level AS group_level
                    FROM Users u
                    INNER JOIN UserGroups g ON u.group_id = g.id
                    WHERE u.pincode = @pincode
                        AND u.is_active = 1
                        AND g.is_active = 1
                `);

            if (result.recordset.length > 0) {
                user = result.recordset[0];
                loginMethod = 'pincode';
                console.log('Pincode authentication successful for:', user.username);
            } else {
                console.log('Pincode authentication failed for pincode:', pincode);
                return res.json({ success: false, message: 'Invalid pincode' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid login type' });
        }

        // Update last login
        if (user) {
            const now = new Date().toISOString();
            await pool.request()
                .input('user_id', sql.Int, user.id)
                .input('login_method', sql.NVarChar, loginMethod)
                .input('now', sql.NVarChar, now)
                .query(`
                    UPDATE Users
                    SET last_login = @now,
                        login_method = @login_method,
                        updated_at = @now
                    WHERE id = @user_id
                `);
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { 
                id: user.id,
                username: user.username, 
                full_name: user.full_name,
                group_id: user.group_id,
                group_name: user.group_name,
                group_level: user.group_level
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
            { 
                id: user.id,
                username: user.username, 
                full_name: user.full_name,
                group_id: user.group_id,
                group_name: user.group_name,
                group_level: user.group_level
            },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.full_name,
                username: user.username,
                email: user.email,
                group_id: user.group_id,
                group_name: user.group_name,
                group_level: user.group_level,
                login_method: loginMethod
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.headers['x-refresh-token'];

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign(
            { 
                id: decoded.id,
                username: decoded.username, 
                full_name: decoded.full_name,
                group_id: decoded.group_id,
                group_name: decoded.group_name,
                group_level: decoded.group_level
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({
            success: false,
            message: 'Invalid refresh token',
            needRelogin: true
        });
    }
});

// Get user info route
router.get('/user-info', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const pool = req.pool;

        const result = await pool.request()
            .input('username', sql.NVarChar, decoded.username)
            .query(`
                SELECT TOP 1
                    u.id,
                    u.username,
                    u.password,
                    u.email,
                    u.full_name,
                    u.group_id,
                    u.is_active,
                    u.last_login,
                    u.login_method,
                    u.created_at,
                    u.updated_at,
                    g.name AS group_name,
                    g.level AS group_level
                FROM Users u
                INNER JOIN UserGroups g ON u.group_id = g.id
                WHERE u.username = @username
                ORDER BY u.id DESC
            `);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.full_name,
                    username: user.username,
                    email: user.email,
                    group_id: user.group_id,
                    group_name: user.group_name,
                    group_level: user.group_level,
                    last_login: user.last_login,
                    login_method: user.login_method
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user permissions route
router.get('/permissions', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const pool = req.pool;
        try {
            const isMySql = config.engine === 'mysql';
            const users = isMySql ? '`Users`' : '[dbo].[Users]';
            const groups = isMySql ? 'UserGroups' : '[dbo].[UserGroups]';
            const groupPerms = isMySql ? 'GroupPermissions' : '[dbo].[GroupPermissions]';
            const perms = isMySql ? 'Permissions' : '[dbo].[Permissions]';
            const result = await pool.request()
                .input('username', sql.NVarChar, decoded.username)
                .query(`
                    SELECT p.*
                    FROM ${users} u
                    INNER JOIN ${groups} g ON u.group_id = g.id
                    INNER JOIN ${groupPerms} gp ON gp.group_id = g.id
                    INNER JOIN ${perms} p ON p.id = gp.permission_id
                    WHERE u.username = @username
                `);

            return res.json({
                success: true,
                permissions: result.recordset
            });
        } catch (permErr) {
            // SQL Server error 208 OR MySQL unknown db/table: return empty permissions
            if (
                (permErr && (permErr.number === 208 || /Invalid object name/.test(permErr.message || ''))) ||
                (permErr && (permErr.code === 'ER_NO_SUCH_TABLE' || /doesn\'t exist/.test(permErr.sqlMessage || ''))) ||
                (permErr && permErr.code === 'ER_BAD_DB_ERROR')
            ) {
                return res.json({ success: true, permissions: [] });
            }
            throw permErr;
        }
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router; 