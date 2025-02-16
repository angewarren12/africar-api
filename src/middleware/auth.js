const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    console.log('Auth headers:', req.headers);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
        console.log('Attempting to verify token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified, decoded:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authenticateToken;
