"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { count, desc, eq, like, or } from "drizzle-orm";

// Validation Schemas
const userCreateSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
  email: z.string().email("无效的邮箱格式"),
  password: z.string().min(6, "密码至少6个字符"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

const userUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "姓名至少2个字符"),
  email: z.string().email("无效的邮箱格式"),
  password: z.string().optional(), // Optional for update
  role: z.enum(["USER", "ADMIN"]),
});

// GET: Fetch Users with pagination and search
export async function getUsers(query?: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  let whereClause = undefined;

  if (query) {
    whereClause = or(
      like(users.name, `%${query}%`),
      like(users.email, `%${query}%`)
    );
  }

  const [data, totalCount] = await Promise.all([
    db.query.users.findMany({
      where: whereClause,
      limit,
      offset: skip,
      orderBy: [desc(users.createdAt)],
      columns: {
        password: false, // Exclude password
      }
    }),
    db.select({ count: count() }).from(users).where(whereClause),
  ]);

  return { data, total: totalCount[0].count, page, limit, totalPages: Math.ceil(totalCount[0].count / limit) };
}

// POST: Create User
export async function createUser(formData: z.infer<typeof userCreateSchema>) {
  try {
    const validated = userCreateSchema.parse(formData);

    // Check duplication
    const existing = await db.query.users.findFirst({
      where: eq(users.email, validated.email)
    });

    if (existing) {
      return { success: false, error: "该邮箱已被注册" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    await db.insert(users).values({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      role: validated.role,
      emailVerified: new Date(),
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Create User Error:", error);
    return { success: false, error: "创建用户失败" };
  }
}

// PUT: Update User
export async function updateUser(formData: z.infer<typeof userUpdateSchema>) {
  try {
    const { id, password, ...data } = userUpdateSchema.parse(formData);

    const updateData: any = { ...data };

    // Update password only if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Update User Error:", error);
    return { success: false, error: "更新用户失败" };
  }
}

// DELETE: Delete User
export async function deleteUser(id: string) {
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "删除用户失败" };
  }
}
