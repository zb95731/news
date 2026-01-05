const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'news_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connected to MySQL database.');

    // Create roles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create permissions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create role_permissions junction table - removed foreign keys
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT,
        permission_id INT,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // Create users table - removed foreign key
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        nickname VARCHAR(50),
        avatar VARCHAR(255),
        role_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create news_sources table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS news_sources (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        url VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        parser_config JSON,
        is_active BOOLEAN DEFAULT TRUE,
        crawl_interval INT DEFAULT 300,
        last_crawled_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create tags table - removed foreign key
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        parent_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create topics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS topics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        cover_image VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create news table - removed foreign key
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS news (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        link VARCHAR(255) NOT NULL UNIQUE,
        summary TEXT,
        content TEXT,
        hotness INT DEFAULT 0,
        source_id INT,
        published_at DATETIME,
        crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        metadata JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create news_tags junction table - removed foreign keys
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS news_tags (
        news_id INT,
        tag_id INT,
        PRIMARY KEY (news_id, tag_id)
      )
    `);

    // Create topic_tags junction table - removed foreign keys
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS topic_tags (
        topic_id INT,
        tag_id INT,
        PRIMARY KEY (topic_id, tag_id)
      )
    `);

    // Create news_topics junction table (legacy support) - removed foreign keys
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS news_topics (
        news_id INT,
        topic_id INT,
        PRIMARY KEY (news_id, topic_id)
      )
    `);

    // Create subscriptions table - removed foreign keys
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        topic_id INT NOT NULL,
        push_method VARCHAR(20) DEFAULT 'wechat',
        push_time VARCHAR(100) DEFAULT '09:00',
        frequency VARCHAR(20) DEFAULT 'daily',
        filter_rules JSON,
        status BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create push_history table - removed foreign keys
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS push_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        subscription_id INT,
        user_id INT NOT NULL,
        news_ids JSON NOT NULL,
        push_method VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default roles
    await connection.execute(`INSERT IGNORE INTO roles (name, description) VALUES ('admin', 'Administrator with full permissions')`);
    await connection.execute(`INSERT IGNORE INTO roles (name, description) VALUES ('user', 'Regular user with limited permissions')`);

    // Insert default permissions
    const permissions = [
      { name: 'view_news', description: 'View news', resource: 'news', action: 'read' },
      { name: 'manage_news', description: 'Manage news', resource: 'news', action: 'write' },
      { name: 'view_topics', description: 'View topics', resource: 'topics', action: 'read' },
      { name: 'manage_topics', description: 'Manage topics', resource: 'topics', action: 'write' },
      { name: 'manage_subscriptions', description: 'Manage subscriptions', resource: 'subscriptions', action: 'write' },
      { name: 'manage_users', description: 'Manage users', resource: 'users', action: 'write' },
      { name: 'manage_roles', description: 'Manage roles', resource: 'roles', action: 'write' },
      { name: 'manage_permissions', description: 'Manage permissions', resource: 'permissions', action: 'write' },
      { name: 'manage_sources', description: 'Manage news sources', resource: 'news_sources', action: 'write' }
    ];

    for (const perm of permissions) {
      await connection.execute(
        `INSERT IGNORE INTO permissions (name, description, resource, action) VALUES (?, ?, ?, ?)`,
        [perm.name, perm.description, perm.resource, perm.action]
      );
    }

    // Assign all permissions to admin role
    await connection.execute(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
    `);

    // Assign basic permissions to user role
    await connection.execute(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p 
      WHERE r.name = 'user' AND p.name IN ('view_news', 'view_topics', 'manage_subscriptions')
    `);

    // Insert default admin user (password: admin123)
    await connection.execute(`
      INSERT IGNORE INTO users (username, password, email, nickname, role_id, is_active)
      VALUES ('admin', '$2b$10$d6e6a0b7a1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6', 'admin@example.com', 'Admin', 1, 1)
    `);

    // Insert default news sources
    const newsSources = [
      // Baidu news
      { name: '百度新闻', url: 'https://top.baidu.com/board?tab=realtime', type: 'website', parser_config: '{"type":"baidu"}', is_active: 1, crawl_interval: 60 },
      // 36kr news
      { name: '36氪', url: 'https://www.36kr.com/newsflashes', type: 'website', parser_config: '{"type":"36kr", "baseUrl":"https://www.36kr.com"}', is_active: 1, crawl_interval: 60 },
      // Weibo hot search
      { name: '微博热搜', url: 'https://s.weibo.com/top/summary?cate=realtimehot', type: 'website', parser_config: '{"type":"weibo", "baseUrl":"https://s.weibo.com"}', is_active: 1, crawl_interval: 60 },
      // Toutiao trending
      { name: '今日头条', url: 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', type: 'api', parser_config: '{"type":"toutiao"}', is_active: 1, crawl_interval: 60 },
      // Ifeng news
      { name: '凤凰新闻', url: 'https://www.ifeng.com/', type: 'website', parser_config: '{"type":"ifeng"}', is_active: 1, crawl_interval: 60 },
      // The Paper news
      { name: '澎湃新闻', url: 'https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar', type: 'api', parser_config: '{"type":"thepaper"}', is_active: 1, crawl_interval: 60 },
      // Wallstreetcn news
      { name: '华尔街见闻', url: 'https://wallstreetcn.com/rss/news', type: 'rss', parser_config: '{"baseUrl":"https://wallstreetcn.com"}', is_active: 1, crawl_interval: 60 },
      // Xueqiu news
      { name: '雪球财经', url: 'https://xueqiu.com/statuses/hot/list_v2.json?since_id=-1&max_id=-1&size=100', type: 'api', parser_config: '{"type":"xueqiu", "dataPath":"list", "title":"title", "link":"target", "summary":"description"}', is_active: 1, crawl_interval: 60 },
      // Zaobao news
      { name: '联合早报', url: 'https://www.zaobao.com/realtime/china', type: 'website', parser_config: '{"type":"zaobao", "selector":".news-list__item", "title":".news-list__title", "link":".news-list__title a", "summary":".news-list__text", "baseUrl":"https://www.zaobao.com"}', is_active: 1, crawl_interval: 60 },
      // Zhihu hot topics
      { name: '知乎热点', url: 'https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=20&desktop=true', type: 'api', parser_config: '{"type":"zhihu"}', is_active: 1, crawl_interval: 60 },
      // Cankaoxiaoxi news
      { name: '参考消息', url: 'http://www.cankaoxiaoxi.com/china', type: 'website', parser_config: '{"type":"cankaoxiaoxi", "baseUrl":"http://www.cankaoxiaoxi.com"}', is_active: 1, crawl_interval: 60 },
      // Gelonghui news
      { name: '格隆汇', url: 'https://www.gelonghui.com/api/mainsite/hotnews', type: 'api', parser_config: '{"type":"gelonghui", "dataPath":"data", "title":"title", "link":"url", "summary":"digest"}', is_active: 1, crawl_interval: 60 },
      // Freebuf news
      { name: 'Freebuf', url: 'https://www.freebuf.com/', type: 'website', parser_config: '{"type":"freebuf", "selector":".news-item", "title":".news-title", "link":".news-title a", "summary":".news-info", "baseUrl":"https://www.freebuf.com"}', is_active: 1, crawl_interval: 60 },
      // Jin10 news
      { name: '金十数据', url: 'https://api.jin10.com/realtime', type: 'api', parser_config: '{"type":"jin10", "dataPath":"data", "title":"title", "link":"url", "summary":"content"}', is_active: 1, crawl_interval: 60 },
      // Ithome news
      { name: 'IT之家', url: 'https://www.ithome.com/rss/', type: 'rss', parser_config: '{"baseUrl":"https://www.ithome.com"}', is_active: 1, crawl_interval: 60 },
      // Mktnews
      { name: '市场资讯', url: 'https://www.mktnews.cn/rss', type: 'rss', parser_config: '{"baseUrl":"https://www.mktnews.cn"}', is_active: 1, crawl_interval: 60 },
      // Hupu sports news
      { name: '虎扑体育', url: 'https://bbs.hupu.com/', type: 'website', parser_config: '{"type":"hupu", "baseUrl":"https://bbs.hupu.com"}', is_active: 1, crawl_interval: 60 },
      // Juejin tech news
      { name: '掘金', url: 'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed?aid=2608&uuid=7190800040532562&spider=0&target=https%3A%2F%2Fjuejin.cn%2F', type: 'api', parser_config: '{"type":"juejin"}', is_active: 1, crawl_interval: 60 },
      // Solidot tech news
      { name: 'Solidot', url: 'https://www.solidot.org/', type: 'website', parser_config: '{"type":"solidot", "baseUrl":"https://www.solidot.org"}', is_active: 1, crawl_interval: 60 },
      // Smzdm deals news
      { name: '什么值得买', url: 'https://www.smzdm.com/', type: 'website', parser_config: '{"type":"smzdm", "baseUrl":"https://www.smzdm.com"}', is_active: 1, crawl_interval: 60 },
      // Sspai tech news
      { name: '少数派', url: 'https://sspai.com/feed', type: 'rss', parser_config: '{"baseUrl":"https://sspai.com"}', is_active: 1, crawl_interval: 60 },
      // Tencent news
      { name: '腾讯新闻', url: 'https://news.qq.com/', type: 'website', parser_config: '{"type":"generic", "selector":".list_item", "title":".item_inner h3 a", "link":".item_inner h3 a", "baseUrl":"https://news.qq.com"}', is_active: 1, crawl_interval: 60 },
      // Sputniknews cn
      { name: '俄罗斯卫星通讯社', url: 'https://sputniknews.cn/rss/china.xml', type: 'rss', parser_config: '{"baseUrl":"https://sputniknews.cn"}', is_active: 1, crawl_interval: 60 },
      // PCbeta tech news
      { name: '电脑之家', url: 'https://www.pcbeta.com/rss.xml', type: 'rss', parser_config: '{"baseUrl":"https://www.pcbeta.com"}', is_active: 1, crawl_interval: 60 },
      // Kaopu finance news
      { name: '靠谱', url: 'https://www.kaopu.cn/rss', type: 'rss', parser_config: '{"baseUrl":"https://www.kaopu.cn"}', is_active: 1, crawl_interval: 60 },
      // Douban hot topics
      { name: '豆瓣热点', url: 'https://www.douban.com/', type: 'website', parser_config: '{"type":"generic", "selector":".hot-items .hot-item", "title":".title a", "link":".title a", "baseUrl":"https://www.douban.com"}', is_active: 1, crawl_interval: 60 }
    ];

    // Insert all news sources
    for (const source of newsSources) {
      await connection.execute(`
        INSERT IGNORE INTO news_sources (name, url, type, parser_config, is_active, crawl_interval)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [source.name, source.url, source.type, source.parser_config, source.is_active, source.crawl_interval]);
    }

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Export the pool and init function
module.exports = {
  pool,
  initDatabase
};