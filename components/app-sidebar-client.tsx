"use client"

import * as React from "react"
import {
  IconApps,
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
  IconBolt,
  IconShoppingCart,
  IconUserShield,
  IconKey,
  IconDeviceDesktop,
} from "@tabler/icons-react"

import { NavApps } from "@/components/nav-apps"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Icon Map
const iconMap: Record<string, any> = {
  IconApps,
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
  IconInnerShadowTop,
  IconBolt,
  IconShoppingCart,
  IconUserShield,
  IconKey,
  IconDeviceDesktop,
}

// Fallback user data
const defaultUserData = {
  name: "Guest",
  email: "guest@example.com",
  avatar: "",
}

interface AppSidebarClientProps extends React.ComponentProps<typeof Sidebar> {
  menuData?: {
    navMain: any[];
    navSecondary: any[];
    navApps: any[];
    navClouds?: any[];
  } | null;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function AppSidebarClient({ menuData, user, ...props }: AppSidebarClientProps) {
  const [query, setQuery] = React.useState("")

  // Transform string icons to components
  const processItems = (items: any[]): any[] => {
    if (!items) return [];
    return items.map((item) => ({
      ...item,
      icon: item.icon && iconMap[item.icon] ? iconMap[item.icon] : undefined,
      items: item.items ? processItems(item.items) : undefined,
    }));
  };

  const navMain = processItems(menuData?.navMain || []);
  const navSecondary = processItems(menuData?.navSecondary || []);
  const navApps = processItems(menuData?.navApps || []);
  const navClouds = processItems(menuData?.navClouds || []);
  
  const currentUser = user ? {
    name: user.name || "User",
    email: user.email || "",
    avatar: user.image || "",
  } : defaultUserData;

  const filterItems = (items: any[]) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    
    return items.reduce((acc: any[], item) => {
      const matchesTitle = item.title?.toLowerCase().includes(lowerQuery);
      
      const filteredChildren = item.items?.filter((child: any) => 
        child.title?.toLowerCase().includes(lowerQuery)
      );
      
      if (matchesTitle) {
        acc.push({ ...item, isActive: true });
      } else if (filteredChildren && filteredChildren.length > 0) {
        acc.push({ ...item, items: filteredChildren, isActive: true });
      }
      
      return acc;
    }, []);
  };

  const filteredNavMain = filterItems(navMain);

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
        <SidebarInput 
          placeholder="搜索菜单..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavApps items={navApps} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
