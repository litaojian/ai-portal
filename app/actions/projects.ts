"use server";

import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: projects };
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
    await prisma.project.create({
      data: result.data,
    });
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
    await prisma.project.update({
      where: { id },
      data: result.data,
    });
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { success: false, error: "更新项目失败" };
  }
}

export async function deleteProject(id: string) {
  try {
    await prisma.project.delete({
      where: { id },
    });
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { success: false, error: "删除项目失败" };
  }
}
