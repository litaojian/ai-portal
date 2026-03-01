# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI-Portal** is a Next.js 16 application serving as a unified user portal and admin dashboard with built-in OIDC Identity Provider capabilities. The project implements project management, application management, and authentication services following a strict document-driven development workflow.

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router) + React 19
- **Language**: TypeScript
- **Database**: Drizzle ORM + MySQL (dev: SQLite)
- **Auth**: NextAuth.js v4 with OIDC Provider
- **UI**: Tailwind CSS v4 + Shadcn/UI (Radix UI primitives)
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Package Manager**: pnpm

## Essential Commands

### Development
```bash
pnpm dev          # Start dev server with debugger (NODE_OPTIONS='--inspect')
pnpm build        # Build for production - MUST run before commits
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run unit tests with Vitest
```

### Database (Drizzle)
```bash
# Generate migrations
npx drizzle-kit generate

# Apply migrations (dev)
npx drizzle-kit migrate

# Push schema changes directly (dev only)
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio
```

**⚠️ CRITICAL**: Never auto-execute `drizzle-kit push` against production. Generate SQL scripts for manual review.

### Testing & Debugging
```bash
# Run E2E tests
npx playwright test

# Run OIDC integration tests
node scripts/oidc-simulator.mjs
node scripts/verify-integration.mjs
```

## Architecture Overview

### Directory Structure
```
app/
├── (pages)/           # Main application pages
├── actions/           # Server Actions (data mutations)
├── api/               # API routes (REST endpoints)
├── login/             # Authentication pages
├── main/              # Main dashboard
├── oidc/              # OIDC provider endpoints
└── portal/            # Portal-specific pages

components/
├── ui/                # Shadcn/UI primitives (Button, Input, etc.)
├── common/            # Shared business components
│   ├── data-table.tsx       # Reusable data table with pagination
│   └── form-sheet.tsx       # Standardized form drawer
└── <module>/          # Module-specific components

lib/
├── db/
│   ├── schema.ts      # Drizzle schema definitions
│   └── index.ts       # Database client instance
├── auth.ts            # NextAuth configuration
├── oidc.ts            # OIDC Provider setup
├── *-service.ts       # Business logic services
└── utils.ts           # Utility functions

docs/
├── 开发规范/           # Development standards (CRITICAL - read first)
├── <feature>/         # Feature-specific documentation
│   ├── 1_需求.md       # Requirements
│   ├── 2_页面设计.md    # UI design
│   └── 3_数据库设计.md  # Database schema
└── API_REFERENCE.md   # API documentation
```

### Data Flow Pattern
1. **User Interaction** → Client Component (form, button)
2. **State Update** → URL query params for list filters (`searchParams`)
3. **Data Fetching** → Server Component reads params, queries DB
4. **Data Mutation** → Server Actions in `app/actions/`
5. **Response** → Revalidate paths, show toast notifications

## Critical Development Rules

### 1. Next.js 16+ Async Params
```typescript
// ❌ WRONG - Direct property access
export default function Page({ params, searchParams }) {
  const id = params.id;  // Error!
}

// ✅ CORRECT - Await params
export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const { page, search } = await searchParams;
}
```

### 2. URL as State (List Pages)
All list pages MUST sync filters, search, and pagination to URL:
```typescript
// Server Component reads from URL
const { page = '1', search = '' } = await searchParams;
const results = await db.query.users.findMany({
  where: search ? like(users.name, `%${search}%`) : undefined,
  limit: 10,
  offset: (parseInt(page) - 1) * 10,
});

// Client Component updates URL
const router = useRouter();
const handleSearch = (value: string) => {
  router.push(`?search=${value}&page=1`);
};
```

### 3. Server Actions Pattern
```typescript
// app/actions/user-actions.ts
'use server'

import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  // Validate with Zod
  const data = UserSchema.parse({...});

  // Database operation
  await db.insert(users).values(data);

  // Revalidate affected pages
  revalidatePath('/users');

  return { success: true };
}
```

### 4. Form Validation (Zod + React Hook Form)
```typescript
// ❌ WRONG - Using .default() breaks type inference
const schema = z.object({
  name: z.string().default(''),  // TypeScript sees string, but form expects string | undefined
});

// ✅ CORRECT - No .default(), use defaultValues instead
const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    name: '',  // Define defaults here
  },
});
```

### 5. Hydration Errors Prevention
```typescript
// ❌ WRONG - SSR/Client mismatch
const [isMobile, setIsMobile] = useState<boolean | undefined>();
return !!isMobile;  // SSR: false, Client: true → Hydration error

// ✅ CORRECT - Consistent initial state
const [isMobile, setIsMobile] = useState(false);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  setIsMobile(window.innerWidth < 768);
}, []);

return mounted && isMobile ? <MobileMenu /> : null;
```

### 6. Component Reuse Standards
- **Data Tables**: Use `components/common/data-table.tsx` for all lists
- **Forms**: Use `components/common/form-sheet.tsx` for drawers/dialogs
- **Icons**: Primary: `lucide-react`, Sidebar: `@tabler/icons-react`
- **Styling**: Use Shadcn/UI design tokens (`bg-muted`, `text-primary`), never hardcode colors

### 7. Database Schema Rules
- **Table Naming**: Prefix with `uc_` (User Center), e.g., `uc_user`, `uc_application`
- **Primary Keys**: UUID via `crypto.randomUUID()`
- **Timestamps**: All tables need `createdAt` and `updatedAt`
- **Relations**: Use Drizzle's `relations()` for foreign keys
- **Never** import `db` client in Client Components

### 8. Middleware Configuration
**⚠️ CRITICAL**: Next.js 16 deprecates `middleware.ts`. This project uses `proxy.ts` instead.

## Development Workflow (SOP)

This project follows a **strict 4-stage workflow** with mandatory approval gates:

### Stage 1: Requirements Analysis
- **Action**: Clarify ambiguities, identify core entities
- **Output**: Requirements document in `docs/<feature>/1_需求.md`
- **🔴 GATE**: User must approve requirements

### Stage 2: Design
- **Action**:
  - Create low-fidelity wireframes (ASCII art in docs)
  - Build high-fidelity mockups using "Code as Prototype" (mock data)
  - Design database schema
- **Output**: Design doc, interactive mock pages
- **🔴 GATE**: User must approve design and mockups

### Stage 3: Implementation
- **Action**:
  - Replace mock data with real Server Actions/APIs
  - Add loading states, error handling, empty states
  - Run `pnpm build` to verify no TypeScript errors
- **Output**: Commits with working features

### Stage 4: Verification
- **Action**: Test against Acceptance Criteria, record demos
- **🔴 GATE**: User acceptance testing

**NEVER skip stages**. Each stage requires explicit user approval before proceeding.

## Common Patterns

### Authentication Check
```typescript
// Server Component
import { auth } from '@/lib/auth';

const session = await auth();
if (!session) redirect('/login');
```

### Toast Notifications
```typescript
'use client'
import { toast } from 'sonner';

toast.success("Operation successful");
toast.error("Something went wrong");
```

### Data Table with Server-Side Filtering
```typescript
// Server Component (page.tsx)
import { DataTable } from '@/components/common/data-table';

const { page = '1', search = '' } = await searchParams;
const data = await fetchData({ page, search });

return <DataTable data={data} columns={columns} />;
```

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=              # MySQL connection string
NEXTAUTH_URL=              # Application URL (e.g., http://localhost:3000)
NEXTAUTH_SECRET=           # Generate: openssl rand -base64 32
OIDC_ISSUER=               # OIDC issuer URL (optional)
```

## Important References

- **Workflow Standards**: [development-workflow.md](development-workflow.md)
- **Development Rules**: [docs/开发规范/](docs/开发规范/)
- **API Reference**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
- **Project Context**: [GEMINI.md](GEMINI.md) (detailed project background)

## Testing Notes

- Run `pnpm test` without user confirmation (auto-approved)
- E2E tests use Playwright against built application
- OIDC flow can be tested using simulator scripts in `scripts/`

## Build Verification

Before every commit, ensure:
```bash
pnpm build  # Must complete without errors
pnpm lint   # Fix all linting issues
```

TypeScript errors in production build are **blocking issues** that must be resolved immediately.
