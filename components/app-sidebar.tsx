import * as React from "react"
import { getMenus } from "@/app/actions/menus"
import { AppSidebarClient } from "./app-sidebar-client"
import { Sidebar } from "@/components/ui/sidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const menuData = await getMenus();
  const session = await getServerSession(authOptions);

  return <AppSidebarClient menuData={menuData} user={session?.user} {...props} />;
}