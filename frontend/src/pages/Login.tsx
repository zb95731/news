import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // 模拟登录请求
      // 实际项目中应该替换为真实的API调用
      console.log('Login request:', values);
      
      // 模拟登录成功
      message.success('登录成功');
      // 保存token到localStorage
      localStorage.setItem('token', 'mock-token');
      // 跳转到首页
      navigate('/');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="登录" bordered={false}>
      <Form
        name="normal_login"
        className="login-form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="用户名" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="密码"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
            登录
          </Button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="/register">注册新账号</Link>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Login;
