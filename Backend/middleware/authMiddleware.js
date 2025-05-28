/*middleware/authMiddleware.js*/

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied: Token not provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Token verification error:", err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied: User role not found.' });
        }

        const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!rolesArray.includes(req.user.role)) {
            console.warn(`Unauthorized attempt: User ${req.user.userId} (Role: ${req.user.role}) tried to access a route requiring role(s): ${rolesArray.join(', ')}`);
            return res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    checkRole
};