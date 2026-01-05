const { pool } = require('../db');

async function checkNewsStatus() {
  try {
    // Count news by status
    const [statusCount] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM news GROUP BY status'
    );
    console.log('News count by status:');
    statusCount.forEach(row => {
      console.log(`${row.status}: ${row.count} news items`);
    });

    // Get total news count
    const [totalCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM news'
    );
    console.log(`\nTotal news in database: ${totalCount[0].total}`);

    // Get sample news items with their status
    const [sampleNews] = await pool.execute(
      'SELECT id, title, status, created_at FROM news ORDER BY created_at DESC LIMIT 10'
    );
    console.log('\nLatest 10 news items:');
    sampleNews.forEach(news => {
      console.log(`${news.id}: ${news.title} (${news.status}) - ${news.created_at}`);
    });

    // Check if news_topics is populated
    const [topicsCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM news_topics'
    );
    console.log(`\nNews-topics relationships: ${topicsCount[0].total}`);

    // Check the current frontend endpoint response
    const [frontendResponse] = await pool.execute(
      `SELECT news.*, GROUP_CONCAT(topics.name) as topics
       FROM news
       LEFT JOIN news_topics ON news.id = news_topics.news_id
       LEFT JOIN topics ON news_topics.topic_id = topics.id
       GROUP BY news.id
       ORDER BY news.created_at DESC
       LIMIT 5`
    );
    console.log('\nSample frontend API response:');
    frontendResponse.forEach(news => {
      console.log(`${news.id}: ${news.title} - Topics: ${news.topics || 'None'}`);
    });

  } catch (error) {
    console.error('Error checking news status:', error.message);
  } finally {
    await pool.end();
  }
}

checkNewsStatus();
