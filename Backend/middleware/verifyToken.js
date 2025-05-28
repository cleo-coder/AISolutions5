const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Authorization header malformed' });
    }

    const token = parts[1];

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('❌ JWT_SECRET environment variable not set');
        return res.status(500).json({ message: 'Internal server error' });
    }

    try {
        const decoded = jwt.verify(token, secret);

        req.user = {
            userId: decoded.userId,
            full_name: decoded.full_name,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
        };

        next();
    } catch (err) {
        console.error('❌ JWT verification failed:', err.message);
        res.status(403).json({ message: 'Invalid or expired token' });
    }
};
