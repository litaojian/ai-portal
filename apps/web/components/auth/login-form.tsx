'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { LoginSchema } from '@/lib/schemas';
import * as z from 'zod';

const { Title } = Typography;

export const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const [form] = Form.useForm();

  const onFinish = (values: z.infer<typeof LoginSchema>) => {
    setError('');
    
    startTransition(() => {
      signIn('credentials', {
        ...values,
        redirect: false, // We handle redirect manually
      }).then((callback) => {
        if (callback?.error) {
          setError('邮箱或密码错误!');
        } else if (callback?.ok) {
          window.location.href = '/';
        }
      });
    });
  };

  return (
    <Card style={{ width: 400 }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
        登录
      </Title>
      <Form
        form={form}
        name="login"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入您的邮箱!' },
            { type: 'email', message: '请输入有效的邮箱地址!' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="user@example.com"
            disabled={isPending}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入您的密码!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="********"
            disabled={isPending}
          />
        </Form.Item>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '24px' }} />}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isPending}
            style={{ width: '100%' }}
          >
            登录
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          还没有账户? <Link href="/auth/register">立即注册</Link>
        </div>
      </Form>
    </Card>
  );
};