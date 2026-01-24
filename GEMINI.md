# AI Portal (Dashboard v1) Project Context

## 1. Project Overview
**Name:** dashboard-v1 (AI Portal)
**Vision:** A centralized user portal and management backend intended to serve as a unified entry point ("1+N" model) for future applications. It aims to provide authentication, navigation, and administration capabilities.
**Current Status:** Early development phase. Currently a standalone Next.js application implementing the foundational UI and structure.

## 2. Tech Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:**
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Shadcn/UI](https://ui.shadcn.com/) (New York style, Neutral base)
- **Icons:** `lucide-react`, `@tabler/icons-react`
- **Data Display:** `@tanstack/react-table` (Tables), `recharts` (Charts)
- **Validation:** `zod`
- **Package Manager:** pnpm

## 3. Project Structure
```text
D:\ai_works\ai-portal\
├── app/                 # Next.js App Router pages and layouts
│   ├── dashboard/       # Main dashboard views
│   ├── globals.css      # Global styles and Tailwind variables
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/          # React components
│   ├── ui/              # Shadcn/UI primitive components (do not modify manually unless necessary)
│   └── ...              # Business-specific components (e.g., app-sidebar, nav-*)
├── docs/                # Documentation and requirements
├── lib/                 # Utility functions (utils.ts)
├── public/              # Static assets
└── components.json      # Shadcn/UI configuration
```

## 4. Development & Usage

### 4.1. Setup & Run
The project uses `pnpm` (inferred from lockfile) or `npm`.

- **Install Dependencies:**
  ```bash
  pnpm install
  ```
- **Start Development Server:**
  ```bash
  # Runs on http://localhost:3000
  pnpm dev
  ```
- **Build for Production:**
  ```bash
  pnpm build
  ```
- **Linting:**
  ```bash
  pnpm lint
  ```

### 4.2. Key Conventions
*Adhere strictly to these rules during development:*

- **Language:**
  - **UI/Frontend:** Default to **Simplified Chinese (简体中文)** for all user-facing text.
  - **Communication:** Use Simplified Chinese for all reasoning, planning, and user interaction.
- **UI Components:**
  - Use **Shadcn/UI** components from `components/ui`.
  - For new UI elements, check if a Shadcn component exists first.
- **Data Tables:**
  - When displaying lists of data, **always** implement pagination.
  - Display total counts and current page information.
- **Code Quality:**
  - After batch modifications, verify there are no syntax errors.
  - Ensure the project compiles successfully (`pnpm build` check recommended for critical changes).
- **Process:**
  - **Step-by-step:** Requirements Analysis -> Code Development -> Testing.
  - **Doc Sync:** Keep `GEMINI.md` or `docs/` updated if requirements change.
  - **Testing:** Generate E2E test cases where applicable.

## 5. Requirements vs. Current State
*Reference from `docs/项目需求.md`:*
- **Target Architecture:** Monorepo (Turborepo + pnpm workspaces) with Prisma & Auth.js.
- **Current State:** Single-repo Next.js application. Database and Auth layers are not yet fully integrated in `package.json` dependencies.
- **Immediate Focus:** Building out the UI/UX for the Dashboard, Sidebar, and basic data visualization based on the existing file structure (`app/dashboard`, `components/app-sidebar.tsx`).
