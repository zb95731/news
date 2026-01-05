# 新闻管理和订阅推送系统MVP实现计划

## 1. 系统概述

本系统是一个基于 Node.js 和 React 开发的新闻管理和订阅推送系统，专注于核心功能，采用简化的技术栈，方便部署和使用。系统支持新闻的自动抓取、手动管理、个性化订阅和微信推送，同时提供完善的用户认证和权限管理功能。

## 2. 技术栈选择

### 2.1 后端技术栈
- **编程语言**: Node.js 18
- **Web框架**: Express 4.18
- **数据库**: MySQL 8.0（或 SQLite 3.44，用于本地开发）
- **ORM框架**: Sequelize 6.35
- **认证授权**: JWT 2.0
- **日志**: Winston 3.11
- **爬虫**: Axios 1.6 + Cheerio 1.0
- **微信API**: Wechat-API 1.56
- **配置管理**: dotenv 16.4

### 2.2 前端技术栈
- **框架**: React 18 + TypeScript 5.3
- **构建工具**: Vite 5.0
- **UI组件库**: Ant Design 5.12
- **状态管理**: Zustand 4.5
- **路由**: React Router 6.21
- **HTTP客户端**: Axios 1.6
- **样式**: Ant Design 内置样式

### 2.3 部署工具
- **容器化**: Docker 24 + Docker Compose 2.24
- **CI/CD**: GitHub Actions（可选，用于自动构建）

## 3. 系统架构设计

### 3.1 系统架构图

```
┌─────────────────────────────────────────────────┐
│                   客户端层                      │
├────────────┬─────────────────────────────────────┤
│  浏览器    │  微信公众号                          │
└────────────┴─────────────────────────────────────┘
                            │  HTTPS
┌─────────────────────────────────────────────────┐
│                   应用层                        │
├────────────┬────────────┬────────────┬───────────┤
│  认证服务   │  新闻服务   │  订阅服务   │  推送服务 │
└────────────┴────────────┴────────────┴───────────┘
                            │
┌─────────────────────────────────────────────────┐
│                   数据层                        │
├────────────┬─────────────────────────────────────┤
│  MySQL     │  文件存储（本地文件系统）           │
└────────────┴─────────────────────────────────────┘
```

### 3.2 核心模块设计

#### 3.2.1 新闻抓取模块

- **单进程爬虫**: 基于 Node.js 的单进程爬虫，支持定时抓取
- **多源支持**: 支持网站、API、RSS 等多种数据源
- **配置驱动**: 基于配置的爬虫，便于扩展
- **去重机制**: 基于 URL 的去重
- **错误处理**: 完善的错误处理和重试机制

#### 3.2.2 新闻管理模块

- **新闻列表**: 支持分页、筛选、排序
- **新闻详情**: 支持查看、编辑、删除
- **新闻审核**: 支持待审核、已发布、已拒绝等状态
- **标签管理**: 支持手动添加标签

#### 3.2.3 订阅与推送模块

- **主题管理**: 支持创建、编辑、删除主题
- **订阅管理**: 支持用户订阅主题
- **推送管理**: 支持微信公众号推送
- **推送模板**: 支持自定义推送模板

#### 3.2.4 权限管理模块

- **RBAC 模型**: 基于角色的访问控制
- **用户管理**: 支持用户注册、登录、修改密码
- **角色管理**: 支持创建、编辑、删除角色
- **权限管理**: 支持分配角色权限

## 4. 数据库设计

### 4.1 核心表结构

#### 4.1.1 用户与权限相关表

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `email` VARCHAR(100) UNIQUE COMMENT '邮箱',
  `phone` VARCHAR(20) UNIQUE COMMENT '手机号',
  `nickname` VARCHAR(50) COMMENT '昵称',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `role_id` INT COMMENT '角色ID',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  `last_login_at` DATETIME COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
  `description` TEXT COMMENT '角色描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 权限表
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '权限名称',
  `description` TEXT COMMENT '权限描述',
  `resource` VARCHAR(50) NOT NULL COMMENT '资源名称',
  `action` VARCHAR(20) NOT NULL COMMENT '操作类型',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT NOT NULL COMMENT '角色ID',
  `permission_id` INT NOT NULL COMMENT '权限ID',
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
);
```

#### 4.1.2 新闻与标签相关表

```sql
-- 新闻源表
CREATE TABLE IF NOT EXISTS `news_sources` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '新闻源ID',
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT '新闻源名称',
  `url` VARCHAR(255) NOT NULL COMMENT '新闻源URL',
  `type` VARCHAR(20) NOT NULL COMMENT '新闻源类型: website, api, rss',
  `parser_config` JSON COMMENT '爬虫解析配置',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  `crawl_interval` INT DEFAULT 300 COMMENT '抓取间隔（秒）',
  `last_crawled_at` DATETIME COMMENT '最后抓取时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 新闻表
CREATE TABLE IF NOT EXISTS `news` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '新闻ID',
  `title` VARCHAR(255) NOT NULL COMMENT '新闻标题',
  `link` VARCHAR(255) NOT NULL UNIQUE COMMENT '新闻链接',
  `summary` TEXT COMMENT '新闻摘要',
  `content` LONGTEXT COMMENT '新闻内容',
  `hotness` INT DEFAULT 0 COMMENT '新闻热度',
  `source_id` INT COMMENT '新闻源ID',
  `published_at` DATETIME COMMENT '新闻发布时间',
  `crawled_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '抓取时间',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '新闻状态: pending, published, rejected',
  `metadata` JSON COMMENT '额外元数据',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 标签表
CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
  `parent_id` INT COMMENT '父标签ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 新闻标签关联表
CREATE TABLE IF NOT EXISTS `news_tags` (
  `news_id` INT NOT NULL COMMENT '新闻ID',
  `tag_id` INT NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`news_id`, `tag_id`),
  FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
);
```

#### 4.1.3 订阅与推送相关表

```sql
-- 主题表
CREATE TABLE IF NOT EXISTS `topics` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '主题ID',
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT '主题名称',
  `description` TEXT COMMENT '主题描述',
  `cover_image` VARCHAR(255) COMMENT '主题封面图',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 主题标签关联表
CREATE TABLE IF NOT EXISTS `topic_tags` (
  `topic_id` INT NOT NULL COMMENT '主题ID',
  `tag_id` INT NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`topic_id`, `tag_id`),
  FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
);

-- 订阅表
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '订阅ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `topic_id` INT NOT NULL COMMENT '主题ID',
  `push_method` VARCHAR(20) DEFAULT 'wechat' COMMENT '推送方式: wechat',
  `push_time` VARCHAR(100) DEFAULT '09:00' COMMENT '推送时间，支持多个时间点（用逗号分隔）',
  `frequency` VARCHAR(20) DEFAULT 'daily' COMMENT '推送频率: daily, realtime',
  `status` BOOLEAN DEFAULT TRUE COMMENT '订阅状态',
  `filter_rules` JSON COMMENT '个性化过滤规则',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE
);

-- 推送历史表
CREATE TABLE IF NOT EXISTS `push_history` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '推送历史ID',
  `subscription_id` INT COMMENT '订阅ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `news_ids` JSON NOT NULL COMMENT '推送的新闻ID列表（JSON数组）',
  `push_method` VARCHAR(20) NOT NULL COMMENT '推送方式',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '推送状态: pending, sent, failed',
  `error_message` TEXT COMMENT '错误信息',
  `sent_at` DATETIME COMMENT '推送时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

## 5. 系统核心功能实现

### 5.1 新闻抓取功能

#### 5.1.1 爬虫核心代码

```javascript
// crawler.js
const axios = require('axios');
const cheerio = require('cheerio');
const News = require('../models/News');
const NewsSource = require('../models/NewsSource');

class Crawler {
  constructor() {
    this.running = false;
  }

  async crawl() {
    if (this.running) {
      return;
    }
    this.running = true;

    try {
      const sources = await NewsSource.findAll({ where: { is_active: true } });
      
      for (const source of sources) {
        await this.crawlSource(source);
      }
    } catch (error) {
      console.error('Crawl error:', error);
    } finally {
      this.running = false;
    }
  }

  async crawlSource(source) {
    try {
      const response = await axios.get(source.url, { timeout: 10000 });
      const { data } = response;
      
      let newsList = [];
      switch (source.type) {
        case 'website':
          newsList = this.parseWebsite(data, source.parser_config);
          break;
        case 'api':
          newsList = this.parseAPI(data, source.parser_config);
          break;
        case 'rss':
          newsList = this.parseRSS(data, source.parser_config);
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      // 去重并保存新闻
      for (const newsItem of newsList) {
        await News.findOrCreate({
          where: { link: newsItem.link },
          defaults: {
            title: newsItem.title,
            summary: newsItem.summary,
            content: newsItem.content,
            published_at: newsItem.published_at,
            source_id: source.id,
            hotness: newsItem.hotness || 0,
            status: 'pending'
          }
        });
      }

      // 更新最后抓取时间
      await source.update({ last_crawled_at: new Date() });
    } catch (error) {
      console.error(`Crawl source ${source.name} error:`, error);
    }
  }

  parseWebsite(html, config) {
    const $ = cheerio.load(html);
    const newsList = [];
    
    // 根据配置解析网页
    // 示例：config.selector = '.news-item', config.title = '.title', config.link = '.title a', config.summary = '.summary'
    $(config.selector).each((index, element) => {
      const $element = $(element);
      const newsItem = {
        title: $element.find(config.title).text().trim(),
        link: $element.find(config.link).attr('href'),
        summary: $element.find(config.summary).text().trim(),
        published_at: new Date()
      };
      newsList.push(newsItem);
    });
    
    return newsList;
  }

  parseAPI(data, config) {
    // 根据配置解析API响应
    // 示例：config.dataPath = 'data.items', config.title = 'title', config.link = 'url', config.summary = 'description'
    const items = this.getNestedValue(data, config.dataPath);
    return items.map(item => ({
      title: item[config.title],
      link: item[config.link],
      summary: item[config.summary],
      published_at: item[config.published_at] ? new Date(item[config.published_at]) : new Date(),
      hotness: item[config.hotness] || 0
    }));
  }

  parseRSS(xml, config) {
    // 解析RSS feed
    const $ = cheerio.load(xml, { xmlMode: true });
    const newsList = [];
    
    $('item').each((index, element) => {
      const $element = $(element);
      newsList.push({
        title: $element.find('title').text().trim(),
        link: $element.find('link').text().trim(),
        summary: $element.find('description').text().trim(),
        published_at: new Date($element.find('pubDate').text())
      });
    });
    
    return newsList;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
  }
}

module.exports = new Crawler();
```

#### 5.1.2 定时抓取

```javascript
// app.js
const cron = require('node-cron');
const crawler = require('./crawler');

// 每5分钟抓取一次
cron.schedule('*/5 * * * *', () => {
  console.log('Starting crawl...');
  crawler.crawl();
});
```

### 5.2 新闻管理功能

#### 5.2.1 新闻列表API

```javascript
// routes/news.js
const express = require('express');
const router = express.Router();
const News = require('../models/News');
const Tag = require('../models/Tag');
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');

// 获取新闻列表
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      source_id,
      tag_id,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (source_id) where.source_id = source_id;
    if (start_date) where.published_at = { [Op.gte]: new Date(start_date) };
    if (end_date) where.published_at = { ...where.published_at, [Op.lte]: new Date(end_date) };

    let newsList;
    if (tag_id) {
      // 根据标签过滤
      newsList = await News.findAll({
        where,
        include: [{
          model: Tag,
          where: { id: tag_id }
        }],
        offset,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });
    } else {
      newsList = await News.findAll({
        where,
        include: [Tag],
        offset,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });
    }

    const total = await News.count({ where });

    res.json({
      data: newsList,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5.3 订阅与推送功能

#### 5.3.1 订阅管理API

```javascript
// routes/subscriptions.js
const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Topic = require('../models/Topic');
const auth = require('../middleware/auth');

// 创建订阅
router.post('/', auth, async (req, res) => {
  try {
    const { topic_id, push_method = 'wechat', push_time = '09:00', frequency = 'daily', filter_rules = {} } = req.body;

    const subscription = await Subscription.create({
      user_id: req.user.id,
      topic_id,
      push_method,
      push_time,
      frequency,
      filter_rules,
      status: true
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户订阅列表
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.user.id },
      include: [Topic]
    });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 5.3.2 推送服务

```javascript
// services/push.js
const WechatAPI = require('wechat-api');
const Subscription = require('../models/Subscription');
const News = require('../models/News');
const Topic = require('../models/Topic');
const Tag = require('../models/Tag');
const PushHistory = require('../models/PushHistory');
const config = require('../config');

const api = new WechatAPI(config.wechat.appid, config.wechat.appsecret);

class PushService {
  async pushNews() {
    try {
      // 获取所有激活的订阅
      const subscriptions = await Subscription.findAll({
        where: { status: true },
        include: [Topic]
      });

      for (const subscription of subscriptions) {
        await this.pushSubscription(subscription);
      }
    } catch (error) {
      console.error('Push news error:', error);
    }
  }

  async pushSubscription(subscription) {
    try {
      // 获取订阅主题的标签
      const topicTags = await Tag.findAll({
        include: [{ model: Topic, where: { id: subscription.topic_id } }]
      });

      const tagIds = topicTags.map(tag => tag.id);

      // 根据标签获取新闻
      const newsList = await News.findAll({
        where: { status: 'published' },
        include: [{ model: Tag, where: { id: tagIds } }],
        order: [['hotness', 'DESC']],
        limit: 5
      });

      if (newsList.length === 0) {
        return;
      }

      // 生成推送内容
      const content = this.generatePushContent(newsList, subscription.topic.name);

      // 调用微信API推送
      // 注意：这里需要实现微信用户openid与系统用户的关联
      // 简化起见，这里假设已经关联
      const openid = subscription.user.wechat_openid;

      await api.sendText(openid, content);

      // 保存推送历史
      await PushHistory.create({
        subscription_id: subscription.id,
        user_id: subscription.user_id,
        news_ids: JSON.stringify(newsList.map(news => news.id)),
        push_method: subscription.push_method,
        status: 'sent',
        sent_at: new Date()
      });
    } catch (error) {
      console.error(`Push subscription ${subscription.id} error:`, error);
      
      // 保存失败的推送历史
      await PushHistory.create({
        subscription_id: subscription.id,
        user_id: subscription.user_id,
        news_ids: JSON.stringify([]),
        push_method: subscription.push_method,
        status: 'failed',
        error_message: error.message,
        sent_at: new Date()
      });
    }
  }

  generatePushContent(newsList, topicName) {
    let content = `【${topicName}】今日热点\n\n`;
    
    newsList.forEach((news, index) => {
      content += `${index + 1}. ${news.title}\n`;
      content += `${news.summary.substring(0, 100)}...\n`;
      content += `阅读原文: ${news.link}\n\n`;
    });
    
    content += `更多精彩内容，请访问我们的平台查看。`;
    
    return content;
  }
}

module.exports = new PushService();
```

### 5.4 用户认证与权限管理

#### 5.4.1 认证中间件

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};
```

#### 5.4.2 权限中间件

```javascript
// middleware/permit.js
module.exports = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    next();
  };
};
```

## 6. 前端界面设计

### 6.1 页面结构

#### 6.1.1 登录注册页面

- 登录表单
- 注册表单
- 忘记密码

#### 6.1.2 首页

- 新闻列表
- 主题分类
- 搜索功能
- 快捷订阅

#### 6.1.3 新闻管理页面

- 新闻列表
- 新闻详情
- 新闻编辑
- 新闻审核

#### 6.1.4 主题管理页面

- 主题列表
- 主题编辑
- 主题标签管理

#### 6.1.5 订阅管理页面

- 我的订阅
- 订阅主题
- 订阅设置

#### 6.1.6 系统管理页面

- 用户管理
- 角色管理
- 权限管理

### 6.2 核心组件示例

#### 6.2.1 新闻列表组件

```tsx
// components/NewsList.tsx
import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, Spin, Pagination, Select, Input } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { News } from '../types';

const { Option } = Select;
const { Search } = Input;

const NewsList: React.FC = () => {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    source_id: '',
    tag_id: '',
    keyword: ''
  });

  useEffect(() => {
    fetchNews();
  }, [pagination.page, pagination.limit, filters]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/news', {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setNewsList(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Fetch news error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setFilters({ ...filters, status: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, keyword: value });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Select
          placeholder="Select status"
          style={{ width: 150 }}
          onChange={handleStatusChange}
          value={filters.status}
        >
          <Option value="">All</Option>
          <Option value="pending">Pending</Option>
          <Option value="published">Published</Option>
          <Option value="rejected">Rejected</Option>
        </Select>
        <Search
          placeholder="Search by title or summary"
          allowClear
          enterButton
          size="middle"
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>
      
      <Spin spinning={loading}>
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={newsList}
          renderItem={news => (
            <List.Item>
              <Card
                title={news.title}
                extra={
                  <div>
                    <Button type="primary" icon={<EyeOutlined />} size="small" style={{ marginRight: 8 }}>
                      View
                    </Button>
                    <Button icon={<EditOutlined />} size="small" style={{ marginRight: 8 }}>
                      Edit
                    </Button>
                    <Button danger icon={<DeleteOutlined />} size="small">
                      Delete
                    </Button>
                  </div>
                }}
                actions={[
                  <Tag color={news.status === 'published' ? 'green' : news.status === 'rejected' ? 'red' : 'orange'}>
                    {news.status}
                  </Tag>,
                  <span>{news.hotness} 热度</span>,
                  <span>{new Date(news.published_at).toLocaleString()}</span>
                ]}
              >
                <p>{news.summary}</p>
                {news.tags && (
                  <div style={{ marginTop: 16 }}>
                    {news.tags.map(tag => (
                      <Tag key={tag.id}>{tag.name}</Tag>
                    ))}
                  </div>
                )}
              </Card>
            </List.Item>
          )}
        />
        
        <Pagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onChange={(page, pageSize) => {
            setPagination({ ...pagination, page, limit: pageSize });
          }}
          showSizeChanger
          pageSizeOptions={['10', '20', '50', '100']}
          style={{ marginTop: 16, textAlign: 'right' }}
        />
      </Spin>
    </div>
  );
};

export default NewsList;
```

## 7. 系统部署

### 7.1 Docker Compose 配置

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=news_system
      - JWT_SECRET=your_jwt_secret
      - WECHAT_APPID=your_wechat_appid
      - WECHAT_APPSECRET=your_wechat_appsecret
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=news_system
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### 7.2 Dockerfile

```dockerfile
# 使用Node.js 18作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build:frontend

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "app.js"]
```

## 8. 实现步骤

1. **环境准备**
   - 安装 Node.js 18
   - 安装 MySQL 8.0
   - 安装 Docker 和 Docker Compose

2. **核心模块开发**
   - 初始化项目结构
   - 配置数据库连接
   - 实现用户认证和权限管理
   - 实现新闻抓取功能

3. **API 开发**
   - 实现新闻管理 API
   - 实现主题管理 API
   - 实现订阅管理 API
   - 实现推送管理 API

4. **前端开发**
   - 初始化前端项目
   - 实现登录注册页面
   - 实现新闻管理页面
   - 实现主题和订阅管理页面

5. **系统集成和测试**
   - 集成前后端
   - 测试核心功能
   - 修复bug

6. **部署和上线**
   - 配置 Docker Compose
   - 部署到生产环境
   - 配置监控和日志

## 9. 系统优势

1. **易于部署**: 基于 Docker Compose，一键部署
2. **功能完整**: 包含新闻抓取、管理、订阅、推送核心功能
3. **技术成熟**: 采用成熟的技术栈，稳定性高
4. **易于扩展**: 模块化设计，便于后续扩展功能
5. **用户友好**: 简洁直观的管理界面
6. **成本低廉**: 运行成本低，适合小型团队使用

## 10. 未来扩展

- **AI 功能**: 后续可以逐步添加 AI 标签生成、智能摘要等功能
- **多渠道推送**: 支持邮件、短信等更多推送渠道
- **实时推送**: 基于 WebSocket 的实时推送
- **数据分析**: 添加数据分析和报表功能
- **移动端 APP**: 开发 iOS 和 Android 客户端

## 11. 结论

本系统是一个功能完整、易于部署的新闻管理和订阅推送系统，专注于核心功能，采用简化的技术栈，适合小型团队和个人使用。系统的设计参考了 newsnow-main 项目的设计思路，但所有代码和结构均为全新创建，符合用户的要求。系统的实现将按照上述计划逐步进行，确保按时交付高质量的产品。