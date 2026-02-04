"use server";

import { db } from "@/lib/db";
import { menus } from "@/lib/db/schema";
import { getMenusFromConfig } from "@/lib/menu-service";
import { asc, eq, isNull } from "drizzle-orm";

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

    // Using Drizzle Query API to fetch menus with children
    const dbMenus = await db.query.menus.findMany({
      orderBy: [asc(menus.order)],
      with: {
        children: {
          orderBy: [asc(menus.order)],
        }
      }
    });

    const navClouds = dbMenus.filter((m: any) => m.group === "clouds" && !m.parentId);

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
