import { Card, Button, Tag, Space, Breadcrumb, Descriptions, Divider, Avatar, ShareAltOutlined, Comment, Input } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, LikeOutlined, DislikeOutlined, StarOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { TextArea } = Input;

const API_BASE_URL = 'http://localhost:3000/api';

interface News {
  id: number;
  title: string;
  link: string;
  summary: string;
  content: string;
  hotness: number;
  status: string;
  published_at: string;
  topics: string;
  created_at?: string;
  updated_at?: string;
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Input.useForm();
  
  useEffect(() => {
    if (id) {
      fetchNewsDetail();
    }
  }, [id]);
  
  const fetchNewsDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/news/${id}`);
      setNews(response.data);
    } catch (error) {
      console.error('获取新闻详情失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  if (!news) {
    return <div>新闻不存在</div>;
  }
  
  return (
    <div>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={() => navigate('/')}>首页</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/news')}>新闻管理</Breadcrumb.Item>
        <Breadcrumb.Item>新闻详情</Breadcrumb.Item>
      </Breadcrumb>
      
      {/* 返回按钮 */}
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 16 }}>
        返回新闻列表
      </Button>
      
      {/* 新闻详情卡片 */}
      <Card
        title={news.title}
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Button type="primary" icon={<EditOutlined />} size="small">
              编辑
            </Button>
            <Button danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Space>
        }
      >
        {/* 新闻元信息 */}
        <Descriptions column={3} bordered size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="状态">
            <Tag color={
              news.status === 'published' ? 'success' : 
              news.status === 'pending' ? 'warning' : 'error'
            }>
              {news.status === 'published' ? '已发布' : 
               news.status === 'pending' ? '待审核' : '已拒绝'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="热度">
            <Space>
              <EyeOutlined /> {news.hotness}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">
            {new Date(news.published_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {news.created_at && new Date(news.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {news.updated_at && new Date(news.updated_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="主题">
            <Space>
              {news.topics.split(',').map(topic => (
                <Tag key={topic} color="blue">{topic}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
        
        {/* 新闻摘要 */}
        <Card type="inner" title="摘要" style={{ marginBottom: 24 }}>
          {news.summary}
        </Card>
        
        {/* 新闻内容 */}
        <Card type="inner" title="内容" style={{ marginBottom: 24 }}>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '16px' }}>
            {news.content || '暂无内容'}
          </div>
        </Card>
        
        {/* 操作按钮 */}
        <Space style={{ marginTop: 16, marginBottom: 24 }}>
          <Button type="default" icon={<ShareAltOutlined />}>
            分享
          </Button>
          <Button type="default" icon={<StarOutlined />}>
            收藏
          </Button>
          <Button type="default" icon={<LikeOutlined />}>
            点赞
          </Button>
          <Button type="default" icon={<DislikeOutlined />}>
            点踩
          </Button>
        </Space>
        
        <Divider>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>相关新闻</span>
        </Divider>
        
        {/* 相关新闻 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(item => (
            <Card key={item} title={`相关新闻 ${item}`} size="small">
              <p style={{ marginBottom: 8, color: '#666' }}>相关新闻摘要...</p>
              <Button type="link" size="small" onClick={() => navigate(`/news/${item}`)}>
                查看详情
              </Button>
            </Card>
          ))}
        </div>
      </Card>
      
      {/* 评论区 */}
      <Card title="评论" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <TextArea
            placeholder="写下你的评论..."
            rows={4}
            style={{ marginBottom: 8 }}
          />
          <div style={{ textAlign: 'right' }}>
            <Button type="primary">发表评论</Button>
          </div>
        </div>
        
        {/* 评论列表 */}
        <div>
          {[1, 2, 3].map(item => (
            <Comment
              key={item}
              avatar={<Avatar>用</Avatar>}
              author={<a href="#">用户名{item}</a>}
              content={<p>这是一条评论内容{item}</p>}
              datetime={
                <span>1小时前</span>
              }
              actions={[
                <span key="comment-like">
                  <LikeOutlined />
                  <span style={{ marginLeft: 8 }}>10</span>
                </span>,
                <span key="comment-dislike">
                  <DislikeOutlined />
                  <span style={{ marginLeft: 8 }}>2</span>
                </span>,
                <span key="comment-reply">回复</span>,
              ]}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default NewsDetail;