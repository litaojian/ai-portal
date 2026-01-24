import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          // 检查用户是否存在于数据库
          const user = await prisma.user.findUnique({
            where: { email },
          });

          // 如果没有用户，且是第一次登录（测试用），我们可以自动创建一个测试账号
          // 注意：这仅用于开发环境演示
          if (!user && email === "admin@example.com" && password === "123456") {
            const hashedPassword = await bcrypt.hash(password, 10);
            return await prisma.user.create({
              data: {
                email,
                password: hashedPassword,
                name: "管理员",
                role: "ADMIN",
              },
            });
          }

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;