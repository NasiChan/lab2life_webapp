# 🧬 Lab2Life - Personal Health Management Platform

**Lab2Life** is an intelligent personal health management platform that transforms bloodwork and medical documents into actionable health recommendations using AI 💡.

> 📌 Created for ElleHacks 2026 in collaboration between Lyanghyeon, Nas, and Deniz.

---

## ⭐ Key Features

- **📋 Lab Result Analysis**: Upload PDF/image lab reports → AI extracts health markers instantly
- **💊 Smart Pill Planner**: Daily & weekly medication/supplement tracking with conflict detection
- **🤖 AI Recommendations**: Personalized supplement, dietary, and activity guidance
- **⏰ Intelligent Reminders**: Notifications aligned with user's meal times & wake-up schedule
- **⚠️ Drug Interaction Checking**: Prevents dangerous medication/supplement combinations
- **📊 Health Dashboard**: Real-time overview of health metrics, medications, and recommendations
- **🌙 Dark/Light Mode**: Full theme support with Tailwind CSS variables

---

## 🏗️ System Architecture

### 🎨 Frontend (Client)
- **Framework**: React 18 + TypeScript
- **Router**: Wouter (lightweight & performant)
- **State Management**: TanStack React Query (server state)
- **UI Library**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with CSS variables for dynamic theming
- **Build Tool**: Vite with TypeScript & path aliases
- **Pages**: Dashboard, Pill Planner, Lab Results, Medications, Supplements, Reminders, Interactions, Recommendations, Profile

### 🧠 Backend (Server)
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **API**: RESTful JSON API under `/api` prefix
- **File Processing**: Multer for lab result uploads
- **AI Integration**: Google Gemini API for:
  - Lab result text extraction
  - Health marker analysis
  - Recommendation generation
  - Drug interaction checking

### 🗄️ Database Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod validation
- **Schema**: Shared between client & server (`shared/schema.ts`)
- **Migrations**: drizzle-kit managed migrations

### 📊 Core Data Models

| Model | Purpose |
|-------|---------|
| **Users** | Authentication & profile management |
| **Lab Results** | Uploaded documents with processing status |
| **Health Markers** | Extracted values with normal ranges |
| **Medications** | User meds with dosage, timing, food rules, separation rules |
| **Supplements** | User supplements with scheduling & interaction data |
| **Pill Stacks** | Groups of pills taken together at specific times |
| **Pill Doses** | Daily dose tracking (pending/taken/snoozed) |
| **Recommendations** | AI-generated supplement, dietary, physical activity guidance |
| **Reminders** | Smart notifications based on user schedule |
| **Interactions** | Drug/supplement interaction warnings |

### 📅 Pill Planner - Core Feature

The Pill Planner is a **mobile-first medication & supplement manager** with:

**Daily View:**
- Pills organized by time blocks: Morning → Midday → Evening → Bedtime
- Dosage & frequency per pill
- "With Food" / "Empty Stomach" indicators
- Conflict warnings (separation rules)
- Mark taken / Snooze actions

**Weekly View:**
- Calendar grid: Days × Time Blocks
- Visual pill indicators for each slot
- Pattern recognition (missed doses, patterns)
- At-a-glance planning for travel & busy periods

---

## 🗂️ Project Structure

```
lab2life_webapp/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── pages/              # Route pages
│       │   ├── dashboard.tsx
│       │   ├── pill-planner.tsx
│       │   ├── lab-results.tsx
│       │   ├── medications.tsx
│       │   ├── supplements.tsx
│       │   ├── reminders.tsx
│       │   ├── interactions.tsx
│       │   ├── recommendations.tsx
│       │   └── profile.tsx
│       ├── components/          # UI components
│       │   ├── app-sidebar.tsx
│       │   ├── theme-provider.tsx
│       │   └── ui/             # shadcn/ui components
│       ├── hooks/              # Custom hooks
│       │   ├── use-pill-notifs.ts
│       │   ├── use-reminder-notifs.ts
│       │   └── use-toast.ts
│       └── lib/                # Utilities
│           ├── queryClient.ts
│           └── utils.ts
├── server/
│   ├── index.ts               # Express app entry
│   ├── routes.ts              # API route definitions
│   ├── db.ts                  # Database connection
│   ├── gemini.ts              # Gemini AI integration
│   ├── seed.ts                # Database seeding
│   ├── storage.ts             # File storage logic
│   └── static.ts              # Static file serving
├── shared/
│   ├── schema.ts              # Drizzle ORM schema
│   └── models/
│       └── chat.ts            # Chat data structures
├── migrations/                # Database migrations
├── script/
│   └── build.ts               # Build configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
├── tailwind.config.ts
└── vercel.json                # Deployment config
```

---

## ⚙️ Build & Deployment

### Development
```bash
npm run dev
```
- **Client**: Vite dev server with HMR
- **Server**: tsx with hot reload

### Production Build
```bash
npm run build
```
- **Server**: Bundled to `dist/index.cjs` (esbuild)
- **Client**: Built to `dist/public` (Vite)
- Dependencies bundled to minimize cold starts 🚀

### Deployment
Project configured for **Vercel** (see `vercel.json`)

---

## 🔌 External Dependencies

### 🤖 AI Integration
- **Google Gemini API**: Lab analysis, marker extraction, recommendations, interaction checking
- Environment variables:
  - `AI_INTEGRATIONS_GEMINI_API_KEY`
  - `AI_INTEGRATIONS_GEMINI_BASE_URL`

### 🛢️ Database
- **PostgreSQL**: Primary data store
- Environment variable: `DATABASE_URL`
- Session storage: `connect-pg-simple`

### 📦 Key Dependencies
- `@google/generative-ai` - Gemini API client
- `drizzle-orm` / `drizzle-kit` - Database ORM & migrations
- `@tanstack/react-query` - Server state management
- `@radix-ui/*` - Accessible UI primitives
- `react-hook-form` + `zod` - Form validation
- `multer` - File uploads
- `express` - Backend framework
- `tailwindcss` - Styling

---

## ✅ Prerequisites

1. **Node.js**: v18+
2. **PostgreSQL**: Running database instance
3. **Google Gemini API Key**: Get from [Google AI Studio](https://ai.google.dev)

---

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/NasiChan/lab2life_webapp.git
cd lab2life_webapp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env.local` in the root:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lab2life

# AI Services
AI_INTEGRATIONS_GEMINI_API_KEY=your_gemini_api_key
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# Session (optional)
SESSION_SECRET=your_secret_key
```

### 4. Database Setup
```bash
# Push schema to database
npm run db:push

# (Optional) Run migrations
npm run migrate

# (Optional) Seed sample data
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```
Access at `http://localhost:5173`

### 6. Production Build
```bash
npm run build
npm start
```

---

## 🧪 Testing the App



## 📋 Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm start            # Run production build
npm run check        # TypeScript type checking
npm run db:push      # Push schema to database
npm run migrate      # Run database migrations
```

---

## 📝 License

MIT License - See LICENSE file for details.

---

## 👥 Authors

- **Lyanghyeon** - UI/UX & frontend
- **Nas** - Full-stack development
- **Deniz** - Backend & AI integration

Created for **ElleHacks 2026** 🚀
