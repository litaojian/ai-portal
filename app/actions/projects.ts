"use server";

import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { projectSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

export async function getProjects() {
  try {
    const data = await db.query.projects.findMany({
      orderBy: [desc(projects.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "获取项目列表失败" };
  }
}

export async function createProject(data: z.infer<typeof projectSchema>) {
  const result = projectSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "数据验证失败" };
  }

  try {
    await db.insert(projects).values(result.data);
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { success: false, error: "创建项目失败" };
  }
}

export async function updateProject(id: string, data: z.infer<typeof projectSchema>) {
  const result = projectSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "数据验证失败" };
  }

  try {
    await db.update(projects).set(result.data).where(eq(projects.id, id));
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { success: false, error: "更新项目失败" };
  }
}

export async function deleteProject(id: string) {
  try {
    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { success: false, error: "删除项目失败" };
  }
}
