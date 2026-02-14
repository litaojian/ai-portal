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
  IconShield,
  IconKey,
  IconDeviceDesktop,
  IconActivityHeartbeat,
  IconFile
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,

  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Icon Map
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
  IconShield,
  IconDeviceDesktop,
  IconActivityHeartbeat,
  IconFile,
}

interface MenuItem {
  title: string;
  url?: string;
  icon?: string | React.ComponentType<{ className?: string }>;
  items?: MenuItem[];
  badge?: string;
  description?: string;
  isActive?: boolean;
}

interface ProcessedMenuItem extends Omit<MenuItem, 'icon' | 'items'> {
  icon?: React.ComponentType<{ className?: string }>;
  items?: ProcessedMenuItem[];
}

interface AppSidebarClientProps extends React.ComponentProps<typeof Sidebar> {
  menuData?: {
    navMain: MenuItem[];
    navSecondary: MenuItem[];
    navApps: MenuItem[];
    navClouds?: MenuItem[];
  } | null;
}

export function AppSidebarClient({ menuData, ...props }: AppSidebarClientProps) {
  // Transform string icons to components
  const processItems = (items: MenuItem[]): ProcessedMenuItem[] => {
    if (!items) return [];
    return items.map((item) => ({
      ...item,
      icon: typeof item.icon === 'string' && iconMap[item.icon] ? iconMap[item.icon] : (typeof item.icon === 'string' && item.icon === 'IconFile' ? IconFile : item.icon as React.ComponentType<{ className?: string }> | undefined),
      items: item.items ? processItems(item.items) : undefined,
    }));
  };



  const navMain = React.useMemo(() => processItems(menuData?.navMain || []), [menuData]);

  // State to track active item and its children
  const [activeItem, setActiveItem] = React.useState<ProcessedMenuItem | undefined>(navMain[0]);
  const [children, setChildren] = React.useState<ProcessedMenuItem[]>(navMain[0]?.items || []);
  const { setOpen } = useSidebar();
  const pathname = usePathname();

  // Sync active state with URL
  React.useEffect(() => {
    if (!pathname || !navMain.length) return;

    const findMatch = () => {
      for (const item of navMain) {
        if (item.url && pathname === item.url) return item;
        if (item.items) {
          const childMatch = item.items.find(child => child.url && pathname.startsWith(child.url));
          if (childMatch) return item;
        }
      }
      return undefined;
    };

    const match = findMatch();
    if (match && match.title !== activeItem?.title) {
      setActiveItem(match);
      setChildren(match.items || []);
      setOpen(true);
    }
  }, [pathname, navMain, setOpen]);


  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* First Sidebar - Icon Navigation */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <IconInnerShadowTop className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">AI应用中心</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navMain.map((item) => {
                  const Icon = item.icon || IconDashboard;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.title,
                          hidden: false,
                        }}
                        onClick={() => {
                          setActiveItem(item);
                          setChildren(item.items || []);
                          if (item.items && item.items.length > 0) {
                            setOpen(true);
                          }
                        }}
                        isActive={activeItem?.title === item.title}
                        className="px-2.5 md:px-2"
                        asChild={!item.items || item.items.length === 0}
                      >
                        {!item.items || item.items.length === 0 ? (
                          <Link href={item.url || "#"}>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        ) : (
                          <>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>


      </Sidebar>

      {/* Second Sidebar - Content/Children Navigation */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title || "导航"}
            </div>
          </div>
          <SidebarInput placeholder="搜索..." />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {children && children.length > 0 ? (
                children.map((child) => {
                  const ChildIcon = child.icon || IconFolder;
                  return (
                    <Link
                      href={child.url || "#"}
                      key={child.title}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0"
                    >
                      <div className="flex w-full items-center gap-2">
                        <ChildIcon className="size-4" />
                        <span className="font-medium">{child.title}</span>
                        {child.badge && (
                          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {child.badge}
                          </span>
                        )}
                      </div>
                      {child.description && (
                        <span className="text-xs text-muted-foreground">
                          {child.description}
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <IconFolder className="size-8 mb-2 opacity-50" />
                  <p className="text-sm">暂无子菜单</p>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar >
  )
}
