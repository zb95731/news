const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  const { username, password, email, nickname, role_id = 2 } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  
  try {
    // Check if username already exists
    const [userRows] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    
    if (userRows.length > 0) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    
    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, email, nickname, role_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, nickname, role_id]
    );
    
    // Generate token
    const token = generateToken({ id: result.insertId, username, role_id });
    
    res.status(201).json({
      message: 'User created successfully.',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        nickname,
        role_id
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  
  try {
    // Find user
    const [userRows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (userRows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
    
    const user = userRows[0];
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({ error: 'User is not active.' });
    }
    
    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
    
    // Update last login time
    await pool.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful.',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get current user info
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [userRows] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const user = userRows[0];
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update user info
router.put('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { email, nickname, avatar } = req.body;
  
  try {
    const updates = [];
    const values = [];
    
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (nickname) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    
    if (avatar) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided.' });
    }
    
    values.push(userId);
    
    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.execute(sql, values);
    
    // Get updated user info
    const [userRows] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [userId]
    );
    
    const user = userRows[0];
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'User updated successfully.',
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  
  try {
    // Get current password hash
    const [userRows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const user = userRows[0];
    
    // Verify current password
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    
    // Hash new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);
    
    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
