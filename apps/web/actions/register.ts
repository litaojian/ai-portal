'use server';

import { PrismaClient } from '@prisma/client';
import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { RegisterSchema } from '@/lib/schemas';

const prisma = new PrismaClient();

export async function register(values: z.infer<typeof RegisterSchema>) {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: '输入无效!' };
  }

  const { name, email, password } = validatedFields.data;
  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: '该邮箱已被注册!' };
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { success: '注册成功!' };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: '发生未知错误!' };
  }
}
