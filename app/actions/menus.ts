"use server";

import { prisma } from "@/lib/prisma";
import { mockMenus } from "@/app/dashboard/data/mock-menus";

export async function getMenus() {
  if (process.env.USE_MOCK_DATA === "true") {
    return mockMenus;
  }

  try {
    const menus = await prisma.menu.findMany({
      orderBy: { order: "asc" },
      include: { children: { orderBy: { order: "asc" } } },
    });

    // 可以在这里按 group 分组，或者返回平铺数据由前端处理。
    // 为了前端方便，这里只返回数据，不做复杂转换，但在 Client Component 中可能需要转换 Icon。
    // 但是，AppSidebar 期望的数据结构是分组的：navMain, navSecondary, etc.
    // 所以我在这里把数据转换好。

    const navMain = menus.filter(m => m.group === "main" && !m.parentId);
    const navSecondary = menus.filter(m => m.group === "secondary" && !m.parentId);
    const documents = menus.filter(m => m.group === "documents" && !m.parentId);
    const navClouds = menus.filter(m => m.group === "clouds" && !m.parentId);

    // 对于 Clouds，它们有 children。Prisma 的 include 已经获取了 children。
    // 我们需要把 children 映射为 items 属性 (AppSidebar 需要的格式)
    
    const formatMenu = (menu: any) => ({
      title: menu.title,
      url: menu.url,
      icon: menu.icon, // String name, will map in frontend
      items: menu.children?.map((child: any) => ({
        title: child.title,
        url: child.url,
      })),
      isActive: false, // Default
    });

    return {
      navMain: navMain.map(formatMenu),
      navSecondary: navSecondary.map(formatMenu),
      documents: documents.map(menu => ({ name: menu.title, url: menu.url, icon: menu.icon })), // documents 格式略有不同
      navClouds: navClouds.map(formatMenu),
    };

  } catch (error) {
    console.error("Failed to fetch menus:", error);
    return mockMenus;
  }
}
