const jwt = require('jsonwebtoken');

const JWT_SECRET = 'robot_secret_key';
const JWT_REFRESH_SECRET = 'robot_refresh_secret_key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // console.log('Auth check:', {
    //     hasAuthHeader: !!authHeader,
    //     token: token ? 'Present' : 'Missing',
    //     fullHeader: authHeader
    // });

    if (!token) {
        console.log('Authentication failed: No token provided');
        return res.status(401).json({ 
            message: 'No token provided',
            needLogin: true 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);

            if (err.name === 'TokenExpiredError') {
                const refreshToken = req.headers['x-refresh-token'];
                // console.log('Token expired, checking refresh token:', !!refreshToken);

                if (!refreshToken) {
                    return res.status(401).json({
                        message: 'Token expired and no refresh token',
                        needRefresh: true
                    });
                }

                try {
                    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
                    // console.log('Refresh token valid, creating new token for user:', decoded.username);

                    const newToken = jwt.sign(
                        { username: decoded.username, name: decoded.name },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    // Gửi token mới trong header
                    res.setHeader('x-new-token', newToken);
                    req.user = decoded;
                    next();
                } catch (refreshErr) {
                    console.log('Refresh token verification failed:', refreshErr.message);
                    return res.status(401).json({
                        message: 'Invalid refresh token',
                        needLogin: true
                    });
                }
            } else {
                return res.status(401).json({ 
                    message: 'Invalid token',
                    needLogin: true 
                });
            }
        } else {
            // console.log('Token verified successfully for user:', user.username);
            req.user = user;
            next();
        }
    });
}

module.exports = {
    authenticateToken
}; 