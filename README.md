# ☕ CaféOS — Cloud Restaurant & Dining Operating System

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

**CaféOS** is a dual-portal hospitality cloud operating system engineered to bridge high-velocity front-of-house restaurant operations, tactical back-of-house kitchen workflows, and customer digital dining experiences.

---

## 🌟 Key Portals & Capabilities

### 🍽️ 1. Customer Dining Portal (`/customer`)
- **Curated Culinary Discovery**: Explore iconic dining institutions (e.g., Arsalan, Peter Cat, 6 Ballygunge Place, Flurys, Mocambo, Balaram Mullick, Golden Joy).
- **Interactive Digital Menu**: Pure Veg / Non-Veg filters, category exploration, spice level indicators, and customizable variants.
- **Smart Dining Modes**: Seamless support for **Dine-In (Table QR)**, **Curbside Takeaway**, and **Doorstep Delivery**.
- **Real-Time Order Tracking**: Multi-stage live lifecycle tracking (Order Placed ➔ Kitchen Accepted ➔ Cooking Fresh ➔ Plated / Packed ➔ Fulfilled) with animated status indicators.
- **Diner Loyalty & Rewards**: 5% loyalty coin accrual on every completed order, redeemable at checkout.
- **Secure Authentication**: Customer sign-up, Google OAuth authentication, session persistence, and profile address management.

### 🏪 2. Restaurant Admin Portal (`/dashboard`)
- **Executive Operations Cockpit**: Real-time sales momentum, gross ticket volume, average order value (AOV), and table occupancy metrics.
- **Live Orders Queue & Kanban**: Switch between an enterprise transaction table and a visual 4-column drag-and-drop Kanban board.
- **Touch POS Terminal (`/dashboard/pos`)**: High-velocity cashier interface supporting rapid item lookup, split bills, UPI QR generation, and thermal receipt formatting.
- **Menu & Catalog Engine (`/dashboard/menu`)**: Dynamic category management, price adjustments, veg/non-veg tags, and live 86 / sold-out toggling.
- **Recipe BOM & Inventory (`/dashboard/inventory`)**: Automatic ingredient deduction when cooking starts, low-stock threshold alerts, and procurement supplier directory.
- **GST Billing & Ledger (`/dashboard/billing`)**: 5% GST calculation (2.5% CGST + 2.5% SGST), tax invoice PDF/print generation, and refund management.

### 🍳 3. Kitchen Display System (KDS) (`/kitchen`)
- **Tactical Dark UI**: High-contrast, glare-free kitchen display designed for line cooks and station chefs.
- **Live Urgency Timers**: Dynamic color-coded elapsed countdowns with amber warning (8m+) and red overdue critical thresholds (15m+).
- **Rush Priority System**: 1-click Rush Priority flagging that pulses urgent tickets to the front of the queue.
- **Web Audio Alert Chimes**: Synthesized auditory bell that chimes instantly whenever a customer submits an order.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 5](https://vitejs.dev/) |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/) with Warm Café Palette |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) (Smooth layout & card transitions) |
| **Icons & Visualization** | [Lucide React](https://lucide.dev/) + [Recharts](https://recharts.org/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (Managed PostgreSQL 15) |
| **Security & Permissions** | Row Level Security (RLS) policies, JWT Auth, Role-Based Access Control |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/cafeos.git
cd cafeos
npm install
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:
```env
# Supabase Backend Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Demo Tenant Configuration
VITE_DEMO_RESTAURANT_ID=22222222-2222-2222-2222-222222222201
VITE_DEMO_RESTAURANT_SLUG=artisan-brew
```

> ⚠️ **Important**: Never commit your active `.env` file or private production keys to GitHub. The `.gitignore` file is preconfigured to protect your secrets.

### 3. Start Local Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:5173/`**.

### 4. Build for Production
To create an optimized production build:
```bash
npm run build
```
The output will be generated inside the `dist/` directory.

---

## 📂 Project Architecture

```
CafeOs/
├── public/                 # Static assets and icons
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Buttons, badges, logos, safe images
│   │   └── customer/       # Customer-specific modals & cards
│   ├── context/            # React state providers
│   │   ├── AuthContext.tsx # User session & role memberships
│   │   ├── CafeContext.tsx # Restaurant state, orders, tables, inventory
│   │   └── CustomerContext.tsx # Cart, dining mode, favorites, rewards
│   ├── data/               # Seed data, mock analytics, and demo menus
│   ├── layouts/            # Layout wrappers with Framer Motion transitions
│   │   ├── AdminLayout.tsx
│   │   ├── CustomerPortalLayout.tsx
│   │   └── SuperAdminLayout.tsx
│   ├── pages/              # Routed page views
│   │   ├── auth/           # Login, registration, and onboarding
│   │   ├── customer/       # Hub, directory, menu, cart, checkout, tracking
│   │   ├── dashboard/      # Overview, orders, POS billing, inventory, analytics
│   │   ├── kitchen/        # Kitchen Display System (KDS)
│   │   └── LandingPage.tsx # Master public landing page
│   ├── services/           # Supabase RPC & database client services
│   ├── types/              # TypeScript interface definitions
│   └── utils/              # Formatters, security helpers, calculation logic
├── supabase/               # Database migrations, RLS policies, seed SQL
├── .env.example            # Template for environment variables
├── .gitignore              # Git ignore rules for node_modules, .env, and dist
├── package.json            # Project dependencies and npm scripts
├── tailwind.config.js      # Custom theme, colors, and keyframe animations
└── vite.config.ts          # Vite configuration
```

---

## 🛡️ Security & Access Control

- **Role Separation**: Strict separation between customer accounts and restaurant staff workspaces.
- **Row-Level Security (RLS)**: Enforced directly on Supabase PostgreSQL tables to guarantee multi-tenant tenant isolation.
- **No Shared Passwords**: Google OAuth integration utilizes secure PKCE callback flows.
- **Client Idempotency**: Cart checkout commands issue cryptographic idempotency keys to eliminate accidental duplicate charges or order creation.

---

## 📄 License
This project is licensed under the MIT License — see the LICENSE file for details.
