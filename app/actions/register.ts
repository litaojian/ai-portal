"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2, "用户名至少需要2个字符"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少需要6个字符"),
});

export async function registerUser(formData: FormData) {
    const data = Object.fromEntries(formData);
    const result = registerSchema.safeParse(data);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { name, email, password } = result.data;

    try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return { error: "该邮箱已被注册" };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: "USER",
        });

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "注册失败，请稍后重试" };
    }
}
