# ☕ CafeOS – Smart Restaurant Management Platform

### One Platform. Two Experiences. Smarter Restaurant Operations.

**CafeOS** is a modern restaurant management platform designed to connect restaurant operations with customer experiences. It provides restaurant owners with tools to manage their business while allowing customers to discover restaurants, explore menus, place orders and track them in one place.

<p align="center">
  <a href="https://cafe-os-cyan-iota.vercel.app/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_CafeOS-06B6D4?style=for-the-badge" alt="Live Demo"/>
  </a>
  <img src="https://img.shields.io/badge/Status-Deployed-success?style=for-the-badge" alt="Deployment Status"/>
  <img src="https://img.shields.io/badge/Platform-Web_Application-blue?style=for-the-badge" alt="Platform"/>
</p>

---

## 🌐 Live Application

**Explore CafeOS:** https://cafe-os-cyan-iota.vercel.app/

Visit the live application and explore its two dedicated portals.

---

## ✨ About the Project

CafeOS aims to simplify restaurant management by bringing essential restaurant operations and customer ordering experiences together in a single platform.

Instead of using separate systems for restaurant operations and customer interactions, CafeOS provides two connected experiences powered by a shared backend.

### 🛍️ 1. Customer Portal

A dedicated interface for customers to interact with restaurants.

- 🔐 Google Authentication
- 🔎 Restaurant Discovery
- 🍽️ Digital Menu Browsing
- 🛒 Cart and Food Ordering
- 📦 Order History
- ⚡ Live Order Tracking
- ❤️ Favorite Restaurants and Dishes
- 👤 Customer Profile Management
- 🔔 Order Notifications
- ⭐ Reviews and Feedback

### 🏪 2. Restaurant Portal

A dedicated management interface for restaurant owners and authorized staff.

- 🔐 Secure Authentication
- 📊 Restaurant Dashboard
- 📋 Order Management
- 🍔 Menu and Category Management
- 👨‍🍳 Kitchen Display System
- 📦 Inventory Management
- 📈 Business Analytics
- 🪑 Table Management
- 👥 Employee Management
- ⚙️ Restaurant Settings

*Feature availability depends on the configured restaurant workflows and permissions.*

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| TypeScript | Type-safe development |
| Vite | Development and build tooling |
| Tailwind CSS | Styling and responsive UI |
| Supabase | Backend and authentication |
| PostgreSQL | Relational database |
| Supabase Realtime | Live data updates |
| Supabase Storage | File and image storage |
| GitHub | Version control |
| Vercel | Application deployment |
| Antigravity IDE | AI-assisted development |

---

## 🏗️ Application Architecture

CafeOS follows a two-portal architecture with a shared backend.

```text
                   CafeOS
                      |
             Landing Page
                      |
           ---------------------
           |                   |
      Customer Portal     Restaurant Portal
           |                   |
     Google Login         Restaurant Login
           |                   |
     Customer UI          Management UI
           |                   |
           ---------------------
                      |
               Supabase Backend
                      |
          -------------------------
          |           |           |
       Database      Auth       Storage
          |
      PostgreSQL
          |
     Supabase Realtime
```

Both portals use shared restaurant, menu and order data while maintaining separate authentication permissions and access controls.

---

## 🚀 Getting Started

Follow these steps to run CafeOS locally.

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the project directory

```bash
cd CafeOS
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root.

Use the variable names defined in your project's `.env.example` and Supabase configuration.

Example for a typical Vite + Supabase application:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_key
```

**Important:** Never expose Supabase service-role keys, private API keys or OAuth client secrets in frontend environment variables or commit them to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### 6. Create a production build

```bash
npm run build
```

---

## 🔐 Authentication & Security

CafeOS uses Supabase Authentication and database-level access controls.

Key security considerations:

- Separate customer and restaurant access.
- Google OAuth for customer authentication.
- Protected application routes.
- Role-based authorization.
- Row Level Security (RLS).
- Customer-specific data access.
- Restaurant-level data isolation.
- Secure backend operations.

---

## 📱 Responsive Experience

CafeOS is designed to provide a consistent experience across desktop, tablet and mobile devices.

---

## 🎯 Project Objectives

The main objectives behind CafeOS are:

- Simplify restaurant management workflows.
- Improve the digital ordering experience.
- Connect restaurant operations with customer interactions.
- Provide real-time order visibility.
- Build a scalable foundation for restaurant-focused SaaS services.
- Explore practical full-stack development and database architecture.

---

## 🔮 Future Enhancements

Potential future improvements include:

- 💳 Integrated online payment processing.
- 🎁 Advanced restaurant loyalty programs.
- 🤖 AI-powered food recommendations.
- 📊 Advanced business intelligence.
- 📍 Location-based restaurant discovery.
- 📱 Progressive Web App support.
- 🔔 Browser push notifications.
- 🧾 Advanced billing and invoice management.

---

## 👨‍💻 Development

CafeOS was developed as a practical full-stack project to explore modern web development, authentication, database architecture, application integration and deployment.

**Development tools:** Antigravity IDE, GitHub and Supabase.

---

## 🤝 Contributions

Suggestions, feedback and improvements are welcome.

If you find an issue or have an idea for improving CafeOS, feel free to open an issue or submit a pull request.

---

## 📄 License

This project is currently available for learning and demonstration purposes. Add a specific open-source license before granting others formal reuse or redistribution rights.

---

<p align="center">
  <b>Built with ☕ and a passion for technology.</b>
  <br/>
  <a href="https://cafe-os-cyan-iota.vercel.app/">Explore CafeOS</a>
</p>
