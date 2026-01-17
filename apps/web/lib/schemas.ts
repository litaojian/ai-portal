
import * as z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
  password: z.string().min(1, {
    message: '请输入密码',
  }),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, {
    message: '请输入用户名',
  }),
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
  password: z.string().min(6, {
    message: '密码长度不能少于6位',
  }),
});
