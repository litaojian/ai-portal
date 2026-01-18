
'use server';

import * as z from 'zod';
import { LoginSchema } from '@/lib/schemas';
import bcryptjs from 'bcryptjs';
import { authOptions } from '@/auth';

const demoUser = {
  id: '1',
  email: 'user@example.com',
  // This should be the same hashed password as in your authOptions
  password: '$2a$10$wGr/O/a3.FwSUd3.c.hDve.aJ.8P.v.2s.3.j1f.S.x/U6w.g4j.K', 
  name: 'Demo User',
};

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: '输入无效!' };
  }

  const { email, password } = validatedFields.data;

  // Manual credential check
  if (email !== demoUser.email) {
    return { error: '邮箱或密码错误!' };
  }

  const isPasswordCorrect = await bcryptjs.compare(password, demoUser.password);

  if (!isPasswordCorrect) {
    return { error: '邮箱或密码错误!' };
  }

  return { success: '登录成功!' };
}
