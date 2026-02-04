import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any, // Cast to any to avoid type issues with adapter version mismatch
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          // 测试账号自动创建逻辑
          if (!user && email === "admin@example.com" && password === "123456") {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
              id: crypto.randomUUID(),
              email,
              password: hashedPassword,
              name: "管理员",
              role: "ADMIN",
              emailVerified: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await db.insert(users).values(newUser);
            return newUser;
          }

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};
