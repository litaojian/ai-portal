// app/admin/[pageId]/page.tsx
import PageBuilder from '@/components/dynamic-page/page-builder';
import { Metadata } from 'next';

interface PageProps {
  params: {
    pageId: string;
  };
  searchParams: {
    page?: string;
    search?: string;
  };
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  // 可以动态生成页面标题
  return {
    title: `${params.pageId} - 管理系统`,
  };
}

export default function AdminPage({ params, searchParams }: PageProps) {
  return (
    <div className="admin-page">
      <PageBuilder 
        pageId={params.pageId}
        mode="list"
      />
    </div>
  );
}