# 🔬 Lab Scheduler - Next.js Frontend

Modern Next.js 14 (React 18) application with **Next.js App Router** for the **Smart Laboratory Sample Processing & Deadline Scheduler**, communicating with the Spring Boot REST Backend via REST APIs.

Runs **independently** on **port 3000** — the backend URL is configured via a `.env.local` file.

---

## 📁 Project Structure & Page Routes

```text
frontend/
├── app/
│   ├── layout.jsx            # Root layout with Bootstrap and LabProvider
│   ├── page.jsx              # Landing / Sign-in route (`/`)
│   ├── globals.css           # Custom styles & SLA color indicators
│   ├── dashboard/
│   │   └── page.jsx          # Dashboard & Live Queue (`/dashboard`)
│   ├── samples/
│   │   └── page.jsx          # Sample Management Registry (`/samples`)
│   ├── register-sample/
│   │   └── page.jsx          # Register Incoming Sample (`/register-sample`)
│   ├── reports/
│   │   └── page.jsx          # Daily SLA & Performance Reports (`/reports`)
│   └── admin/
│       └── page.jsx          # Administrator Console (`/admin`)
├── components/
│   ├── Navbar.jsx            # Navigation bar with Next.js Link & active highlighting
│   ├── LoginView.jsx         # Authentication form & quick-login buttons
│   ├── DashboardTab.jsx      # Machine workload cards & Live priority queue
│   ├── SamplesTab.jsx        # Sample management registry with filters & search
│   ├── RegisterTab.jsx       # Register sample form with dynamic test types
│   ├── ReportsTab.jsx        # SLA performance metrics & interactive drill-down
│   ├── AdminTab.jsx          # Admin console (Machines, Users, Priorities, Test Types)
│   ├── Modals.jsx            # Downtime modal & Sample audit trail modal
│   └── Toast.jsx             # Live feedback toast notifications
├── lib/
│   ├── api.js                # Centralized API client (`fetchApi`, `loginApi`)
│   └── LabContext.js         # Global LabProvider, auth session guard, and shared state
├── static-archive/           # Preserved backup of original vanilla HTML/CSS/JS files
├── .env.local                # Local environment variables — git-ignored (create this)
├── .env.local.example        # Environment variable template — copy to .env.local
├── package.json              # Next.js 14, React 18, Bootstrap 5 dependencies
├── next.config.mjs
└── README.md
```

---

## ⚙️ Environment Configuration

The frontend connects to the Spring Boot backend using the `NEXT_PUBLIC_API_BASE_URL` environment variable, configured in `.env.local`.

### Setup

1. Copy the template:
   ```powershell
   # Windows
   copy .env.local.example .env.local

   # Linux / macOS
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` to match your backend URL:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

> **Important**: `.env.local` is git-ignored and must never be committed.  
> The `NEXT_PUBLIC_` prefix makes the variable available in the browser bundle.  
> If `.env.local` is absent, the default `http://localhost:8080` is used automatically.

### Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL of the Spring Boot REST API |

---

## 🚀 How to Run the Frontend

The frontend runs **independently** — it only needs the backend URL set in `.env.local`.

### 1. Install Dependencies

```powershell
cd frontend
npm install
```

### 2. Development Mode (Port 3000, with Hot Reload)

```powershell
npm run dev
```

Open: 👉 **[http://localhost:3000](http://localhost:3000)**

### 3. Production Build & Start

```powershell
npm run build
npm start
```

---

## 🌐 Page URLs & Routing

| URL Route | View / Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LoginView` | Public | Authentication screen (auto-redirects to `/dashboard` if signed in) |
| `/dashboard` | `DashboardTab` | Staff / Admin | Live machine workloads, capacity meters, priority queue, auto-dispatch |
| `/samples` | `SamplesTab` | Staff / Admin | Searchable, filterable specimen registry with complete/hold/audit actions |
| `/register-sample`| `RegisterTab` | Staff / Admin | Dynamic test type sample intake form with SLA calculation |
| `/reports` | `ReportsTab` | Staff / Admin | Daily turnaround performance, delay detection, and volume drilldowns |
| `/admin` | `AdminTab` | Admin Only | Equipment config, operator accounts, priority tiers, test categories |

- **Direct URL Access & Refresh**: Navigating directly to any route restores the user session from `sessionStorage` automatically.
- **Role-based Protection**: Accessing `/admin` as a non-admin redirects to `/dashboard`.
- **Active Navigation Highlighting**: Active nav item styled via `usePathname()`.

---

## 🔑 Default Sign-in Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Staff** | `staff` | `staff123` |
