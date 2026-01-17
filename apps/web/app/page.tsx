
import { auth, signOut } from '@/auth';
import { Button, Card, Typography } from 'antd';

const { Title, Text } = Typography;

export default async function HomePage() {
  const session = await auth();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Title level={2}>欢迎回来!</Title>
          <Text style={{ fontSize: '16px', marginBottom: '24px', display: 'block' }}>
            {session?.user?.name ?? 'Guest'}
          </Text>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <Button type="primary" htmlType="submit">
              登出
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}