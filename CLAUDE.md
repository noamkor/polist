# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Polist** is an insurance client management system for independent insurance agents. It's a full-stack Next.js application with a Hebrew RTL interface, designed to run on a local office network.

Key features:
- Client management (CRUD, phone numbers, personal documents)
- 5 insurance categories with yearly records: Vehicles, Homes, Businesses, Health, Pension
- Document management (upload, preview, download across PDF, images, Word, Excel)
- Family relationships (bidirectional links between clients)
- Dashboard with statistics, expiring insurance alerts, birthdays, smart advisor insights
- User management with role-based access (Admin/Agent/Viewer)
- Full data backup as ZIP with Hebrew folder structure
- Dark mode support

## Development Commands

```bash
npm run dev           # Start development server (http://localhost:3000)
npm run build         # Build production bundle
npm start             # Start production server
npm run lint          # Run ESLint
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed database with initial data
npm run db:studio     # Open Prisma Studio (visual DB explorer)
```

**Default credentials** (from seed): Username: `admin`, Password: `admin123`

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: PostgreSQL + Prisma 6 ORM
- **Styling**: TailwindCSS 4 with RTL logical properties
- **Auth**: NextAuth.js v5 (credentials provider, JWT sessions)
- **Validation**: Zod
- **Language**: TypeScript

## Architecture

### High-Level Structure

The app follows a layered architecture:

1. **Pages & Routes** (`src/app/`)
   - `(auth)/login` - Login page
   - `(dashboard)/` - Authenticated pages (clients, insurance, settings, backup)
   - `api/` - REST API routes for data operations

2. **Components** (`src/components/`)
   - `ui/` - Reusable UI primitives (Button, Input, Modal, Toast, etc.)
   - `layout/` - Navigation layout (Sidebar, Header, Breadcrumbs)
   - `clients/`, `insurance/`, `dashboard/` - Feature-specific components

3. **Business Logic** (`src/lib/`)
   - `prisma.ts` - Singleton Prisma client
   - `dal.ts` - Data access layer (acts as query helper)
   - `file-storage.ts` - File upload/download utilities
   - `backup.ts` - ZIP backup generation
   - `family-relations.ts` - Family relationship logic
   - `validators/` - Zod schemas for validation
   - `utils/` - Helpers (dates, Hebrew labels, file paths)

### Database Schema

The database follows an entity-relationship model:

- **Core**: `User`, `Client`, `PhoneNumber`, `FamilyRelation`, `Document`
- **Insurance Types**: Each insurance type has a parent entity (Vehicle, Home, Business, HealthPolicy, PensionPolicy) and yearly records:
  - VehicleInsurance (tied to Vehicle)
  - HomeInsurance (tied to Home)
  - BusinessInsurance (tied to Business)
  - HealthInsurance (tied to HealthPolicy)
  - PensionInsurance (tied to PensionPolicy)
- **Documents**: Polymorphic relationship — a Document can attach to one of: Client, VehicleInsurance, HomeInsurance, BusinessInsurance, HealthInsurance, or PensionInsurance

Key constraints:
- Insurance records are unique per year per asset (`@@unique([vehicleId/homeId/businessId, year])`)
- Family relations are bidirectional and unique between two clients
- Documents use polymorphic FK pattern (exactly one relation should be non-null)

### Authentication & Authorization

- NextAuth.js v5 with credentials provider
- Passwords hashed with bcryptjs
- JWT-based sessions
- Role-based access control: ADMIN, AGENT, VIEWER
- Protected routes via middleware in `src/auth.config.ts`

### File Storage

- Documents uploaded to local filesystem via `file-storage.ts`
- Files organized by client ID and insurance type
- Backup feature uses `archiver` to create ZIP files with Hebrew folder structure

## Important Patterns

1. **API Routes**: Follow RESTful conventions. Most are in `src/app/api/` with route handlers for GET/POST/PUT/DELETE.

2. **Form Validation**: Use Zod schemas in `src/lib/validators/` before database operations.

3. **Responsive Design**: TailwindCSS with RTL logical properties (use `ps-`, `pe-`, `text-start`, etc. instead of `pl-`, `pr-`, `text-left` for internationalization).

4. **Server Components**: Use Next.js 16 App Router server components by default; mark interactive components with `"use client"`.

5. **Error Handling**: API routes should return appropriate HTTP status codes. UI uses Toast component for user feedback.

## Environment Setup

Required environment variables (set in `.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Secret for NextAuth JWT signing

See `.env.example` or README for full setup instructions.

## Common Development Scenarios

- **Adding a new insurance type**: Add schema in `prisma/schema.prisma`, create migration, add CRUD routes in `api/`, create components for UI.
- **Modifying document storage**: See `src/lib/file-storage.ts` and `src/app/api/clients/[clientId]/documents/route.ts`.
- **Changing authentication**: Modify `src/auth.ts` and `src/auth.config.ts`.
- **Running migrations**: Use `npm run db:migrate` and commit migration files to git.
