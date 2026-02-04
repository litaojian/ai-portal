// app/admin/[pageId]/page.tsx
import PageBuilder from '@/components/dynamic-page/page-builder';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { pageId } = await params;
  // 可以动态生成页面标题
  return {
    title: `${pageId} - 管理系统`,
  };
}

export default async function AdminPage({ params, searchParams }: PageProps) {
  const { pageId } = await params;
  return (
    <div className="admin-page">
      <PageBuilder
        pageId={pageId}
        mode="list"
      />
    </div>
  );
}