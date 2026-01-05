import { Table, Button, Modal, Form, Input, Switch, Popconfirm, message, Space, Card, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';

interface Topic {
  id: number;
  name: string;
  description: string;
  cover_image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TopicManagement: React.FC = () => {
  const [topicList, setTopicList] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [searchText, setSearchText] = useState('');

  // 模拟获取主题列表
  useEffect(() => {
    fetchTopicList();
  }, []);

  const fetchTopicList = () => {
    setLoading(true);
    // 模拟API请求
    setTimeout(() => {
      const mockData: Topic[] = [
        { id: 1, name: '科技', description: '科技相关新闻', cover_image: '', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, name: '互联网', description: '互联网相关新闻', cover_image: '', is_active: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
        { id: 3, name: '体育', description: '体育相关新闻', cover_image: '', is_active: true, created_at: '2024-01-03', updated_at: '2024-01-03' },
        { id: 4, name: '娱乐', description: '娱乐相关新闻', cover_image: '', is_active: false, created_at: '2024-01-04', updated_at: '2024-01-04' },
        { id: 5, name: '财经', description: '财经相关新闻', cover_image: '', is_active: true, created_at: '2024-01-05', updated_at: '2024-01-05' },
      ];
      setTopicList(mockData);
      setLoading(false);
    }, 1000);
  };

  const handleAddTopic = () => {
    setIsEditMode(false);
    setCurrentTopic(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setIsEditMode(true);
    setCurrentTopic(topic);
    form.setFieldsValue(topic);
    setIsModalVisible(true);
  };

  const handleDeleteTopic = (id: number) => {
    // 模拟删除操作
    setLoading(true);
    setTimeout(() => {
      setTopicList(topicList.filter(topic => topic.id !== id));
      setLoading(false);
      message.success('主题删除成功');
    }, 500);
  };

  const handleToggleStatus = (id: number, isActive: boolean) => {
    // 模拟更新状态操作
    setLoading(true);
    setTimeout(() => {
      setTopicList(topicList.map(topic => 
        topic.id === id ? { ...topic, is_active: !isActive } : topic
      ));
      setLoading(false);
      message.success('主题状态更新成功');
    }, 500);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      setLoading(true);
      // 模拟保存操作
      setTimeout(() => {
        if (isEditMode && currentTopic) {
          // 更新现有主题
          setTopicList(topicList.map(topic => 
            topic.id === currentTopic.id ? { ...topic, ...values } : topic
          ));
          message.success('主题更新成功');
        } else {
          // 添加新主题
          const newTopic: Topic = {
            ...values,
            id: topicList.length + 1,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
          } as Topic;
          setTopicList([...topicList, newTopic]);
          message.success('主题添加成功');
        }
        setIsModalVisible(false);
        setLoading(false);
      }, 1000);
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active: boolean, record: Topic) => (
        <Switch
          checked={is_active}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Topic) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditTopic(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个主题吗？"
            onConfirm={() => handleDeleteTopic(record.id)}
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
    },
  ];

  return (
    <div>
      <h1 className="page-title">主题管理</h1>
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="搜索主题名称"
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button type="primary" onClick={() => console.log('Search:', searchText)}>搜索</Button>
            </Space.Compact>
          </Col>
          <Col span={4} offset={12} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTopic}>
              添加主题
            </Button>
          </Col>
        </Row>
      </Card>
      
      <Table
        columns={columns}
        dataSource={topicList.filter(topic => 
          topic.name.includes(searchText) || topic.description.includes(searchText)
        )}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={isEditMode ? '编辑主题' : '添加主题'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
        width={600}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入主题名称' }]}
          >
            <Input placeholder="请输入主题名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入主题描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入主题描述" />
          </Form.Item>
          
          <Form.Item
            name="cover_image"
            label="封面图片"
          >
            <Input placeholder="请输入封面图片URL（可选）" />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TopicManagement;
