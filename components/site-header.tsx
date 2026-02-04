import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { NavUser } from "@/components/nav-user"

interface SiteHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
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
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="ml-auto flex items-center gap-2">
          <NavUser user={currentUser} />
        </div>
      </div>
    </header>
  )
}
