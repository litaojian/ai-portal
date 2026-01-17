'use client';

import { useState, useTransition } from 'react';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { login } from '@/actions/auth';
import { LoginSchema } from '@/lib/schemas';

const { Title } = Typography;

export const LoginForm = () => {
  const [error, setError] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const [form] = Form.useForm();

  const onFinish = (values: unknown) => {
    setError('');
    const validatedFields = LoginSchema.safeParse(values);
    if (!validatedFields.success) {
      // This is a fallback, antd's own validation should prevent this.
      setError('Invalid fields');
      return;
    }

    startTransition(() => {
      login(validatedFields.data).then((data) => {
        if (data?.error) {
          setError(data.error);
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