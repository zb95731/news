const cron = require('node-cron');
const crawler = require('./crawler');

class CronManager {
  constructor() {
    this.jobs = {};
  }

  // Initialize all cron jobs
  init() {
    console.log('Initializing cron jobs...');
    
    // Main crawl job - runs every 1 minute
    this.jobs.mainCrawl = cron.schedule('* * * * *', async () => {
      console.log('Running scheduled crawl job...');
      await crawler.crawl();
    });
    
    // Test crawl job - runs every hour
    // this.jobs.testCrawl = cron.schedule('0 * * * *', async () => {
    //   console.log('Running test crawl job...');
    //   await crawler.crawl();
    // });
    
    console.log('Cron jobs initialized successfully.');
  }

  // Start all cron jobs
  start() {
    console.log('Starting all cron jobs...');
    
    for (const jobName in this.jobs) {
      this.jobs[jobName].start();
      console.log(`Started job: ${jobName}`);
    }
  }

  // Stop all cron jobs
  stop() {
    console.log('Stopping all cron jobs...');
    
    for (const jobName in this.jobs) {
      this.jobs[jobName].stop();
      console.log(`Stopped job: ${jobName}`);
    }
  }

  // Run a specific job immediately
  runJob(jobName) {
    if (this.jobs[jobName]) {
      console.log(`Running job immediately: ${jobName}`);
      this.jobs[jobName].run();
    } else {
      console.error(`Job not found: ${jobName}`);
    }
  }

  // Add a new job
  addJob(name, schedule, callback) {
    if (!this.jobs[name]) {
      this.jobs[name] = cron.schedule(schedule, callback);
      console.log(`Added new job: ${name} with schedule: ${schedule}`);
      return true;
    }
    
    console.error(`Job already exists: ${name}`);
    return false;
  }

  // Remove a job
  removeJob(name) {
    if (this.jobs[name]) {
      this.jobs[name].stop();
      delete this.jobs[name];
      console.log(`Removed job: ${name}`);
      return true;
    }
    
    console.error(`Job not found: ${name}`);
    return false;
  }
}

module.exports = new CronManager();
