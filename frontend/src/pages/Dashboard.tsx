import { Card, Row, Col, Statistic, Table, Button, Space, Progress, Tag, List, Avatar, Tooltip } from 'antd';
import { 
  ArrowUpOutlined, 
  FileTextOutlined, 
  TagOutlined, 
  BellOutlined, 
  UserOutlined, 
  ReloadOutlined, 
  FireOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined 
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3000/api';

interface News {
  id: number;
  title: string;
  status: string;
  hotness: number;
  created_at: string;
  topics?: string;
  source_id?: number;
}

interface NewsSource {
  id: number;
  name: string;
  is_active: boolean;
}

interface StatusStats {
  published: number;
  pending: number;
  rejected: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalNews: 0,
    totalTopics: 0,
    totalSubscriptions: 0,
    totalUsers: 0,
  });

  const [statusStats, setStatusStats] = useState<StatusStats>({
    published: 0,
    pending: 0,
    rejected: 0,
  });

  const [recentNews, setRecentNews] = useState<News[]>([]);
  const [hotNews, setHotNews] = useState<News[]>([]);
  const [newsSources, setNewsSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const [newsResponse, topicsResponse, subsResponse, sourcesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/news`),
        axios.get(`${API_BASE_URL}/topics`),
        axios.get(`${API_BASE_URL}/subscriptions`),
        axios.get(`${API_BASE_URL}/news-sources`),
      ]);

      const newsData = newsResponse.data;
      
      // Calculate status statistics
      const statusCount = newsData.reduce((acc: StatusStats, news: News) => {
        if (news.status === 'published') acc.published++;
        if (news.status === 'pending') acc.pending++;
        if (news.status === 'rejected') acc.rejected++;
        return acc;
      }, { published: 0, pending: 0, rejected: 0 });

      setStats({
        totalNews: newsData.length,
        totalTopics: topicsResponse.data.length,
        totalSubscriptions: subsResponse.data.length,
        totalUsers: 0, // User endpoint not implemented yet
      });

      setStatusStats(statusCount);
      
      // Set recent news (limit to 5)
      setRecentNews(newsData.slice(0, 5));
      
      // Set hot news (sorted by hotness, limit to 5)
      setHotNews(newsData.sort((a: News, b: News) => b.hotness - a.hotness).slice(0, 5));
      
      // Set news sources
      setNewsSources(sourcesResponse.data);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: News) => (
        <a href="#" onClick={() => navigate(`/news/${record.id}`)}>
          {title}
        </a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let icon = <ClockCircleOutlined />;
        if (status === 'published') {
          color = 'success';
          icon = <CheckCircleOutlined />;
        }
        if (status === 'pending') {
          color = 'warning';
          icon = <ClockCircleOutlined />;
        }
        if (status === 'rejected') {
          color = 'error';
          icon = <CloseCircleOutlined />;
        }
        return (
          <Tag color={color}>
            {icon} {status === 'published' ? '已发布' : status === 'pending' ? '待审核' : '已拒绝'}
          </Tag>
        );
      },
    },
    {
      title: '热度',
      dataIndex: 'hotness',
      key: 'hotness',
      render: (hotness: number) => (
        <Space>
          <FireOutlined style={{ color: '#ff4d4f' }} />
          <span>{hotness}</span>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at: string) => {
        return new Date(created_at).toLocaleString();
      }
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <h1 className="page-title">数据统计</h1>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
        >
          刷新数据
        </Button>
      </Space>
      
      {/* 核心统计数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="新闻总数"
              value={stats.totalNews}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={<ArrowUpOutlined />}
            />
            <div style={{ marginTop: 16 }}>
              <Progress 
                type="line" 
                percent={Math.round((statusStats.published / stats.totalNews) * 100) || 0} 
                status="success" 
                strokeColor="#52c41a"
                format={(percent) => `${statusStats.published} 已发布`}
                strokeWidth={4}
              />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="主题总数"
              value={stats.totalTopics}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="订阅总数"
              value={stats.totalSubscriptions}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="用户总数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 新闻状态分布 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="新闻状态分布" size="small">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>
                    {statusStats.published}
                  </div>
                  <div style={{ color: '#666', marginBottom: 8 }}>已发布</div>
                  <Progress 
                    type="circle" 
                    percent={Math.round((statusStats.published / stats.totalNews) * 100) || 0} 
                    size={80} 
                    strokeColor="#52c41a"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14', marginBottom: 8 }}>
                    {statusStats.pending}
                  </div>
                  <div style={{ color: '#666', marginBottom: 8 }}>待审核</div>
                  <Progress 
                    type="circle" 
                    percent={Math.round((statusStats.pending / stats.totalNews) * 100) || 0} 
                    size={80} 
                    strokeColor="#faad14"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f', marginBottom: 8 }}>
                    {statusStats.rejected}
                  </div>
                  <div style={{ color: '#666', marginBottom: 8 }}>已拒绝</div>
                  <Progress 
                    type="circle" 
                    percent={Math.round((statusStats.rejected / stats.totalNews) * 100) || 0} 
                    size={80} 
                    strokeColor="#ff4d4f"
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        
        {/* 新闻来源统计 */}
        <Col span={12}>
          <Card title="新闻来源" size="small">
            <List
              dataSource={newsSources.slice(0, 8)}
              renderItem={(source) => (
                <List.Item
                  key={source.id}
                  actions={[
                    <Tag color={source.is_active ? 'green' : 'red'}>
                      {source.is_active ? '活跃' : '停用'}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{source.name.charAt(0)}</Avatar>}
                    title={source.name}
                  />
                </List.Item>
              )}
              style={{ maxHeight: 240, overflow: 'auto' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近新闻 */}
        <Col span={12}>
          <Card 
            title="最近新闻" 
            hoverable
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
          >
            <List
              dataSource={recentNews}
              renderItem={(news) => (
                <List.Item
                  key={news.id}
                  style={{ 
                    borderBottom: '1px solid #f0f0f0', 
                    padding: '12px 0',
                    transition: 'all 0.3s',
                    borderRadius: '4px',
                    '&:hover': { background: '#fafafa' }
                  }}
                >
                  <a 
                    href="#" 
                    onClick={() => navigate(`/news/${news.id}`)}
                    style={{ 
                      display: 'block', 
                      width: '100%',
                      fontSize: '15px',
                      lineHeight: '1.5',
                      color: '#333',
                      '&:hover': { color: '#1890ff', textDecoration: 'none' }
                    }}
                  >
                    {news.title}
                  </a>
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    <Space>
                      <Tag color={
                        news.status === 'published' ? 'success' : 
                        news.status === 'pending' ? 'warning' : 'error'
                      } size="small">
                        {news.status === 'published' ? '已发布' : 
                         news.status === 'pending' ? '待审核' : '已拒绝'}
                      </Tag>
                      <span>
                        <FireOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} /> 
                        {news.hotness}
                      </span>
                      <span>
                        <ClockCircleOutlined style={{ fontSize: '12px' }} /> 
                        {new Date(news.created_at).toLocaleString()}
                      </span>
                    </Space>
                  </div>
                </List.Item>
              )}
              style={{ maxHeight: 300, overflow: 'auto' }}
              locale={{ emptyText: '暂无最近新闻' }}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                onClick={() => navigate('/news')}
                size="middle"
                style={{ borderRadius: '6px' }}
              >
                查看全部新闻
              </Button>
            </div>
          </Card>
        </Col>
        
        {/* 热门新闻 */}
        <Col span={12}>
          <Card 
            title="热门新闻" 
            hoverable
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
          >
            <List
              dataSource={hotNews}
              renderItem={(news, index) => (
                <List.Item
                  key={news.id}
                  style={{ 
                    borderBottom: '1px solid #f0f0f0', 
                    padding: '12px 0',
                    transition: 'all 0.3s',
                    borderRadius: '4px',
                    '&:hover': { background: '#fafafa' }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '4px', 
                      backgroundColor: index < 3 ? '#ff4d4f' : '#f0f0f0',
                      color: index < 3 ? '#fff' : '#666',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <a 
                        href="#" 
                        onClick={() => navigate(`/news/${news.id}`)}
                        style={{ 
                          display: 'block', 
                          fontSize: '15px',
                          lineHeight: '1.5',
                          color: '#333',
                          marginBottom: '8px',
                          '&:hover': { color: '#1890ff', textDecoration: 'none' }
                        }}
                      >
                        {news.title}
                      </a>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <Space>
                          <span>
                            <FireOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} /> 
                            {news.hotness}
                          </span>
                          <Tag color={
                            news.status === 'published' ? 'success' : 
                            news.status === 'pending' ? 'warning' : 'error'
                          } size="small">
                            {news.status === 'published' ? '已发布' : 
                             news.status === 'pending' ? '待审核' : '已拒绝'}
                          </Tag>
                        </Space>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
              style={{ maxHeight: 300, overflow: 'auto' }}
              locale={{ emptyText: '暂无热门新闻' }}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                onClick={() => navigate('/news')}
                size="middle"
                style={{ borderRadius: '6px' }}
              >
                查看全部热门新闻
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
