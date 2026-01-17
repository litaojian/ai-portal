
'use server';

import * as z from 'zod';
import { signIn } from '@/auth';
import { LoginSchema } from '@/lib/schemas';
import { AuthError } from 'next-auth';

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: '输入无效!' };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/', // Redirect to home page on successful login
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: '邮箱或密码错误!' };
        default:
          return { error: '发生未知错误!' };
      }
    }
    throw error; // Rethrow other errors
  }

  return { success: '登录成功!' };
}
