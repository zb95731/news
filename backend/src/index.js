const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool, initDatabase } = require('./db');
const { authMiddleware, permit } = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
console.log('Initializing database...');
initDatabase()
  .then(() => {
    console.log('Database initialized successfully.');
    
    // Initialize crawler and cron (after database is ready)
    try {
      const crawler = require('./crawler/crawler');
      const cronManager = require('./crawler/cron');
      
      // Start cron jobs
      cronManager.init();
      cronManager.start();
      
      // Run initial crawl immediately
      console.log('Running initial crawl...');
      crawler.crawl();
    } catch (error) {
      console.error('Error initializing crawler:', error.message);
    }
    
    // Start server after database is ready
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });

// API Routes

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// User routes
app.get('/api/users/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const sql = 'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?';
    const [rows] = await pool.execute(sql, [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const user = rows[0];
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { email, nickname, avatar } = req.body;
  
  try {
    const updates = [];
    const values = [];
    
    if (email) { updates.push('email = ?'); values.push(email); }
    if (nickname) { updates.push('nickname = ?'); values.push(nickname); }
    if (avatar) { updates.push('avatar = ?'); values.push(avatar); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided.' });
    }
    
    values.push(userId);
    
    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.execute(sql, values);
    
    // Get updated user info
    const [rows] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [userId]
    );
    
    const user = rows[0];
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'User updated successfully.',
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/change-password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  const bcrypt = require('bcryptjs');
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  
  try {
    // Get current password hash
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const user = rows[0];
    
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

// Admin routes (requires admin permissions)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', authMiddleware, permit('manage_users', 'manage_roles', 'manage_permissions'), adminRoutes);

// News Source routes
app.get('/api/news-sources', authMiddleware, permit('view_news', 'manage_sources'), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM news_sources ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/news-sources/:id', authMiddleware, permit('view_news', 'manage_sources'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM news_sources WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/news-sources', authMiddleware, permit('manage_sources'), async (req, res) => {
  const { name, url, type, parser_config, is_active = true, crawl_interval = 300 } = req.body;
  
  if (!name || !url || !type || !parser_config) {
    return res.status(400).json({ error: 'Name, url, type, and parser_config are required.' });
  }
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO news_sources (name, url, type, parser_config, is_active, crawl_interval) VALUES (?, ?, ?, ?, ?, ?)',
      [name, url, type, JSON.stringify(parser_config), is_active, crawl_interval]
    );
    res.status(201).json({ id: result.insertId, message: 'News source created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/news-sources/:id', authMiddleware, permit('manage_sources'), async (req, res) => {
  const { id } = req.params;
  const { name, url, type, parser_config, is_active, crawl_interval } = req.body;
  
  try {
    const updates = [];
    const values = [];
    
    if (name) { updates.push('name = ?'); values.push(name); }
    if (url) { updates.push('url = ?'); values.push(url); }
    if (type) { updates.push('type = ?'); values.push(type); }
    if (parser_config) { updates.push('parser_config = ?'); values.push(JSON.stringify(parser_config)); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    if (crawl_interval) { updates.push('crawl_interval = ?'); values.push(crawl_interval); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided.' });
    }
    
    values.push(id);
    
    const sql = `UPDATE news_sources SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.execute(sql, values);
    res.json({ message: 'News source updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/news-sources/:id', authMiddleware, permit('manage_sources'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM news_sources WHERE id = ?', [id]);
    res.json({ message: 'News source deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crawler control route
app.post('/api/crawler/run', authMiddleware, permit('manage_sources'), async (req, res) => {
  try {
    const crawler = require('./crawler/crawler');
    await crawler.crawl();
    res.json({ message: 'Crawl started successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all news route
app.delete('/api/news', authMiddleware, permit('manage_news'), async (req, res) => {
  try {
    await pool.execute('DELETE FROM news');
    res.json({ message: 'All news cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// News routes (updated with auth)
app.get('/api/news', async (req, res) => {
  const sql = `
    SELECT news.*, GROUP_CONCAT(topics.name) as topics
    FROM news
    LEFT JOIN news_topics ON news.id = news_topics.news_id
    LEFT JOIN topics ON news_topics.topic_id = topics.id
    GROUP BY news.id
    ORDER BY news.created_at DESC
  `;
  try {
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/news/:id', authMiddleware, permit('view_news'), async (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT news.*, GROUP_CONCAT(topics.name) as topics
    FROM news
    LEFT JOIN news_topics ON news.id = news_topics.news_id
    LEFT JOIN topics ON news_topics.topic_id = topics.id
    WHERE news.id = ?
    GROUP BY news.id
  `;
  try {
    const [rows] = await pool.execute(sql, [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/news', authMiddleware, permit('manage_news'), async (req, res) => {
  const { title, link, hotness, summary, topics } = req.body;
  
  try {
    // Insert news
    const [result] = await pool.execute(
      'INSERT INTO news (title, link, hotness, summary) VALUES (?, ?, ?, ?)',
      [title, link, hotness || 0, summary]
    );
    
    const newsId = result.insertId;
    
    // Handle topics if provided
    if (topics && topics.length > 0) {
      for (const topicName of topics) {
        // Check if topic exists, if not create it
        let [topicRows] = await pool.execute('SELECT id FROM topics WHERE name = ?', [topicName]);
        let topicId;
        
        if (topicRows.length === 0) {
          // Create new topic
          const [topicResult] = await pool.execute('INSERT INTO topics (name) VALUES (?)', [topicName]);
          topicId = topicResult.insertId;
        } else {
          topicId = topicRows[0].id;
        }
        
        // Insert into news_topics
        await pool.execute('INSERT INTO news_topics (news_id, topic_id) VALUES (?, ?)', [newsId, topicId]);
      }
    }
    
    res.json({ id: newsId, message: 'News created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/news/:id', authMiddleware, permit('manage_news'), async (req, res) => {
  const { id } = req.params;
  const { title, link, hotness, summary, status, topics } = req.body;
  
  try {
    // Update news fields
    const updates = [];
    const values = [];
    
    if (title) { updates.push('title = ?'); values.push(title); }
    if (link) { updates.push('link = ?'); values.push(link); }
    if (hotness !== undefined) { updates.push('hotness = ?'); values.push(hotness); }
    if (summary) { updates.push('summary = ?'); values.push(summary); }
    if (status) { updates.push('status = ?'); values.push(status); }
    
    if (updates.length > 0) {
      values.push(id);
      const sql = `UPDATE news SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await pool.execute(sql, values);
    }
    
    // Update topics if provided
    if (topics && Array.isArray(topics) && topics.length > 0) {
      // Delete existing topics
      await pool.execute('DELETE FROM news_topics WHERE news_id = ?', [id]);
      
      // Add new topics
      for (const topicName of topics) {
        // Check if topic exists, if not create it
        let [topicRows] = await pool.execute('SELECT id FROM topics WHERE name = ?', [topicName]);
        let topicId;
        
        if (topicRows.length === 0) {
          // Create new topic
          const [topicResult] = await pool.execute('INSERT INTO topics (name) VALUES (?)', [topicName]);
          topicId = topicResult.insertId;
        } else {
          topicId = topicRows[0].id;
        }
        
        // Insert into news_topics
        await pool.execute('INSERT INTO news_topics (news_id, topic_id) VALUES (?, ?)', [id, topicId]);
      }
    }
    
    res.json({ message: 'News updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/news/:id', authMiddleware, permit('manage_news'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM news WHERE id = ?', [id]);
    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Topics routes (updated with auth)
app.get('/api/topics', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM topics ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/topics', authMiddleware, permit('manage_topics'), async (req, res) => {
  const { name, description, cover_image, is_active = true } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Topic name is required.' });
  }
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO topics (name, description, cover_image, is_active) VALUES (?, ?, ?, ?)',
      [name, description || '', cover_image || '', is_active]
    );
    res.status(201).json({ id: result.insertId, message: 'Topic created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subscription routes (updated with auth)
app.get('/api/subscriptions/:userId', async (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT subscriptions.*, topics.name as topic_name
    FROM subscriptions
    JOIN topics ON subscriptions.topic_id = topics.id
    WHERE subscriptions.user_id = ?
  `;
  try {
    const [rows] = await pool.execute(sql, [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  const { userId, topicId, push_method = 'wechat', push_time = '09:00', frequency = 'daily', filter_rules = {}, status = true } = req.body;
  
  if (!userId || !topicId) {
    return res.status(400).json({ error: 'User ID and topic ID are required.' });
  }
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO subscriptions (user_id, topic_id, push_method, push_time, frequency, filter_rules, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, topicId, push_method, push_time, frequency, JSON.stringify(filter_rules), status]
    );
    res.json({ id: result.insertId, message: 'Subscription created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM subscriptions WHERE id = ?', [id]);
    res.json({ message: 'Subscription deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// News by topic (updated with auth)
app.get('/api/news/topic/:topicName', async (req, res) => {
  const { topicName } = req.params;
  const sql = `
    SELECT news.*, GROUP_CONCAT(topics.name) as topics
    FROM news
    JOIN news_topics ON news.id = news_topics.news_id
    JOIN topics ON news_topics.topic_id = topics.id
    WHERE topics.name = ?
    GROUP BY news.id
    ORDER BY news.created_at DESC
  `;
  try {
    const [rows] = await pool.execute(sql, [topicName]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
