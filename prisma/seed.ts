import { PrismaClient } from "./generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding menus...");

  // 清理旧数据
  await prisma.menu.deleteMany();

  // 1. Nav Main
  await prisma.menu.create({ data: { title: "仪表盘", url: "/dashboard", icon: "IconDashboard", group: "main", order: 1 } });
  await prisma.menu.create({ data: { title: "项目管理", url: "/projects", icon: "IconFolder", group: "main", order: 2 } });
  await prisma.menu.create({ data: { title: "生命周期", url: "#", icon: "IconListDetails", group: "main", order: 3 } });
  await prisma.menu.create({ data: { title: "数据分析", url: "#", icon: "IconChartBar", group: "main", order: 4 } });
  await prisma.menu.create({ data: { title: "团队成员", url: "#", icon: "IconUsers", group: "main", order: 5 } });

  // 2. Nav Secondary
  await prisma.menu.create({ data: { title: "设置", url: "#", icon: "IconSettings", group: "secondary", order: 1 } });
  await prisma.menu.create({ data: { title: "获取帮助", url: "#", icon: "IconHelp", group: "secondary", order: 2 } });
  await prisma.menu.create({ data: { title: "搜索", url: "#", icon: "IconSearch", group: "secondary", order: 3 } });

  // 3. Documents
  await prisma.menu.create({ data: { title: "数据仓库", url: "#", icon: "IconDatabase", group: "documents", order: 1 } });
  await prisma.menu.create({ data: { title: "报表中心", url: "#", icon: "IconReport", group: "documents", order: 2 } });
  await prisma.menu.create({ data: { title: "文档助手", url: "#", icon: "IconFileWord", group: "documents", order: 3 } });

  // 4. Nav Clouds (Nested)
  const capture = await prisma.menu.create({ 
    data: { title: "Capture", url: "#", icon: "IconCamera", group: "clouds", order: 1 } 
  });
  await prisma.menu.create({ data: { title: "Active Proposals", url: "#", parentId: capture.id, group: "clouds", order: 1 } });
  await prisma.menu.create({ data: { title: "Archived", url: "#", parentId: capture.id, group: "clouds", order: 2 } });

  console.log("Seeding completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
