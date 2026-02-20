# Polist - Insurance Client Management System

A full-stack web application for independent insurance agents to manage clients, policies, and documents. Built with a Hebrew RTL interface, designed to run on a local office network.

## Features

- **Client Management** - Create, edit, search, and delete clients with ID numbers, phone numbers, emails, and personal documents
- **5 Insurance Categories** - Vehicles, Homes, Businesses, Health, and Pension policies with yearly insurance records
- **Document Management** - Upload, preview, and download documents (PDF, images, Word, Excel) per insurance record or as personal client documents
- **Family Relations** - Link clients with bidirectional family relationships (spouse, parent, child, sibling)
- **Dashboard**
  - Client and insurance type statistics
  - Expiring insurances with 30/60/90 day filters and quick-renew
  - Birthday tracking for current and next month
  - Smart advisor with actionable insights (missing data, potential family connections, uninsured assets)
- **Backup** - Full ZIP backup of all data and documents with Hebrew folder structure
- **Dark Mode** - Full light/dark theme support
- **User Management** - Admin/Agent/Viewer roles with password management

## Tech Stack

- **Framework** - Next.js 16 (App Router) + React 19
- **Database** - PostgreSQL + Prisma 6 ORM
- **Styling** - TailwindCSS 4 with RTL logical properties
- **Auth** - NextAuth.js v5 (credentials provider, JWT sessions)
- **Validation** - Zod
- **Font** - Heebo (local woff2 files)
- **Language** - TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/noamkor/polist.git
   cd polist
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Configure your `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/polist"
   AUTH_SECRET="your-secret-key"
   ```

4. Run database migrations and seed
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) and log in with the default admin credentials:
   - Username: `admin`
   - Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Authenticated pages
│   │   ├── clients/           # Client CRUD + detail pages
│   │   ├── backup/            # Backup page
│   │   └── settings/          # User management
│   └── api/                   # REST API routes
├── components/
│   ├── ui/                    # Button, Input, Modal, Toast, etc.
│   ├── layout/                # Sidebar, Header, Breadcrumbs
│   ├── clients/               # Client forms and lists
│   ├── insurance/             # Insurance managers and records
│   └── dashboard/             # Dashboard widgets
├── lib/
│   ├── prisma.ts              # Database client
│   ├── dal.ts                 # Data access layer
│   ├── file-storage.ts        # File upload/download utilities
│   ├── backup.ts              # ZIP backup generation
│   ├── validators/            # Zod schemas
│   └── utils/                 # Dates, Hebrew labels, paths
└── auth.ts                    # NextAuth configuration
```

## License

Private project - All rights reserved.
