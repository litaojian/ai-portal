import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { OrdersContent } from "./orders-content";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  const breadcrumbs = [
    { label: "首页", href: "/" },
    { label: "销售管理" },
    { label: "销售订单" },
  ];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader user={session?.user} breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col p-6">
          <OrdersContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
