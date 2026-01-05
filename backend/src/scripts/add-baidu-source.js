const { pool } = require('../db');

async function addBaiduNewsSource() {
  try {
    console.log('Adding Baidu news source...');
    
    // Check if Baidu news source already exists
    const checkSql = 'SELECT id FROM news_sources WHERE name = ?';
    const [existing] = await pool.execute(checkSql, ['百度新闻']);
    
    if (existing.length > 0) {
      console.log('Baidu news source already exists.');
      return;
    }
    
    // Insert Baidu news source
    const insertSql = `
      INSERT INTO news_sources (name, url, type, parser_config, is_active, crawl_interval)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(insertSql, [
      '百度新闻',
      'https://top.baidu.com/board?tab=realtime',
      'website',
      JSON.stringify({
        type: 'baidu',
        baseUrl: 'https://top.baidu.com'
      }),
      true,
      300 // 5 minutes
    ]);
    
    console.log(`Successfully added Baidu news source with ID: ${result.insertId}`);
    
    // Start a crawl immediately
    const crawler = require('../crawler/crawler');
    console.log('Running initial crawl for Baidu news...');
    await crawler.crawl();
    console.log('Initial crawl completed.');
    
  } catch (error) {
    console.error('Error adding Baidu news source:', error.message);
    console.error(error.stack);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
addBaiduNewsSource();