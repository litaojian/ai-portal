"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Icon Map
const iconMap: Record<string, any> = {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconFolder,
  IconUsers,
  IconCamera,
  IconFileDescription,
  IconFileAi,
  IconSettings,
  IconHelp,
  IconSearch,
  IconDatabase,
  IconReport,
  IconFileWord,
  IconInnerShadowTop
}

// Fallback user data
const userData = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

interface AppSidebarClientProps extends React.ComponentProps<typeof Sidebar> {
  menuData?: {
    navMain: any[];
    navSecondary: any[];
    documents: any[];
    navClouds?: any[];
  } | null;
}

export function AppSidebarClient({ menuData, ...props }: AppSidebarClientProps) {
  // Transform string icons to components
  const processItems = (items: any[]) => {
    if (!items) return [];
    return items.map((item) => ({
      ...item,
      icon: item.icon && iconMap[item.icon] ? iconMap[item.icon] : undefined,
    }));
  };

  const navMain = processItems(menuData?.navMain || []);
  const navSecondary = processItems(menuData?.navSecondary || []);
  const documents = processItems(menuData?.documents || []);
  // const navClouds = processItems(menuData?.navClouds || []); // Not used in current layout based on previous file, but was in data object.
  // Wait, previous file rendered NavMain, NavDocuments, NavSecondary. NavClouds was in data but NOT rendered in JSX.
  // I will ignore NavClouds for now to match previous rendering logic.

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">AI应用中心</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
