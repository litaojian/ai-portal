"use server";

import { prisma } from "@/lib/prisma";
import { getMenusFromConfig } from "@/lib/menu-service";

export async function getMenus() {
  try {
    // 1. Fetch from JSON Config
    const configMenus = await getMenusFromConfig();
    
    // Mapping rules:
    // - main.json -> navMain
    // - second.json -> navSecondary
    // - others -> navApps
    
    const navMain = configMenus.filter(m => m.id === "main");
    
    // For secondary, we want the items INSIDE the second.json config
    const secondMenuConfig = configMenus.find(m => m.id === "second");
    const navSecondary = secondMenuConfig?.items || [];
    
    const navApps = configMenus.filter(m => m.id !== "main" && m.id !== "second");

    // 2. Fetch from Database (Optional: Keep clouds from DB or remove if fully file-based)
    // For now, I will keep 'clouds' from DB as it wasn't mentioned in the override, 
    // but I will ensure navApps ONLY comes from the "other" JSON files as requested.
    
    const dbMenus = await prisma.menu.findMany({
      orderBy: { order: "asc" },
      include: { children: { orderBy: { order: "asc" } } },
    });
    const navClouds = dbMenus.filter(m => m.group === "clouds" && !m.parentId);

    const formatMenu = (menu: any) => ({
      title: menu.title,
      url: menu.url,
      icon: menu.icon,
      items: menu.children?.map((child: any) => ({
        title: child.title,
        url: child.url,
      })),
      isActive: false, 
    });

    return {
      navMain: navMain,
      navSecondary: navSecondary,
      navApps: navApps,
      navClouds: navClouds.map(formatMenu),
    };

  } catch (error) {
    console.error("Failed to fetch menus:", error);
    return {
      navMain: [],
      navSecondary: [],
      navApps: [],
      navClouds: [],
    };
  }
}
