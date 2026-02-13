import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { NavUser } from "@/components/nav-user"

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface SiteHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  breadcrumbs?: BreadcrumbItemType[];
}

export function SiteHeader({ user, breadcrumbs }: SiteHeaderProps) {
  // Fallback user data
  const defaultUserData = {
    name: "Guest",
    email: "guest@example.com",
    avatar: "",
  }

  const currentUser = user ? {
    name: user.name || "User",
    email: user.email || "",
    avatar: user.image || "",
  } : defaultUserData;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem className="hidden md:block">
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : item.href ? (
                      <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className="ml-auto flex items-center gap-2">
          <NavUser user={currentUser} />
        </div>
      </div>
    </header>
  )
}
