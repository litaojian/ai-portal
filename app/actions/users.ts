"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

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
  const where: any = {};

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { email: { contains: query } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        // Exclude password
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// POST: Create User
export async function createUser(formData: z.infer<typeof userCreateSchema>) {
  try {
    const validated = userCreateSchema.parse(formData);
    
    // Check duplication
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (existing) {
      return { success: false, error: "该邮箱已被注册" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
      },
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

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

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
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "删除用户失败" };
  }
}
