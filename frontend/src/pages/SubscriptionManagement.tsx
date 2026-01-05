import { Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Space, Card, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';

interface Subscription {
  id: number;
  user_id: number;
  topic_id: number;
  topic_name: string;
  push_method: string;
  push_time: string;
  frequency: string;
  filter_rules: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  nickname: string;
}

interface Topic {
  id: number;
  name: string;
}

const SubscriptionManagement: React.FC = () => {
  const [subscriptionList, setSubscriptionList] = useState<Subscription[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [topicList, setTopicList] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [searchText, setSearchText] = useState('');

  // 模拟获取订阅列表、用户列表和主题列表
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    // 模拟API请求
    setTimeout(() => {
      const mockSubscriptions: Subscription[] = [
        { id: 1, user_id: 1, topic_id: 1, topic_name: '科技', push_method: 'wechat', push_time: '09:00', frequency: 'daily', filter_rules: '{}', status: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, user_id: 1, topic_id: 2, topic_name: '互联网', push_method: 'wechat', push_time: '18:00', frequency: 'daily', filter_rules: '{}', status: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
        { id: 3, user_id: 2, topic_id: 3, topic_name: '体育', push_method: 'wechat', push_time: '12:00', frequency: 'daily', filter_rules: '{}', status: false, created_at: '2024-01-03', updated_at: '2024-01-03' },
      ];
      
      const mockUsers: User[] = [
        { id: 1, username: 'admin', nickname: '管理员' },
        { id: 2, username: 'user1', nickname: '用户1' },
      ];
      
      const mockTopics: Topic[] = [
        { id: 1, name: '科技' },
        { id: 2, name: '互联网' },
        { id: 3, name: '体育' },
        { id: 4, name: '娱乐' },
        { id: 5, name: '财经' },
      ];
      
      setSubscriptionList(mockSubscriptions);
      setUserList(mockUsers);
      setTopicList(mockTopics);
      setLoading(false);
    }, 1000);
  };

  const handleAddSubscription = () => {
    setIsEditMode(false);
    setCurrentSubscription(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setIsEditMode(true);
    setCurrentSubscription(subscription);
    form.setFieldsValue(subscription);
    setIsModalVisible(true);
  };

  const handleDeleteSubscription = (id: number) => {
    // 模拟删除操作
    setLoading(true);
    setTimeout(() => {
      setSubscriptionList(subscriptionList.filter(sub => sub.id !== id));
      setLoading(false);
      message.success('订阅删除成功');
    }, 500);
  };

  const handleToggleStatus = (id: number, status: boolean) => {
    // 模拟更新状态操作
    setLoading(true);
    setTimeout(() => {
      setSubscriptionList(subscriptionList.map(sub => 
        sub.id === id ? { ...sub, status: !status } : sub
      ));
      setLoading(false);
      message.success('订阅状态更新成功');
    }, 500);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      setLoading(true);
      // 模拟保存操作
      setTimeout(() => {
        if (isEditMode && currentSubscription) {
          // 更新现有订阅
          const updatedSubscription = {
            ...currentSubscription,
            ...values,
            topic_name: topicList.find(topic => topic.id === values.topic_id)?.name || '',
          };
          
          setSubscriptionList(subscriptionList.map(sub => 
            sub.id === currentSubscription.id ? updatedSubscription : sub
          ));
          message.success('订阅更新成功');
        } else {
          // 添加新订阅
          const newSubscription: Subscription = {
            ...values,
            id: subscriptionList.length + 1,
            topic_name: topicList.find(topic => topic.id === values.topic_id)?.name || '',
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
          } as Subscription;
          setSubscriptionList([...subscriptionList, newSubscription]);
          message.success('订阅添加成功');
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
      title: '用户',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId: number) => {
        const user = userList.find(u => u.id === userId);
        return user ? user.nickname || user.username : userId;
      },
    },
    {
      title: '主题',
      dataIndex: 'topic_name',
      key: 'topic_name',
      ellipsis: true,
    },
    {
      title: '推送方式',
      dataIndex: 'push_method',
      key: 'push_method',
      ellipsis: true,
    },
    {
      title: '推送时间',
      dataIndex: 'push_time',
      key: 'push_time',
      ellipsis: true,
    },
    {
      title: '推送频率',
      dataIndex: 'frequency',
      key: 'frequency',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => (
        <Tag color={status ? 'green' : 'red'}>{status ? '启用' : '禁用'}</Tag>
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
      render: (_: any, record: Subscription) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditSubscription(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个订阅吗？"
            onConfirm={() => handleDeleteSubscription(record.id)}
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
          <Button
            type={record.status ? 'default' : 'primary'}
            size="small"
            onClick={() => handleToggleStatus(record.id, record.status)}
          >
            {record.status ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 className="page-title">订阅管理</h1>
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="搜索订阅信息"
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button type="primary" onClick={() => console.log('Search:', searchText)}>搜索</Button>
            </Space.Compact>
          </Col>
          <Col span={4} offset={12} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSubscription}>
              添加订阅
            </Button>
          </Col>
        </Row>
      </Card>
      
      <Table
        columns={columns}
        dataSource={subscriptionList.filter(sub => 
          sub.topic_name.includes(searchText)
        )}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={isEditMode ? '编辑订阅' : '添加订阅'}
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
          initialValues={{ 
            push_method: 'wechat', 
            frequency: 'daily', 
            push_time: '09:00',
            status: true 
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="user_id"
                label="用户"
                rules={[{ required: true, message: '请选择用户' }]}
              >
                <Select placeholder="请选择用户">
                  {userList.map(user => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.nickname || user.username}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="topic_id"
                label="主题"
                rules={[{ required: true, message: '请选择主题' }]}
              >
                <Select placeholder="请选择主题">
                  {topicList.map(topic => (
                    <Select.Option key={topic.id} value={topic.id}>
                      {topic.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="push_method"
                label="推送方式"
                rules={[{ required: true, message: '请选择推送方式' }]}
              >
                <Select placeholder="请选择推送方式">
                  <Select.Option value="wechat">微信</Select.Option>
                  <Select.Option value="email">邮件</Select.Option>
                  <Select.Option value="sms">短信</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="frequency"
                label="推送频率"
                rules={[{ required: true, message: '请选择推送频率' }]}
              >
                <Select placeholder="请选择推送频率">
                  <Select.Option value="daily">每日</Select.Option>
                  <Select.Option value="weekly">每周</Select.Option>
                  <Select.Option value="monthly">每月</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="push_time"
            label="推送时间"
            rules={[{ required: true, message: '请输入推送时间' }]}
          >
            <Input placeholder="请输入推送时间，如: 09:00" />
          </Form.Item>
          
          <Form.Item
            name="filter_rules"
            label="过滤规则"
          >
            <Input.TextArea rows={3} placeholder="请输入过滤规则（JSON格式）" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
          >
            <Select placeholder="请选择状态">
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;
