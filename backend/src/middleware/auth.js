const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { pool } = require('../db');

// Load environment variables
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'default_secret';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role_id: user.role_id },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
};

// Verify JWT token middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// RBAC permission middleware
const permit = (...permissions) => {
  return async (req, res, next) => {
    try {
      // Get user role permissions
      const sql = `
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN users u ON rp.role_id = u.role_id
        WHERE u.id = ?
      `;
      
      const [rows] = await pool.execute(sql, [req.user.id]);
      const userPermissions = rows.map(row => row.name);
      
      // Check if user has any of the required permissions
      const hasPermission = permissions.some(perm => userPermissions.includes(perm));
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

module.exports = {
  generateToken,
  authMiddleware,
  permit
};
