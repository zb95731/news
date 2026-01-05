import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string; email: string }) => {
    setLoading(true);
    try {
      // 模拟注册请求
      // 实际项目中应该替换为真实的API调用
      console.log('Register request:', values);
      
      // 模拟注册成功
      message.success('注册成功');
      // 跳转到登录页
      navigate('/login');
    } catch (error) {
      message.error('注册失败，请稍后重试');
      console.error('Register failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="注册" bordered={false}>
      <Form
        name="normal_register"
        className="register-form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名!' },
            { min: 4, message: '用户名长度不能小于4位' },
            { max: 20, message: '用户名长度不能大于20位' }
          ]}
        >
          <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="用户名" />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱!' },
            { type: 'email', message: '请输入有效的邮箱地址!' }
          ]}
        >
          <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="邮箱" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码!' },
            { min: 6, message: '密码长度不能小于6位' }
          ]}
        >
          <Input
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="密码"
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致!'));
              },
            }),
          ]}
        >
          <Input
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="确认密码"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" className="register-form-button" loading={loading}>
            注册
          </Button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="/login">已有账号? 登录</Link>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Register;
