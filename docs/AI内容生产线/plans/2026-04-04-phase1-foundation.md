# Phase 1: 基础骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 AI 获客系统的技术底座——Next.js 全栈项目、数据库模型、认证系统、基础 UI 布局、Docker 开发环境，为后续 Phase 2-4 提供可运行的骨架。

**Architecture:** Next.js 14 App Router 全栈单体应用，Prisma ORM 连接 PostgreSQL，Redis 用于缓存和 BullMQ 队列，NextAuth.js 处理认证。前端用 shadcn/ui + Tailwind CSS。开发环境通过 Docker Compose 提供 PostgreSQL 和 Redis。

**Tech Stack:** TypeScript 5, Next.js 14, Prisma 5, PostgreSQL 16, Redis 7, BullMQ 5, NextAuth.js 5, shadcn/ui, Tailwind CSS, Docker Compose

**Spec:** `docs/superpowers/specs/2026-04-04-ai-customer-acquisition-design.md`

**Scope:** Phase 1 only — 项目初始化、数据库模型、认证、基础布局、Docker 环境。不包含线索引擎、AI 引擎、触达引擎等业务逻辑。

---

## File Structure

```
crm-bot/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with providers
│   │   ├── page.tsx                      # Landing / redirect to dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # Login page
│   │   │   └── layout.tsx                # Auth layout (centered)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   │   ├── dashboard/page.tsx        # Dashboard placeholder
│   │   │   ├── leads/page.tsx            # Leads placeholder
│   │   │   ├── campaigns/page.tsx        # Campaigns placeholder
│   │   │   ├── sequences/page.tsx        # Sequences placeholder
│   │   │   ├── templates/page.tsx        # Templates placeholder
│   │   │   └── settings/page.tsx         # Settings placeholder
│   │   └── api/
│   │       └── auth/[...nextauth]/route.ts  # NextAuth API route
│   │
│   ├── lib/
│   │   ├── db.ts                         # Prisma client singleton
│   │   ├── auth.ts                       # NextAuth configuration
│   │   └── redis.ts                      # Redis client singleton
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components (installed via CLI)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx               # Sidebar navigation
│   │   │   ├── header.tsx                # Top header bar
│   │   │   └── providers.tsx             # SessionProvider + theme
│   │   └── auth/
│   │       └── login-form.tsx            # Login form component
│   │
│   └── types/
│       └── index.ts                      # Shared type exports
│
├── prisma/
│   ├── schema.prisma                     # All data models
│   └── seed.ts                           # Seed data for dev
│
├── docker-compose.yml                    # PostgreSQL + Redis
├── .env.example                          # Environment template
├── .env.local                            # Local env (gitignored)
├── tailwind.config.ts
├── components.json                       # shadcn/ui config
├── package.json
├── tsconfig.json
└── next.config.mjs
```

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `.env.example`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd C:/Users/litao/OneDrive/1AI-Lab/crm-bot
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with Next.js 14, TypeScript, Tailwind, App Router, src/ directory.

- [ ] **Step 2: Install core dependencies**

```bash
npm install prisma @prisma/client bullmq ioredis next-auth@beta @auth/prisma-adapter @anthropic-ai/sdk resend zod zustand react-hook-form @hookform/resolvers
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D tsx @types/node
```

- [ ] **Step 4: Create .env.example**

Create `.env.example`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_bot

# Redis
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM_DOMAIN=mail.yourdomain.com
```

- [ ] **Step 5: Create .env.local from template**

```bash
cp .env.example .env.local
```

Edit `.env.local` — set `NEXTAUTH_SECRET` to a random string:

```bash
npx auth secret
```

- [ ] **Step 6: Initialize git and commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 14 project with core dependencies"
```

---

## Task 2: Docker Compose Development Environment

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: crm-bot-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: crm_bot
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: crm-bot-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Start services and verify**

```bash
docker-compose up -d
docker-compose ps
```

Expected: Both `crm-bot-postgres` and `crm-bot-redis` running, ports 5432 and 6379 mapped.

- [ ] **Step 3: Verify connectivity**

```bash
docker exec crm-bot-postgres pg_isready -U postgres
docker exec crm-bot-redis redis-cli ping
```

Expected: `accepting connections` and `PONG`.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add Docker Compose for PostgreSQL and Redis"
```

---

## Task 3: Prisma Schema & Database Models

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write the full Prisma schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth Models (NextAuth) ────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Business Models ───────────────────────────────────

model Company {
  id           String   @id @default(cuid())
  name         String
  domain       String?  @unique
  industry     String?
  size         String?
  location     String?
  description  String?  @db.Text
  enrichedData Json?
  leads        Lead[]
  contacts     Contact[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([industry])
  @@index([location])
}

model Contact {
  id        String   @id @default(cuid())
  name      String
  title     String?
  email     String?
  phone     String?
  linkedin  String?
  source    String?
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  leads     Lead[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([email, companyId])
  @@index([companyId])
}

enum LeadStatus {
  NEW
  ENRICHED
  SCORED
  QUALIFIED
  CONTACTED
  ENGAGED
  CONVERTED
  LOST
}

model Lead {
  id          String     @id @default(cuid())
  status      LeadStatus @default(NEW)
  source      String?
  tags        String[]
  companyId   String
  company     Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  contactId   String
  contact     Contact    @relation(fields: [contactId], references: [id], onDelete: Cascade)
  scores      LeadScore[]
  touchpoints Touchpoint[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([status])
  @@index([companyId])
  @@index([contactId])
}

model LeadScore {
  id           String   @id @default(cuid())
  leadId       String
  lead         Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  total        Int
  factors      Json
  reasoning    String?  @db.Text
  recommendation String
  modelVersion String?
  createdAt    DateTime @default(now())

  @@index([leadId])
}

model Campaign {
  id             String     @id @default(cuid())
  name           String
  status         String     @default("draft")
  targetCriteria Json?
  metrics        Json?
  sequences      Sequence[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model Sequence {
  id         String         @id @default(cuid())
  name       String
  channel    String         @default("email")
  status     String         @default("draft")
  campaignId String
  campaign   Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  steps      SequenceStep[]
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@index([campaignId])
}

model SequenceStep {
  id            String       @id @default(cuid())
  sequenceId    String
  sequence      Sequence     @relation(fields: [sequenceId], references: [id], onDelete: Cascade)
  stepOrder     Int
  delayDays     Int          @default(0)
  condition     String?
  contentPrompt String?      @db.Text
  templateId    String?
  touchpoints   Touchpoint[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@unique([sequenceId, stepOrder])
  @@index([sequenceId])
}

enum TouchpointStatus {
  PENDING
  SENT
  OPENED
  CLICKED
  REPLIED
  BOUNCED
  FAILED
}

model Touchpoint {
  id             String          @id @default(cuid())
  leadId         String
  lead           Lead            @relation(fields: [leadId], references: [id], onDelete: Cascade)
  sequenceStepId String?
  sequenceStep   SequenceStep?   @relation(fields: [sequenceStepId], references: [id])
  channel        String          @default("email")
  status         TouchpointStatus @default(PENDING)
  content        Json?
  sentAt         DateTime?
  openedAt       DateTime?
  repliedAt      DateTime?
  replyContent   String?         @db.Text
  replyAnalysis  Json?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([leadId])
  @@index([sequenceStepId])
  @@index([status])
}

model PromptTemplate {
  id              String   @id @default(cuid())
  name            String
  role            String?  @db.Text
  template        String   @db.Text
  variables       String[]
  outputSchema    Json?
  version         Int      @default(1)
  abTestGroup     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied, Prisma Client generated.

- [ ] **Step 4: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 5: Verify database tables**

```bash
npx prisma studio
```

Expected: Prisma Studio opens in browser showing all tables: User, Account, Session, VerificationToken, Company, Contact, Lead, LeadScore, Campaign, Sequence, SequenceStep, Touchpoint, PromptTemplate.

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add Prisma schema with all data models"
```

---

## Task 4: Redis Client

**Files:**
- Create: `src/lib/redis.ts`

- [ ] **Step 1: Create Redis client singleton**

Create `src/lib/redis.ts`:

```typescript
import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
```

Note: `maxRetriesPerRequest: null` is required by BullMQ.

- [ ] **Step 2: Verify connection**

Create a quick test script and run it:

```bash
npx tsx -e "
const { redis } = require('./src/lib/redis');
redis.ping().then((r) => { console.log('Redis:', r); redis.disconnect(); });
"
```

Expected: `Redis: PONG`

- [ ] **Step 3: Commit**

```bash
git add src/lib/redis.ts
git commit -m "feat: add Redis client singleton"
```

---

## Task 5: NextAuth.js Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create NextAuth configuration**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        // MVP: plain text comparison. Replace with bcrypt before production.
        if (user.password !== parsed.data.password) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Create NextAuth API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Verify auth endpoint responds**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/api/auth/providers | head -20
```

Expected: JSON response listing the "credentials" provider.

Kill the dev server after testing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/
git commit -m "feat: add NextAuth.js credentials authentication"
```

---

## Task 6: Install shadcn/ui & Base Components

**Files:**
- Create: `components.json`
- Create: `src/components/ui/` (multiple files via CLI)

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 2: Install required components**

```bash
npx shadcn@latest add button card input label form avatar dropdown-menu separator sheet tooltip badge table
```

- [ ] **Step 3: Verify components installed**

```bash
ls src/components/ui/
```

Expected: `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `form.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `separator.tsx`, `sheet.tsx`, `tooltip.tsx`, `badge.tsx`, `table.tsx` present.

- [ ] **Step 4: Commit**

```bash
git add components.json src/components/ui/ src/lib/utils.ts
git commit -m "feat: install shadcn/ui with base components"
```

---

## Task 7: Providers & Root Layout

**Files:**
- Create: `src/components/layout/providers.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create Providers component**

Create `src/components/layout/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Update root layout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM Bot - AI 获客系统",
  description: "AI 驱动的 B2B 智能获客平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/providers.tsx src/app/layout.tsx
git commit -m "feat: add session provider and root layout"
```

---

## Task 8: Login Page

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/components/auth/login-form.tsx`

- [ ] **Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create login form component**

Create `src/components/auth/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("邮箱或密码错误");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">CRM Bot</CardTitle>
        <CardDescription>AI 智能获客系统</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/ src/components/auth/
git commit -m "feat: add login page with credentials form"
```

---

## Task 9: Dashboard Layout with Sidebar

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  ListOrdered,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/leads", label: "线索池", icon: Users },
  { href: "/campaigns", label: "活动", icon: Megaphone },
  { href: "/sequences", label: "序列", icon: ListOrdered },
  { href: "/templates", label: "模板", icon: FileText },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-semibold">CRM Bot</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Install lucide-react icons**

```bash
npm install lucide-react
```

- [ ] **Step 3: Create header component**

Create `src/components/layout/header.tsx`:

```tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled className="text-sm text-slate-500">
            {session?.user?.email}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

- [ ] **Step 4: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/header.tsx src/app/\(dashboard\)/layout.tsx
git commit -m "feat: add dashboard layout with sidebar and header"
```

---

## Task 10: Placeholder Pages

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/(dashboard)/leads/page.tsx`
- Create: `src/app/(dashboard)/campaigns/page.tsx`
- Create: `src/app/(dashboard)/sequences/page.tsx`
- Create: `src/app/(dashboard)/templates/page.tsx`
- Create: `src/app/(dashboard)/settings/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">仪表盘</h2>
      <p className="mt-2 text-slate-500">AI 获客系统概览 — Phase 2 实现</p>
    </div>
  );
}
```

- [ ] **Step 2: Create leads page**

Create `src/app/(dashboard)/leads/page.tsx`:

```tsx
export default function LeadsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">线索池</h2>
      <p className="mt-2 text-slate-500">线索管理 — Phase 2 实现</p>
    </div>
  );
}
```

- [ ] **Step 3: Create campaigns page**

Create `src/app/(dashboard)/campaigns/page.tsx`:

```tsx
export default function CampaignsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">活动</h2>
      <p className="mt-2 text-slate-500">获客活动管理 — Phase 3 实现</p>
    </div>
  );
}
```

- [ ] **Step 4: Create sequences page**

Create `src/app/(dashboard)/sequences/page.tsx`:

```tsx
export default function SequencesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">序列</h2>
      <p className="mt-2 text-slate-500">触达序列编排 — Phase 3 实现</p>
    </div>
  );
}
```

- [ ] **Step 5: Create templates page**

Create `src/app/(dashboard)/templates/page.tsx`:

```tsx
export default function TemplatesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">模板</h2>
      <p className="mt-2 text-slate-500">Prompt 模板管理 — Phase 3 实现</p>
    </div>
  );
}
```

- [ ] **Step 6: Create settings page**

Create `src/app/(dashboard)/settings/page.tsx`:

```tsx
export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">设置</h2>
      <p className="mt-2 text-slate-500">系统设置 — Phase 4 实现</p>
    </div>
  );
}
```

- [ ] **Step 7: Update root page to redirect**

Replace `src/app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/
git commit -m "feat: add placeholder pages and root redirect"
```

---

## Task 11: Seed Data & End-to-End Verification

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin user (MVP: plain text password)
  const admin = await prisma.user.upsert({
    where: { email: "admin@crm-bot.com" },
    update: {},
    create: {
      email: "admin@crm-bot.com",
      name: "Admin",
      password: "admin123",
    },
  });

  console.log("Seeded admin user:", admin.email);

  // Create sample company
  const company = await prisma.company.upsert({
    where: { domain: "example-saas.com" },
    update: {},
    create: {
      name: "Example SaaS Co.",
      domain: "example-saas.com",
      industry: "企业软件",
      size: "50-200",
      location: "北京",
      description: "一家提供 CRM 解决方案的 SaaS 公司",
    },
  });

  // Create sample contact
  const contact = await prisma.contact.upsert({
    where: {
      email_companyId: { email: "zhang@example-saas.com", companyId: company.id },
    },
    update: {},
    create: {
      name: "张三",
      title: "CTO",
      email: "zhang@example-saas.com",
      source: "seed",
      companyId: company.id,
    },
  });

  // Create sample lead
  await prisma.lead.create({
    data: {
      status: "NEW",
      source: "seed",
      tags: ["SaaS", "CRM"],
      companyId: company.id,
      contactId: contact.id,
    },
  });

  console.log("Seeded sample company, contact, and lead");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed script to package.json**

Add to `package.json` at the top level (not inside `scripts`):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Run seed**

```bash
npx prisma db seed
```

Expected: `Seeded admin user: admin@crm-bot.com` and `Seeded sample company, contact, and lead`.

- [ ] **Step 4: End-to-end verification**

```bash
npm run dev
```

1. Open `http://localhost:3000` — should redirect to `/login`
2. Log in with `admin@crm-bot.com` / `admin123` — should redirect to `/dashboard`
3. Click each sidebar link — should show corresponding placeholder page
4. Click avatar → 退出登录 — should return to login page

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data and complete Phase 1 foundation"
```

---

## Summary

After completing all 11 tasks, you will have:

- Next.js 14 project with TypeScript, Tailwind, ESLint
- Docker Compose running PostgreSQL 16 + Redis 7
- Full Prisma schema with all 13 data models + migrations applied
- Redis client singleton (BullMQ-compatible)
- NextAuth.js credentials authentication with JWT sessions
- shadcn/ui component library installed
- Dashboard layout: sidebar navigation + header with user menu
- 6 placeholder pages (dashboard, leads, campaigns, sequences, templates, settings)
- Login page with email/password form
- Root page redirecting based on auth status
- Seed data with admin user + sample lead
- Working end-to-end: login → dashboard → navigate → logout

**Next:** Phase 2 plan (线索引擎) will build on this foundation.
