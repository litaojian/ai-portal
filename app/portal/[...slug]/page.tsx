import { getPageConfig } from "@/lib/page-config-loader";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import PageBuilder from "@/components/dynamic-page/page-builder";

interface PageProps {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<any>;
}

const SECTION_MAP: Record<string, string> = {
    admin: "系统管理",
    sales: "销售管理",
    hr: "人事管理",
    project: "项目管理",
};

export default async function PortalDynamicPage({ params }: PageProps) {
    const { slug } = await params;

    // Safety check
    if (!slug || slug.length === 0) {
        return notFound();
    }

    // Construct config key (e.g., "sales/orders" or just "orders")
    const configKey = slug.join('/');
    const config = await getPageConfig(configKey);
    const session = await getServerSession(authOptions);

    if (!config) {
        return notFound();
    }

    // Build breadcrumbs dynamically
    const breadcrumbs = [
        { label: "首页", href: "/" }
    ];

    // If there are multiple segments, try to map the first one (Section/Module)
    if (slug.length > 1) {
        const sectionKey = slug[0];
        const sectionLabel = SECTION_MAP[sectionKey] || sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);

        // We link the section to nothing for now, or could link to a dashboard if it exists
        breadcrumbs.push({ label: sectionLabel, href: "#" }); // or `/portal/${sectionKey}` if checking existence
    }

    // Final breadcrumb is the page title
    breadcrumbs.push({ label: config.meta.title, href: "#" });

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
                    breadcrumbs={breadcrumbs}
                />

                <div className="flex flex-1 flex-col gap-2 p-2 md:p-4">
                    <PageBuilder pageId={configKey} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
