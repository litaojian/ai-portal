import * as React from "react"
import { getMenus } from "@/app/actions/menus"
import { AppSidebarClient } from "./app-sidebar-client"
import { Sidebar } from "@/components/ui/sidebar"

export async function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const menuData = await getMenus();

  return <AppSidebarClient menuData={menuData} {...props} />;
}