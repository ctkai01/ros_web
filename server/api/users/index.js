const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { config } = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'robot_secret_key';

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const pool = req.pool;
        if (config.engine === 'mysql') {
            const result = await pool.request()
                .input('username', sql.NVarChar, decoded.username)
                .query(`
                    SELECT g.name AS group_name, g.level AS group_level
                    FROM ` + '`Users`' + ` u
                    INNER JOIN UserGroups g ON u.group_id = g.id
                    WHERE u.username = @username
                    LIMIT 1
                `);
            if (result.recordset.length > 0) {
                const row = result.recordset[0];
                if (row.group_name === 'Distributors' || (typeof row.group_level === 'number' && row.group_level >= 4)) {
                    return next();
                }
            }
            return res.status(403).json({ message: 'Admin access required' });
        } else {
            const result = await pool.request()
                .input('username', sql.NVarChar, decoded.username)
                .input('module', sql.NVarChar, 'users')
                .input('action', sql.NVarChar, 'admin')
                .execute('CheckUserPermission');
            if (result.recordset.length > 0 && result.recordset[0].has_permission === 1) {
                return next();
            }
            return res.status(403).json({ message: 'Admin access required' });
        }
        
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all users
router.get('/', requireAdmin, async (req, res) => {
    try {
        const pool = req.pool;
        const result = await pool.request()
            .query(`
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.full_name,
                    u.pincode,
                    u.is_active,
                    u.last_login,
                    u.login_method,
                    u.created_at,
                    u.updated_at,
                    g.name AS group_name,
                    g.level AS group_level
                FROM Users u
                INNER JOIN UserGroups g ON u.group_id = g.id
                ORDER BY u.created_at DESC
            `);

        res.json({
            success: true,
            users: result.recordset
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all user groups
router.get('/groups', requireAdmin, async (req, res) => {
    try {
        const pool = req.pool;
        const result = await pool.request()
            .query(`
                SELECT 
                    id,
                    name,
                    description,
                    level,
                    is_active,
                    created_at,
                    updated_at
                FROM UserGroups
                ORDER BY level DESC
            `);

        res.json({
            success: true,
            groups: result.recordset
        });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get single user by ID
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.pool;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.full_name,
                    u.pincode,
                    u.is_active,
                    u.last_login,
                    u.login_method,
                    u.created_at,
                    u.updated_at,
                    u.group_id,
                    g.name AS group_name,
                    g.level AS group_level
                FROM Users u
                INNER JOIN UserGroups g ON u.group_id = g.id
                WHERE u.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: result.recordset[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get single user group by ID
router.get('/groups/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.pool;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    id,
                    name,
                    description,
                    level,
                    is_active,
                    created_at,
                    updated_at
                FROM UserGroups
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User group not found'
            });
        }

        res.json({
            success: true,
            group: result.recordset[0]
        });
    } catch (error) {
        console.error('Get user group error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Create new user group
router.post('/groups', requireAdmin, async (req, res) => {
    try {
        const { name, description, level, is_active } = req.body;
        const pool = req.pool;

        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .input('level', sql.Int, level)
            .input('is_active', sql.Bit, is_active !== undefined ? is_active : true)
            .input('created_by', sql.NVarChar, 'admin')
            .query(`
                INSERT INTO UserGroups 
                (name, description, level, is_active, created_by)
                VALUES 
                (@name, @description, @level, @is_active, @created_by);
                
                SELECT SCOPE_IDENTITY() AS id;
            `);

        res.json({
            success: true,
            message: 'User group created successfully',
            group_id: result.recordset[0].id
        });
    } catch (error) {
        console.error('Create user group error:', error);
        if (error.number === 2627) { // Unique constraint violation
            res.status(400).json({ success: false, message: 'Group name already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

// Update user group
router.put('/groups/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, level, is_active } = req.body;
        const pool = req.pool;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .input('level', sql.Int, level)
            .input('is_active', sql.Bit, is_active !== undefined ? is_active : true)
            .query(`
                UPDATE UserGroups 
                SET name = @name,
                    description = @description,
                    level = @level,
                    is_active = @is_active,
                    updated_at = ${ (config && config.engine === 'mysql') ? 'NOW()' : 'GETDATE()' }
                WHERE id = @id;
                
                SELECT @@ROWCOUNT AS affected;
            `);

        if (result.recordset[0].affected > 0) {
            res.json({
                success: true,
                message: 'User group updated successfully'
            });
        } else {
            res.status(404).json({ success: false, message: 'User group not found' });
        }
    } catch (error) {
        console.error('Update user group error:', error);
        if (error.number === 2627) { // Unique constraint violation
            res.status(400).json({ success: false, message: 'Group name already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

// Delete user group
router.delete('/groups/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.pool;

        // Check if group has users
        const userCheck = await pool.request()
            .input('group_id', sql.Int, id)
            .query(`
                SELECT COUNT(*) AS user_count
                FROM Users
                WHERE group_id = @group_id
            `);

        if (userCheck.recordset[0].user_count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete group that has users assigned to it'
            });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM UserGroups 
                WHERE id = @id;
                
                SELECT @@ROWCOUNT AS affected;
            `);

        if (result.recordset[0].affected > 0) {
            res.json({
                success: true,
                message: 'User group deleted successfully'
            });
        } else {
            res.status(404).json({ success: false, message: 'User group not found' });
        }
    } catch (error) {
        console.error('Delete user group error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Create new user
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { username, password, pincode, email, full_name, group_id } = req.body;
        const pool = req.pool;

        // Hash password if provided
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('pincode', sql.NVarChar, pincode || null)
            .input('email', sql.NVarChar, email || null)
            .input('full_name', sql.NVarChar, full_name || null)
            .input('group_id', sql.Int, group_id)
            .input('created_by', sql.NVarChar, 'admin')
            .query(`
                INSERT INTO Users 
                (username, password, pincode, email, full_name, group_id, created_by)
                VALUES 
                (@username, @password, @pincode, @email, @full_name, @group_id, @created_by);
                
                SELECT SCOPE_IDENTITY() AS id;
            `);

        res.json({
            success: true,
            message: 'User created successfully',
            user_id: result.recordset[0].id
        });
    } catch (error) {
        console.error('Create user error:', error);
        if (error.number === 2627) { // Unique constraint violation
            res.status(400).json({ success: false, message: 'Username or pincode already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

// Update user
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, pincode, email, full_name, group_id, is_active } = req.body;
        const pool = req.pool;

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('pincode', sql.NVarChar, pincode || null)
            .input('email', sql.NVarChar, email || null)
            .input('full_name', sql.NVarChar, full_name || null)
            .input('group_id', sql.Int, group_id)
            .input('is_active', sql.Bit, is_active)
            .query(`
                UPDATE Users 
                SET username = @username,
                    ${hashedPassword ? 'password = @password,' : ''}
                    pincode = @pincode,
                    email = @email,
                    full_name = @full_name,
                    group_id = @group_id,
                    is_active = @is_active,
                    updated_at = ${ (config && config.engine === 'mysql') ? 'NOW()' : 'GETDATE()' }
                WHERE id = @id;
                
                SELECT @@ROWCOUNT AS affected;
            `);

        if (result.recordset[0].affected > 0) {
            res.json({
                success: true,
                message: 'User updated successfully'
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Update user error:', error);
        if (error.number === 2627) { // Unique constraint violation
            res.status(400).json({ success: false, message: 'Username or pincode already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

// Set user pincode
router.post('/:id/pincode', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { pincode } = req.body;
        const pool = req.pool;

        await pool.request()
            .input('user_id', sql.Int, id)
            .input('pincode', sql.NVarChar, pincode)
            .input('updated_by', sql.NVarChar, 'admin')
            .execute('SetUserPincode');

        res.json({
            success: true,
            message: 'Pincode set successfully'
        });
    } catch (error) {
        console.error('Set pincode error:', error);
        if (error.message.includes('Pincode already exists')) {
            res.status(400).json({ success: false, message: 'Pincode already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

// Remove user pincode
router.delete('/:id/pincode', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.pool;

        await pool.request()
            .input('user_id', sql.Int, id)
            .input('updated_by', sql.NVarChar, 'admin')
            .execute('RemoveUserPincode');

        res.json({
            success: true,
            message: 'Pincode removed successfully'
        });
    } catch (error) {
        console.error('Remove pincode error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Delete user
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.pool;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM Users 
                WHERE id = @id;
                
                SELECT @@ROWCOUNT AS affected;
            `);

        if (result.recordset[0].affected > 0) {
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router; 