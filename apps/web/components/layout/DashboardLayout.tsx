'use client';

import React, { useState } from 'react';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Button, Avatar, Space, Typography } from 'antd';
import { signOut, useSession } from 'next-auth/react';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Dashboard', '1', <PieChartOutlined />),
  getItem('分析页', '2', <DesktopOutlined />),
  getItem('监控页', '3', <FileOutlined />),
  getItem('工作台', '4', <UserOutlined />),
  getItem('表单页', 'sub1', <TeamOutlined />, [
    getItem('基础表单', '5'),
    getItem('高级表单', '6'),
  ]),
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
      >
        <div style={{ height: 32, margin: 16, background: 'rgba(0, 0, 0, .1)', textAlign: 'center', lineHeight: '32px', color: '#1677ff', fontWeight: 'bold' }}>
          {collapsed ? 'AI' : 'AI Portal'}
        </div>
        <Menu theme="light" defaultSelectedKeys={['1']} mode="inline" items={items} />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
           <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space>
            <Avatar icon={<UserOutlined />} />
            <Text>{session?.user?.name ?? 'Guest'}</Text>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => signOut()}
            >
              登出
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#f0f2f5' }}>
            {children}
        </Content>
      </Layout>
    </Layout>
  );
};
