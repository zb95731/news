import { Layout, Menu, theme } from 'antd';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import React from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import NewsManagement from './pages/NewsManagement';
import NewsDetail from './pages/NewsDetail';
import TopicManagement from './pages/TopicManagement';
import SubscriptionManagement from './pages/SubscriptionManagement';
import Dashboard from './pages/Dashboard';
import { UserOutlined, FileTextOutlined, TagOutlined, BellOutlined, DashboardOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
  
  const { token: { colorBgContainer } } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isAuthRoute && (
        <>
          <Header style={{ display: 'flex', alignItems: 'center', backgroundColor: '#001529' }}>
            <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '20px' }}>新闻管理系统</div>
            <Menu 
              theme="dark" 
              mode="horizontal" 
              defaultSelectedKeys={['1']} 
              style={{ flex: 1, minWidth: 0, backgroundColor: '#001529' }}
            >
              <Menu.Item key="1" icon={<DashboardOutlined />}><Link to="/">首页</Link></Menu.Item>
              <Menu.Item key="2" icon={<FileTextOutlined />}><Link to="/news">新闻管理</Link></Menu.Item>
              <Menu.Item key="3" icon={<TagOutlined />}><Link to="/topics">主题管理</Link></Menu.Item>
              <Menu.Item key="4" icon={<BellOutlined />}><Link to="/subscriptions">订阅管理</Link></Menu.Item>
              <Menu.Item key="5" icon={<UserOutlined />}><Link to="/profile">个人中心</Link></Menu.Item>
              <Menu.Item key="6" icon={<UserOutlined />}><Link to="/login">退出登录</Link></Menu.Item>
            </Menu>
          </Header>
          <Layout>
            <Sider width={200} style={{ background: colorBgContainer }}>
              <Menu
                mode="inline"
                defaultSelectedKeys={['1']}
                style={{ height: '100%', borderRight: 0 }}
              >
                <Menu.Item key="1" icon={<DashboardOutlined />}><Link to="/">首页</Link></Menu.Item>
                <Menu.Item key="2" icon={<FileTextOutlined />}><Link to="/news">新闻管理</Link></Menu.Item>
                <Menu.Item key="3" icon={<TagOutlined />}><Link to="/topics">主题管理</Link></Menu.Item>
                <Menu.Item key="4" icon={<BellOutlined />}><Link to="/subscriptions">订阅管理</Link></Menu.Item>
                <Menu.Item key="5" icon={<UserOutlined />}><Link to="/profile">个人中心</Link></Menu.Item>
              </Menu>
            </Sider>
            <Layout style={{ padding: '0 24px 24px' }}>
              <Content
                style={{
                  padding: 24,
                  margin: 0,
                  minHeight: 280,
                  background: colorBgContainer,
                }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/news" element={<NewsManagement />} />
                  <Route path="/news/:id" element={<NewsDetail />} />
                  <Route path="/topics" element={<TopicManagement />} />
                  <Route path="/subscriptions" element={<SubscriptionManagement />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </>
      )}
      
      {isAuthRoute && (
        <Content
          style={{
            padding: 24,
            margin: '64px auto',
            maxWidth: 500,
            background: colorBgContainer,
            borderRadius: 8,
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Content>
      )}
    </Layout>
  );
};

export default App;
