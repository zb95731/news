const axios = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../db');

class Crawler {
  constructor() {
    this.running = false;
  }

  async crawl() {
    if (this.running) {
      console.log('Crawler is already running, skipping...');
      return;
    }
    
    this.running = true;
    console.log('Starting crawl process...');

    try {
      // Get all active news sources
      const sources = await this.getAllActiveSources();
      
      for (const source of sources) {
        await this.crawlSource(source);
      }
      
      console.log('Crawl process completed successfully.');
    } catch (error) {
      console.error('Crawl process failed:', error.message);
      console.error(error.stack);
    } finally {
      this.running = false;
    }
  }

  async getAllActiveSources() {
    const sql = 'SELECT * FROM news_sources WHERE is_active = 1';
    const [rows] = await pool.execute(sql);
    return rows;
  }

  async crawlSource(source) {
    console.log(`Crawling source: ${source.name} (${source.url})`);
    
    try {
      let newsItems = [];
      
      // Fetch data based on source type
      const response = await axios.get(source.url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const { data } = response;
      
      // Parse data based on source type
      switch (source.type) {
        case 'website':
          newsItems = this.parseWebsite(data, source.parser_config);
          break;
        case 'api':
          newsItems = this.parseAPI(data, source.parser_config);
          break;
        case 'rss':
          newsItems = this.parseRSS(data, source.parser_config);
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      // Save news items to database
      for (const newsItem of newsItems) {
        await this.saveNewsItem(newsItem, source.id);
      }

      // Update last crawled time
      await this.updateLastCrawledTime(source.id);
      
      console.log(`Successfully crawled ${newsItems.length} news items from ${source.name}`);
    } catch (error) {
      console.error(`Failed to crawl source ${source.name}:`, error.message);
    }
  }

  parseWebsite(html, parserConfig) {
    // Check if parserConfig is already an object (MySQL 8 returns JSON as objects)
    const config = typeof parserConfig === 'string' ? JSON.parse(parserConfig) : parserConfig;
    
    // Special handling for different news sources
    switch (config.type) {
      case 'baidu':
        return this.parseBaiduNews(html, config);
      case '36kr':
        return this.parse36krNews(html, config);
      case 'weibo':
        return this.parseWeiboNews(html, config);
      case 'toutiao':
        return this.parseToutiaoNews(html, config);
      case 'ifeng':
        return this.parseIfengNews(html, config);
      case 'thepaper':
        return this.parseThePaperNews(html, config);
      case 'zhihu':
        return this.parseZhihuNews(html, config);
      case 'cankaoxiaoxi':
        return this.parseCankaoxiaoxiNews(html, config);
      case 'hupu':
        return this.parseHupuNews(html, config);
      case 'ithome':
        return this.parseIthomeNews(html, config);
      case 'juejin':
        return this.parseJuejinNews(html, config);
      case 'solidot':
        return this.parseSolidotNews(html, config);
      case 'smzdm':
        return this.parseSmzdmNews(html, config);
      case 'wallstreetcn':
        return this.parseWallstreetcnNews(html, config);
      default:
        return this.parseGenericWebsite(html, config);
    }
  }

  parseGenericWebsite(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Use selector from config to find news items
    $(config.selector).each((index, element) => {
      // Limit to top 20 news items
      if (newsList.length >= 20) {
        return false; // Break the loop
      }
      
      const $element = $(element);
      
      // Extract title, link, summary, and other fields based on config
      const title = $element.find(config.title).text().trim();
      const link = this.resolveUrl($element.find(config.link).attr('href'), config.baseUrl);
      const summary = config.summary ? $element.find(config.summary).text().trim() : '';
      const publishedAt = config.publishedAt ? new Date($element.find(config.publishedAt).text().trim()) : new Date();
      const hotness = config.hotness ? parseInt($element.find(config.hotness).text().trim()) || 0 : 0;
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (title && link) {
        newsList.push({
          title,
          link,
          summary,
          published_at: publishedAt,
          hotness
        });
      }
    });
    
    return newsList;
  }

  // 36kr news parser
  parse36krNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse 36kr quick news
    const $items = $('.newsflash-item');
    $items.each((_, el) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $el = $(el);
      const $a = $el.find('a.item-title');
      const url = $a.attr('href');
      const title = $a.text();
      const time = $el.find('.time').text();
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (url && title) {
        newsList.push({
          title,
          link: `${config.baseUrl}${url}`,
          summary: '',
          published_at: new Date(),
          hotness: 0
        });
      }
    });
    
    return newsList;
  }

  // Weibo news parser
  parseWeiboNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse Weibo hot search
    const rows = $('#pl_top_realtimehot table tbody tr').slice(1);
    rows.each((_, row) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $row = $(row);
      const $link = $row.find('td.td-02 a').filter((_, el) => {
        const href = $(el).attr('href');
        return !!(href && !href.includes('javascript:void(0);'));
      }).first();
      
      if ($link.length) {
        const title = $link.text().trim();
        const href = $link.attr('href');
        
        // Skip non-news content
        if (this.isNonNewsContent(title)) {
          return;
        }
        
        if (title && href) {
          newsList.push({
            title,
            link: `${config.baseUrl}${href}`,
            summary: '',
            published_at: new Date(),
            hotness: 0
          });
        }
      }
    });
    
    return newsList;
  }

  // Toutiao news parser
  parseToutiaoNews(html, config) {
    const newsList = [];
    try {
      // Parse JSON from API response
      const data = typeof html === 'string' ? JSON.parse(html) : html;
      const items = data.data || [];
      
      items.forEach((item, index) => {
        if (newsList.length >= 20) {
          return;
        }
        
        const title = item.Title;
        const url = `https://www.toutiao.com/trending/${item.ClusterIdStr}/`;
        
        // Skip non-news content
        if (this.isNonNewsContent(title)) {
          return;
        }
        
        if (title && url) {
          newsList.push({
            title,
            link: url,
            summary: '',
            published_at: new Date(),
            hotness: parseInt(item.HotValue) || 0
          });
        }
      });
    } catch (error) {
      console.error('Error parsing Toutiao news:', error.message);
    }
    
    return newsList;
  }

  // Ifeng news parser
  parseIfengNews(html, config) {
    const newsList = [];
    try {
      // Extract JSON from HTML using regex
      const regex = /var\s+allData\s*=\s*(\{[\s\S]*?\});/;
      const match = regex.exec(html);
      if (match) {
        const realData = JSON.parse(match[1]);
        const rawNews = realData.hotNews1 || [];
        
        rawNews.forEach((hotNews, index) => {
          if (newsList.length >= 20) {
            return;
          }
          
          const title = hotNews.title;
          const url = hotNews.url;
          
          // Skip non-news content
          if (this.isNonNewsContent(title)) {
            return;
          }
          
          if (title && url) {
            newsList.push({
              title,
              link: url,
              summary: '',
              published_at: new Date(),
              hotness: 0
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing Ifeng news:', error.message);
    }
    
    return newsList;
  }

  // The Paper news parser
  parseThePaperNews(html, config) {
    const newsList = [];
    try {
      // Parse JSON from API response
      const data = typeof html === 'string' ? JSON.parse(html) : html;
      const hotNews = data.data?.hotNews || [];
      
      hotNews.forEach((item, index) => {
        if (newsList.length >= 20) {
          return;
        }
        
        const title = item.name;
        const url = `https://www.thepaper.cn/newsDetail_forward_${item.contId}`;
        
        // Skip non-news content
        if (this.isNonNewsContent(title)) {
          return;
        }
        
        if (title && url) {
          newsList.push({
            title,
            link: url,
            summary: '',
            published_at: new Date(),
            hotness: 0
          });
        }
      });
    } catch (error) {
      console.error('Error parsing The Paper news:', error.message);
    }
    
    return newsList;
  }

  // Zhihu news parser
  parseZhihuNews(html, config) {
    const newsList = [];
    try {
      // Parse JSON data from API response
      const data = typeof html === 'string' ? JSON.parse(html) : html;
      const items = data.data || [];
      
      items.forEach((item) => {
        if (newsList.length >= 20) {
          return;
        }
        
        const title = item.target.title_area.text;
        const url = item.target.link.url;
        
        // Skip non-news content
        if (this.isNonNewsContent(title)) {
          return;
        }
        
        if (title && url) {
          newsList.push({
            title,
            link: url,
            summary: item.target.excerpt_area.text || '',
            published_at: new Date(),
            hotness: 0
          });
        }
      });
    } catch (error) {
      console.error('Error parsing Zhihu news:', error.message);
    }
    
    return newsList;
  }

  // Cankaoxiaoxi news parser
  parseCankaoxiaoxiNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse Cankaoxiaoxi news
    const $items = $('.con');
    $items.each((_, el) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $el = $(el);
      const $a = $el.find('a');
      const url = $a.attr('href');
      const title = $a.text();
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (url && title) {
        newsList.push({
          title,
          link: url.startsWith('http') ? url : `${config.baseUrl}${url}`,
          summary: '',
          published_at: new Date(),
          hotness: 0
        });
      }
    });
    
    return newsList;
  }

  // Hupu news parser
  parseHupuNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse Hupu news
    const $items = $('.list-item');
    $items.each((_, el) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $el = $(el);
      const $a = $el.find('.title-link');
      const url = $a.attr('href');
      const title = $a.text();
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (url && title) {
        newsList.push({
          title,
          link: url.startsWith('http') ? url : `${config.baseUrl}${url}`,
          summary: '',
          published_at: new Date(),
          hotness: 0
        });
      }
    });
    
    return newsList;
  }

  // IT Home news parser
  parseIthomeNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse IT Home news
    const $items = $('.new-list .new-list-item');
    $items.each((_, el) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $el = $(el);
      const $a = $el.find('h2 a');
      const url = $a.attr('href');
      const title = $a.text();
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (url && title) {
        newsList.push({
          title,
          link: url.startsWith('http') ? url : `${config.baseUrl}${url}`,
          summary: '',
          published_at: new Date(),
          hotness: 0
        });
      }
    });
    
    return newsList;
  }

  // Juejin news parser
  parseJuejinNews(html, config) {
    const newsList = [];
    try {
      // Parse JSON data from API response
      const data = typeof html === 'string' ? JSON.parse(html) : html;
      const items = data.d?.entrylist || [];
      
      items.forEach((item) => {
        if (newsList.length >= 20) {
          return;
        }
        
        const title = item.title;
        const url = `https://juejin.cn/post/${item.entry_id}`;
        
        // Skip non-news content
        if (this.isNonNewsContent(title)) {
          return;
        }
        
        if (title && url) {
          newsList.push({
            title,
            link: url,
            summary: item.brief_content || '',
            published_at: new Date(),
            hotness: item.view_count || 0
          });
        }
      });
    } catch (error) {
      console.error('Error parsing Juejin news:', error.message);
    }
    
    return newsList;
  }

  // Solidot news parser
  parseSolidotNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse Solidot news
    const $items = $('.block_m .ct_t_01');
    $items.each((_, el) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $el = $(el);
      const $a = $el.find('a');
      const url = $a.attr('href');
      const title = $a.text();
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (url && title) {
        newsList.push({
          title,
          link: url.startsWith('http') ? url : `${config.baseUrl}${url}`,
          summary: '',
          published_at: new Date(),
          hotness: 0
        });
      }
    });
    
    return newsList;
  }

  // Smzdm news parser
  parseSmzdmNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse Smzdm news
    const $items = $('.feed-row-wide');
    $items.each((_, el) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $el = $(el);
      const $a = $el.find('.feed-block-title a');
      const url = $a.attr('href');
      const title = $a.text();
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (url && title) {
        newsList.push({
          title,
          link: url.startsWith('http') ? url : `${config.baseUrl}${url}`,
          summary: '',
          published_at: new Date(),
          hotness: 0
        });
      }
    });
    
    return newsList;
  }

  // Wallstreetcn news parser
  parseWallstreetcnNews(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // Parse Wallstreetcn news
    const $items = $('.news-item');
    $items.each((_, el) => {
      if (newsList.length >= 20) {
        return false;
      }
      
      const $el = $(el);
      const $a = $el.find('a');
      const url = $a.attr('href');
      const title = $a.text();
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (url && title) {
        newsList.push({
          title,
          link: url.startsWith('http') ? url : `${config.baseUrl}${url}`,
          summary: '',
          published_at: new Date(),
          hotness: 0
        });
      }
    });
    
    return newsList;
  }

  // Check if content is non-news content that should be excluded
  isNonNewsContent(title) {
    const nonNewsKeywords = [
      '腾讯视频', '爱奇艺', '优酷', '芒果TV', 'B站', '哔哩哔哩',
      '牛客', 'GitHub', 'Stream', 'steam', '游戏', '电竞', '演唱会',
      '综艺', '电视剧', '电影', '动漫', '明星', '网红'
    ];
    
    const lowerTitle = title.toLowerCase();
    return nonNewsKeywords.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
  }

  // Special parser for Baidu news
  parseBaiduNews(html, config) {
    // config is already a parsed object, no need to JSON.parse again
    const newsList = [];
    
    try {
      // Extract JSON data from HTML comment
      const jsonMatch = html.match(/<!--s-data:(.*?)-->/s);
      if (!jsonMatch || !jsonMatch[1]) {
        console.error('Failed to extract JSON data from Baidu news page');
        return newsList;
      }
      
      const data = JSON.parse(jsonMatch[1]);
      const content = data.data.cards[0].content;
      
      // Process each news item, filter non-top and limit to 20
      const filteredContent = content.filter(item => !item.isTop);
      
      filteredContent.forEach(item => {
        // Limit to top 20 news items
        if (newsList.length >= 20) {
          return;
        }
        
        const title = item.word;
        
        // Skip non-news content
        if (this.isNonNewsContent(title)) {
          return;
        }
        
        newsList.push({
          title: title,
          link: item.rawUrl,
          summary: item.desc || '',
          published_at: new Date(),
          hotness: 0 // Baidu doesn't provide hotness data
        });
      });
    } catch (error) {
      console.error('Error parsing Baidu news:', error.message);
    }
    
    return newsList;
  }

  parseAPI(data, parserConfig) {
    // Check if parserConfig is already an object (MySQL 8 returns JSON as objects)
    const config = typeof parserConfig === 'string' ? JSON.parse(parserConfig) : parserConfig;
    
    // Extract items array from data based on dataPath
    let items = data;
    if (config.dataPath) {
      items = this.getNestedValue(data, config.dataPath);
    }
    
    // Map items to news format, limit to 20 items, and filter non-news content
    const newsList = [];
    
    for (const item of items) {
      // Limit to top 20 news items
      if (newsList.length >= 20) {
        break;
      }
      
      const title = this.getNestedValue(item, config.title);
      const link = this.resolveUrl(this.getNestedValue(item, config.link), config.baseUrl);
      const summary = this.getNestedValue(item, config.summary) || '';
      const publishedAt = this.getNestedValue(item, config.publishedAt) ? new Date(this.getNestedValue(item, config.publishedAt)) : new Date();
      const hotness = this.getNestedValue(item, config.hotness) || 0;
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        continue;
      }
      
      if (title && link) {
        newsList.push({
          title,
          link,
          summary,
          published_at: publishedAt,
          hotness
        });
      }
    }
    
    return newsList;
  }

  parseRSS(xml, parserConfig) {
    // Check if parserConfig is already an object (MySQL 8 returns JSON as objects)
    const config = typeof parserConfig === 'string' ? JSON.parse(parserConfig) : parserConfig;
    const $ = cheerio.load(xml, { xmlMode: true });
    const newsList = [];
    
    // Parse RSS feed items, limit to 20 items
    $('item').each((index, element) => {
      // Limit to top 20 news items
      if (newsList.length >= 20) {
        return false; // Break the loop
      }
      
      const $element = $(element);
      
      const title = $element.find('title').text().trim();
      const link = this.resolveUrl($element.find('link').text().trim(), config.baseUrl);
      const summary = $element.find('description').text().trim() || '';
      const publishedAt = new Date($element.find('pubDate').text().trim());
      const hotness = 0; // RSS feeds typically don't have hotness data
      
      // Skip non-news content
      if (this.isNonNewsContent(title)) {
        return;
      }
      
      if (title && link) {
        newsList.push({
          title,
          link,
          summary,
          published_at: publishedAt,
          hotness
        });
      }
    });
    
    return newsList;
  }

  getNestedValue(obj, path) {
    if (!path) return obj;
    
    return path.split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) {
        return undefined;
      }
      return acc[key];
    }, obj);
  }

  resolveUrl(link, baseUrl) {
    if (!link) return '';
    
    // If link is already absolute, return it as is
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    
    // If baseUrl is provided, resolve relative link against it
    if (baseUrl) {
      return new URL(link, baseUrl).href;
    }
    
    // Otherwise return the link as is
    return link;
  }

  async saveNewsItem(newsItem, sourceId) {
    // Check if news item already exists by link
    const checkSql = 'SELECT id FROM news WHERE link = ?';
    const [rows] = await pool.execute(checkSql, [newsItem.link]);
    
    // Remove images from summary
    const summaryWithoutImages = newsItem.summary.replace(/<img[^>]*>/g, '');
    
    // If news item already exists, update it
    if (rows.length > 0) {
      const updateSql = `
        UPDATE news 
        SET title = ?, summary = ?, hotness = ?, source_id = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await pool.execute(updateSql, [
        newsItem.title,
        summaryWithoutImages,
        newsItem.hotness,
        sourceId,
        newsItem.published_at,
        rows[0].id
      ]);
      return rows[0].id;
    } else {
      // Otherwise, insert new news item
      const insertSql = `
        INSERT INTO news (title, link, summary, hotness, source_id, published_at, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;
      const [result] = await pool.execute(insertSql, [
        newsItem.title,
        newsItem.link,
        summaryWithoutImages,
        newsItem.hotness,
        sourceId,
        newsItem.published_at
      ]);
      return result.insertId;
    }
  }

  async updateLastCrawledTime(sourceId) {
    const sql = 'UPDATE news_sources SET last_crawled_at = CURRENT_TIMESTAMP WHERE id = ?';
    await pool.execute(sql, [sourceId]);
  }
}

module.exports = new Crawler();
