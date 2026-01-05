import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Popconfirm, message, Space, Card, Row, Col, Pagination, Slider, Checkbox, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;
const { Group: CheckboxGroup } = Checkbox;

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
  source_id?: number;
  source_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface NewsSource {
  id: number;
  name: string;
}

const NewsManagement: React.FC = () => {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [currentNews, setCurrentNews] = useState<News | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<number[]>([]);
  const [newsSources, setNewsSources] = useState<NewsSource[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [selectedNews, setSelectedNews] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewNews, setPreviewNews] = useState<News | null>(null);
  const [sourceMap, setSourceMap] = useState<Record<number, string>>({});

  // 获取新闻列表
  useEffect(() => {
    fetchNewsList();
    fetchNewsSources();
  }, []);

  // 过滤新闻列表
  useEffect(() => {
    let result = [...newsList];
    
    // 搜索过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      result = result.filter(news => 
        news.title.toLowerCase().includes(lowerSearchText) || 
        (news.summary && news.summary.toLowerCase().includes(lowerSearchText))
      );
    }
    
    // 状态过滤
    if (statusFilter) {
      result = result.filter(news => news.status === statusFilter);
    }
    
    // 来源过滤
    if (sourceFilter.length > 0) {
      result = result.filter(news => sourceFilter.includes(news.source_id || 0));
    }
    
    // 日期过滤
    if (dateRange[0] || dateRange[1]) {
      result = result.filter(news => {
        const newsDate = new Date(news.published_at).getTime();
        const startDate = dateRange[0] ? new Date(dateRange[0]).setHours(0, 0, 0, 0) : 0;
        const endDate = dateRange[1] ? new Date(dateRange[1]).setHours(23, 59, 59, 999) : Date.now();
        return newsDate >= startDate && newsDate <= endDate;
      });
    }
    
    setFilteredNews(result);
  }, [newsList, searchText, statusFilter, sourceFilter, dateRange]);

  // 分页后的新闻
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const fetchNewsList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/news`);
      // Add source_name to each news item using sourceMap
      const newsWithSource = response.data.map((news: News) => ({
        ...news,
        source_name: sourceMap[news.source_id || 0] || '未知来源'
      }));
      setNewsList(newsWithSource);
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      message.error('获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsSources = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/news-sources`);
      setNewsSources(response.data);
      // Create source map for quick lookup
      const map: Record<number, string> = {};
      response.data.forEach((source: NewsSource) => {
        map[source.id] = source.name;
      });
      setSourceMap(map);
    } catch (error) {
      console.error('获取新闻来源失败:', error);
      message.error('获取新闻来源失败');
    }
  };

  const handleAddNews = () => {
    setIsEditMode(false);
    setCurrentNews(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditNews = (news: News) => {
    setIsEditMode(true);
    setCurrentNews(news);
    form.setFieldsValue(news);
    setIsModalVisible(true);
  };

  const handleDeleteNews = async (id: number) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/news/${id}`);
      message.success('新闻删除成功');
      fetchNewsList();
    } catch (error) {
      console.error('删除新闻失败:', error);
      message.error('删除新闻失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNews.length === 0) {
      message.warning('请选择要删除的新闻');
      return;
    }
    
    try {
      setLoading(true);
      await Promise.all(
        selectedNews.map(id => axios.delete(`${API_BASE_URL}/news/${id}`))
      );
      message.success(`成功删除${selectedNews.length}条新闻`);
      setSelectedNews([]);
      fetchNewsList();
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/news/${id}`, { status });
      message.success(`新闻已${status === 'published' ? '发布' : status === 'rejected' ? '拒绝' : '设为待审核'}`);
      fetchNewsList();
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('更新状态失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedNews.length === 0) {
      message.warning('请选择要更新的新闻');
      return;
    }
    
    try {
      setLoading(true);
      await Promise.all(
        selectedNews.map(id => axios.put(`${API_BASE_URL}/news/${id}`, { status }))
      );
      message.success(`成功${status === 'published' ? '发布' : status === 'rejected' ? '拒绝' : '设为待审核'}${selectedNews.length}条新闻`);
      setSelectedNews([]);
      fetchNewsList();
    } catch (error) {
      console.error('批量更新状态失败:', error);
      message.error('批量更新状态失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOk = async () => {
    form.validateFields().then(async (values) => {
      try {
        setLoading(true);
        if (isEditMode && currentNews) {
          // 更新现有新闻
          await axios.put(`${API_BASE_URL}/news/${currentNews.id}`, values);
          message.success('新闻更新成功');
        } else {
          // 添加新新闻
          await axios.post(`${API_BASE_URL}/news`, values);
          message.success('新闻添加成功');
        }
        setIsModalVisible(false);
        fetchNewsList();
      } catch (error) {
        console.error('保存新闻失败:', error);
        message.error('保存新闻失败');
      } finally {
        setLoading(false);
      }
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsPreviewModalVisible(false);
  };

  const handleNewsPreview = (news: News) => {
    setPreviewNews(news);
    setIsPreviewModalVisible(true);
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedNews.length === filteredNews.length && filteredNews.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedNews(filteredNews.map(news => news.id));
            } else {
              setSelectedNews([]);
            }
          }}
        />
      ),
      dataIndex: 'id',
      key: 'select',
      render: (id: number) => (
        <Checkbox
          checked={selectedNews.includes(id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedNews([...selectedNews, id]);
            } else {
              setSelectedNews(selectedNews.filter(item => item !== id));
            }
          }}
        />
      ),
      width: 50,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false,
      },
      render: (title: string, record: News) => (
        <Tooltip placement="topLeft" title={title}>
          <Space>
            <a href={record.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>
              {title}
            </a>
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleNewsPreview(record)}
            >
              预览
            </Button>
          </Space>
        </Tooltip>
      ),
      width: 300,
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: {
        showTitle: false,
      },
      render: (summary: string) => (
        <Tooltip placement="topLeft" title={summary}>
          <div style={{ maxWidth: 400 }}>{summary}</div>
        </Tooltip>
      ),
      width: 400,
    },
    {
      title: '新闻来源',
      dataIndex: 'source_name',
      key: 'source_name',
      render: (sourceName: string) => (
        <Tag color="blue">{sourceName}</Tag>
      ),
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '已发布', value: 'published' },
        { text: '待审核', value: 'pending' },
        { text: '已拒绝', value: 'rejected' },
      ],
      onFilter: (value: string | number | boolean, record: News) => record.status === value,
      render: (status: string, record: News) => (
        <Space>
          <Tag 
            color={status === 'published' ? 'success' : status === 'pending' ? 'warning' : 'error'}
          >
            {status === 'published' ? '已发布' : status === 'pending' ? '待审核' : '已拒绝'}
          </Tag>
          <Space size="small">
            {status !== 'published' && (
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleUpdateStatus(record.id, 'published')}
                style={{ color: '#52c41a' }}
              >
                发布
              </Button>
            )}
            {status !== 'rejected' && (
              <Button
                type="text"
                icon={<CloseCircleOutlined />}
                size="small"
                onClick={() => handleUpdateStatus(record.id, 'rejected')}
                style={{ color: '#ff4d4f' }}
              >
                拒绝
              </Button>
            )}
          </Space>
        </Space>
      ),
      width: 200,
    },
    {
      title: '发布时间',
      dataIndex: 'published_at',
      key: 'published_at',
      sorter: (a: News, b: News) => 
        new Date(a.published_at).getTime() - new Date(b.published_at).getTime(),
      render: (published_at: string) => {
        return new Date(published_at).toLocaleString();
      },
      width: 200,
    },
    {
      title: '主题',
      dataIndex: 'topics',
      key: 'topics',
      render: (topics: string) => (
        <Space>
          {topics ? topics.split(',').map(topic => (
            <Tag key={topic} color="blue">{topic}</Tag>
          )) : <Tag color="default">无</Tag>}
        </Space>
      ),
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: News) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditNews(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条新闻吗？"
            onConfirm={() => handleDeleteNews(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 150,
    },
  ];

  const fetchNewsList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/news`);
      setNewsList(response.data);
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      message.error('获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">新闻管理</h1>
      
      {/* 批量操作栏 */}
      {selectedNews.length > 0 && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Space>
            <span>已选择 {selectedNews.length} 条新闻</span>
            <Button type="primary" onClick={() => handleBulkUpdateStatus('published')}>
              批量发布
            </Button>
            <Button onClick={() => handleBulkUpdateStatus('pending')}>
              批量设为待审核
            </Button>
            <Button danger onClick={() => handleBulkDelete()}>
              批量删除
            </Button>
          </Space>
        </Card>
      )}
      
      {/* 筛选条件栏 */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="搜索新闻标题或摘要"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => fetchNewsList()}
              />
              <Button type="primary" onClick={fetchNewsList}>
                搜索
              </Button>
              <Button onClick={() => {
                setSearchText('');
                setStatusFilter('');
                setSourceFilter([]);
                setDateRange([null, null]);
                fetchNewsList();
              }}>
                重置
              </Button>
            </Space.Compact>
          </Col>
          
          <Col span={4}>
            <Select
              placeholder="筛选状态"
              style={{ width: '100%' }}
              onChange={setStatusFilter}
              value={statusFilter}
              allowClear
            >
              <Option value="">全部</Option>
              <Option value="published">已发布</Option>
              <Option value="pending">待审核</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </Col>
          
          <Col span={6}>
            <Select
              placeholder="筛选新闻来源"
              style={{ width: '100%' }}
              onChange={setSourceFilter}
              value={sourceFilter}
              mode="multiple"
              allowClear
            >
              {newsSources.map(source => (
                <Option key={source.id} value={source.id}>{source.name}</Option>
              ))}
            </Select>
          </Col>
          
          <Col span={6}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                type="date"
                placeholder="开始日期"
                style={{ width: '50%' }}
                value={dateRange[0] || ''}
                onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
              />
              <Input
                type="date"
                placeholder="结束日期"
                style={{ width: '50%' }}
                value={dateRange[1] || ''}
                onChange={(e) => setDateRange([dateRange[0], e.target.value])}
              />
            </Space.Compact>
          </Col>
        </Row>
      </Card>
      
      {/* 新闻列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={paginatedNews}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1600 }}
          bordered
          rowClassName={(record) => {
            if (record.status === 'published') return 'published-row';
            if (record.status === 'rejected') return 'rejected-row';
            return '';
          }}
        />
        
        {/* 分页 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredNews.length}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1);
              }
            }}
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']}
            showTotal={(total) => `共 ${total} 条新闻`}
          />
        </div>
      </Card>

      {/* 新闻编辑/添加模态框 */}
      <Modal
        title={isEditMode ? '编辑新闻' : '添加新闻'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
        width={800}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'pending', hotness: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入新闻标题' }]}
              >
                <Input placeholder="请输入新闻标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="link"
                label="链接"
                rules={[{ required: true, message: '请输入新闻链接' }]}
              >
                <Input placeholder="请输入新闻链接" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="hotness"
                label="热度"
                rules={[{ required: true, message: '请输入新闻热度' }]}
              >
                <InputNumber placeholder="请输入新闻热度" min={0} max={1000} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择新闻状态' }]}
              >
                <Select placeholder="请选择新闻状态">
                  <Option value="pending">待审核</Option>
                  <Option value="published">已发布</Option>
                  <Option value="rejected">已拒绝</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="topics"
                label="主题"
              >
                <Select
                  mode="tags"
                  placeholder="请输入或选择主题"
                  style={{ width: '100%' }}
                >
                  <Option value="科技">科技</Option>
                  <Option value="互联网">互联网</Option>
                  <Option value="体育">体育</Option>
                  <Option value="娱乐">娱乐</Option>
                  <Option value="财经">财经</Option>
                  <Option value="股票">股票</Option>
                  <Option value="政治">政治</Option>
                  <Option value="社会">社会</Option>
                  <Option value="文化">文化</Option>
                  <Option value="教育">教育</Option>
                  <Option value="健康">健康</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="summary"
            label="摘要"
            rules={[{ required: true, message: '请输入新闻摘要' }]}
          >
            <TextArea rows={3} placeholder="请输入新闻摘要" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="内容"
          >
            <TextArea rows={6} placeholder="请输入新闻内容（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新闻预览模态框 */}
      <Modal
        title="新闻预览"
        open={isPreviewModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        {previewNews && (
          <div>
            <h2 style={{ marginBottom: 16 }}>{previewNews.title}</h2>
            <div style={{ marginBottom: 16, color: '#666' }}>
              <Space>
                <Tag color="blue">
                  {previewNews.source_name || '未知来源'}
                </Tag>
                <Tag color={
                  previewNews.status === 'published' ? 'success' : 
                  previewNews.status === 'pending' ? 'warning' : 'error'
                }>
                  {previewNews.status === 'published' ? '已发布' : 
                   previewNews.status === 'pending' ? '待审核' : '已拒绝'}
                </Tag>
                <span>发布时间: {new Date(previewNews.published_at).toLocaleString()}</span>
                {previewNews.created_at && (
                  <span>创建时间: {new Date(previewNews.created_at).toLocaleString()}</span>
                )}
              </Space>
            </div>
            {previewNews.topics && (
              <div style={{ marginBottom: 16 }}>
                <strong>主题: </strong>
                <Space>
                  {previewNews.topics.split(',').map(topic => (
                    <Tag key={topic}>{topic}</Tag>
                  ))}
                </Space>
              </div>
            )}
            <div style={{ marginBottom: 24 }}>
              <strong>摘要: </strong>
              <p>{previewNews.summary}</p>
            </div>
            {previewNews.content && (
              <div>
                <strong>内容: </strong>
                <div style={{ whiteSpace: 'pre-wrap' }}>{previewNews.content}</div>
              </div>
            )}
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <a 
                href={previewNews.link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ marginRight: 16 }}
              >
                查看原文
              </a>
              <Button type="primary" onClick={handleCancel}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NewsManagement;
