const { pool } = require('../db');
const crawler = require('../crawler/crawler');

async function testBaiduCrawl() {
  try {
    console.log('Testing Baidu news crawl...');
    
    // Get the Baidu news source
    const [sources] = await pool.execute('SELECT * FROM news_sources WHERE name = ?', ['百度新闻']);
    
    if (sources.length === 0) {
      console.error('Baidu news source not found');
      return;
    }
    
    const source = sources[0];
    console.log(`Found Baidu news source: ${source.name}`);
    
    // Add a special method to test just this source
    const testCrawl = async (source) => {
      console.log(`Testing crawl for source: ${source.name} (${source.url})`);
      
      try {
        const axios = require('axios');
        
        // Fetch data based on source type
        const response = await axios.get(source.url, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const { data } = response;
        console.log('Successfully fetched data');
        
        // Parse data based on source type
        let newsItems = [];
        switch (source.type) {
          case 'website':
            // Special handling for Baidu news
            // parser_config is already a parsed object in MySQL 8.0
            const config = source.parser_config;
            if (config.type === 'baidu') {
              // Extract JSON data from HTML comment
              const jsonMatch = data.match(/<!--s-data:(.*?)-->/s);
              if (jsonMatch && jsonMatch[1]) {
                const parsedData = JSON.parse(jsonMatch[1]);
                const content = parsedData.data.cards[0].content;
                
                // Process each news item
                newsItems = content.filter(item => !item.isTop).map(item => ({
                  title: item.word,
                  link: item.rawUrl,
                  summary: item.desc || '',
                  published_at: new Date(),
                  hotness: 0
                }));
              } else {
                console.error('Failed to extract JSON data from Baidu news page');
              }
            } else {
              console.error('Not a Baidu news source');
            }
            break;
          default:
            console.error(`Unsupported source type: ${source.type}`);
        }
        
        console.log(`Parsed ${newsItems.length} news items`);
        
        // Save news items to database
        for (const newsItem of newsItems) {
          console.log(`Saving news: ${newsItem.title}`);
          
          // Check if news item already exists by link
          const checkSql = 'SELECT id FROM news WHERE link = ?';
          const [existing] = await pool.execute(checkSql, [newsItem.link]);
          
          if (existing.length > 0) {
            console.log(`News already exists: ${newsItem.title}`);
          } else {
            // Insert new news item
            const insertSql = `
              INSERT INTO news (title, link, summary, hotness, source_id, published_at, status)
              VALUES (?, ?, ?, ?, ?, ?, 'pending')
            `;
            await pool.execute(insertSql, [
              newsItem.title,
              newsItem.link,
              newsItem.summary,
              newsItem.hotness,
              source.id,
              newsItem.published_at
            ]);
            console.log(`Saved news: ${newsItem.title}`);
          }
        }
        
        console.log('Test crawl completed successfully');
        
      } catch (error) {
        console.error('Error during test crawl:', error.message);
        console.error(error.stack);
      }
    };
    
    await testCrawl(source);
    
    // Count the number of news items in the database
    const [newsCount] = await pool.execute('SELECT COUNT(*) as count FROM news');
    console.log(`Total news items in database: ${newsCount[0].count}`);
    
    // Get the latest news items
    const [latestNews] = await pool.execute('SELECT title, link FROM news ORDER BY created_at DESC LIMIT 5');
    console.log('Latest news items:');
    latestNews.forEach(news => {
      console.log(`- ${news.title}: ${news.link}`);
    });
    
  } catch (error) {
    console.error('Error during test:', error.message);
    console.error(error.stack);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the test
testBaiduCrawl();