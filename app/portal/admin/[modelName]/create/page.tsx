import { getPageConfig } from "@/lib/page-config-loader";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

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
import PageBuilder from "@/components/dynamic-page/page-builder";

interface PageProps {
    params: Promise<any>;
    searchParams: Promise<any>;
}

export default async function AdminDynamicCreatePage({ params }: PageProps) {
    const { modelName } = await params;
    const configKey = `admin/${modelName}`;
    const config = await getPageConfig(configKey);
    const session = await getServerSession(authOptions);


    if (!config) {
        return notFound();
    }

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

                <SiteHeader
                    user={session?.user}
                    breadcrumbs={[
                        { label: "首页", href: "/" },
                        { label: config.meta.title, href: `/portal/admin/${modelName}` },
                        { label: "新建" }
                    ]}
                />

                <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
                    <PageBuilder pageId={configKey} mode="create" />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
