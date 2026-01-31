import { getPageConfig } from "@/lib/page-config-loader";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicTable } from "@/components/dynamic-page/dynamic-table";

interface PageProps {
  params: Promise<{ modelName: string }>;
}

async function getMockData(modelName: string) {
    // In a real scenario, this would call the DB or an API
    if (modelName === "orders") {
        return [
          { id: "1", orderNo: "ORD-20231001", customerName: "Acme Corp", amount: 1200.50, status: "paid", orderDate: "2023-10-01T10:00:00Z" },
          { id: "2", orderNo: "ORD-20231002", customerName: "Globex", amount: 850.00, status: "pending", orderDate: "2023-10-02T14:30:00Z" },
          { id: "3", orderNo: "ORD-20231005", customerName: "Soylent Corp", amount: 2300.00, status: "shipped", orderDate: "2023-10-05T09:15:00Z" },
        ];
    }
    return [];
}

export default async function DynamicListPage({ params }: PageProps) {
  const { modelName } = await params;
  const config = await getPageConfig(modelName);

  if (!config) {
    return notFound();
  }

  const data = await getMockData(modelName);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">首页</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{config.meta.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
            <div className="flex items-center justify-between space-y-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{config.meta.title}</h2>
                <p className="text-muted-foreground">{config.meta.description}</p>
              </div>
            </div>
            
            <DynamicTable config={config} data={data} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
