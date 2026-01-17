'use client';

import { useState, useTransition } from 'react';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
// NOTE: We will need a register server action in the future.
// import { register } from '@/actions/auth';
import { RegisterSchema } from '@/lib/schemas';

const { Title } = Typography;

export const RegisterForm = () => {
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const [form] = Form.useForm();

  const onFinish = (values: unknown) => {
    setError('');
    setSuccess('');

    const validatedFields = RegisterSchema.safeParse(values);
    if (!validatedFields.success) {
      setError('Invalid fields');
      return;
    }

    startTransition(() => {
      // NOTE: Replace with actual register server action call
      console.log(validatedFields.data);
      // Example of how it would look:
      // register(validatedFields.data).then((data) => {
      //   setError(data.error);
      //   setSuccess(data.success);
      // });
      setSuccess('注册功能待实现! (查看控制台输出)');
    });
  };

  return (
    <Card style={{ width: 400 }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
        创建账户
      </Title>
      <Form
        form={form}
        name="register"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label="用户名"
          rules={[{ required: true, message: '请输入您的用户名!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Your Name"
            disabled={isPending}
          />
        </Form.Item>

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
          rules={[
            { required: true, message: '请输入您的密码!' },
            { min: 6, message: '密码长度不能少于6位!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="********"
            disabled={isPending}
          />
        </Form.Item>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '24px' }} />}
        {success && <Alert message={success} type="success" showIcon style={{ marginBottom: '24px' }} />}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isPending}
            style={{ width: '100%' }}
          >
            注册
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          已经有账户了? <Link href="/auth/login">前往登录</Link>
        </div>
      </Form>
    </Card>
  );
};