"use server";

import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const requestResetSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, "无效的令牌"),
    password: z.string().min(6, "密码至少需要6个字符"),
});

export async function requestPasswordReset(formData: FormData) {
    const data = Object.fromEntries(formData);
    const result = requestResetSchema.safeParse(data);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { email } = result.data;

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            // Don't reveal user existence
            return { success: true, message: "如果该邮箱存在，重置链接已发送" };
        }

        // Generate token
        const token = crypto.randomUUID();
        const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

        // Delete existing token if any
        await db.delete(verificationTokens).where(
            and(
                eq(verificationTokens.identifier, email)
            )
        );

        // Save token
        await db.insert(verificationTokens).values({
            identifier: email,
            token,
            expires,
        });

        // Mock Email Sending - Log to console
        const resetLink = `http://localhost:3000/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        console.log("=================================================");
        console.log(" PASSWORD RESET LINK (MOCKED):");
        console.log(` To: ${email}`);
        console.log(` Link: ${resetLink}`);
        console.log("=================================================");

        return { success: true, message: "重置链接已发送，请检查您的邮箱（或控制台）" };
    } catch (error) {
        console.error("Reset request error:", error);
        return { error: "请求失败，请稍后重试" };
    }
}

export async function resetPassword(formData: FormData) {
    const data = Object.fromEntries(formData);
    const result = resetPasswordSchema.safeParse(data);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { token, password } = result.data;

    try {
        // Find token matching the token string. 
        // Note: verificationTokens PK is compound, but we search by token usually.
        // However, schema definition says unique on (identifier, token).
        // We should probably pass email/identifier too, but let's try finding by token first if unique enough?
        // Actually, verificationToken definition has `token` as part of unique index, but strictly speaking `token` column isn't unique globally in schema def unless we made it so.
        // But crypto UUID is practically unique. 
        // Let's rely on finding by token. Ideally pass email too for security double check.

        // For this implementation, let's look up by token.
        const validToken = await db.query.verificationTokens.findFirst({
            where: eq(verificationTokens.token, token),
        });

        if (!validToken) {
            return { error: "无效或过期的重置链接" };
        }

        if (new Date() > validToken.expires) {
            return { error: "重置链接已过期，请重新请求" };
        }

        const email = validToken.identifier;

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update User
        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.email, email));

        // Delete used token
        await db.delete(verificationTokens).where(
            eq(verificationTokens.token, token)
        );

        return { success: true, message: "密码重置成功，请登录" };
    } catch (error) {
        console.error("Reset password error:", error);
        return { error: "重置失败，请稍后重试" };
    }
}
