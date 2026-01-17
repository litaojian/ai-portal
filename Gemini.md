# UI 库迁移任务：Shadcn/ui -> Ant Design v6

**状态:** 已完成

## 详细计划与进度

### 1. 环境清理

- [x] 卸载 Shadcn/ui 及其关联依赖 (`lucide-react`, `@radix-ui/*` 等)
- [x] 删除 `apps/web/components/ui` 目录
- [x] 删除 `apps/web/lib/utils.ts` 文件
- [x] 删除 `apps/web/components.json` 文件
- [x] 重置 `apps/web/tailwind.config.ts` 为基础配置
- [x] 清理 `apps/web/app/globals.css` 中由 Shadcn/ui 添加的样式

### 2. 安装与配置 Ant Design

- [x] 安装 `antd` 和 `@ant-design/cssinjs`
- [x] 创建 `apps/web/app/AntdRegistry.tsx` 用于服务端样式注入
- [x] 更新 `apps/web/app/layout.tsx` 以使用 `AntdRegistry`

### 3. 重构页面组件

- [x] 使用 Antd 组件重写 `apps/web/components/auth/login-form.tsx`
- [x] 使用 Antd 组件重写 `apps/web/components/auth/register-form.tsx`
- [x] 更新 `apps/web/app/page.tsx` 中的按钮为 Antd 组件