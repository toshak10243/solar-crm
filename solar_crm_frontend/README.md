# Solar CRM — Web Frontend

React-based web dashboard for the Solar CRM system. Built for three roles — Admin, Manager, and Sales — each with a dedicated interface and role-scoped data access.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Material UI (MUI) | Component library |
| React Router | Client-side routing |
| Axios | HTTP requests |
| XLSX | Excel/CSV parsing for bulk import |
| country-state-city | Indian state and city dropdowns |

---

## Getting Started

**Requirements:** Node.js 18+

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

**Production build:**
```bash
npm run build
```

Output goes to the `dist/` folder. Deploy this folder to any static host or web server.

---

## Environment

Create a `.env` file in this folder:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production, replace with your server URL.

---

## Folder Structure

```
src/
├── components/
│   └── ImportLeadsDialog.jsx      # 3-step CSV/Excel bulk import wizard
├── pages/
│   ├── Admin/
│   │   ├── Dashboard.jsx          # Org-wide KPIs and analytics
│   │   ├── Leads.jsx              # Full lead management (CRUD, assign, import, export)
│   │   ├── Reports.jsx            # Manager and rep performance reports
│   │   └── Users.jsx              # User management
│   ├── Manager/
│   │   ├── ManagerDashboard.jsx   # Team KPIs
│   │   ├── ManagerLeads.jsx       # Team lead management
│   │   ├── ManagerReports.jsx     # Team performance reports
│   │   ├── TeamFollowups.jsx      # All upcoming follow-ups across team
│   │   └── LeadDetailModal.jsx    # Full lead detail with follow-up timeline
│   └── Sales/
│       ├── SalesDashboard.jsx     # Personal KPIs
│       └── SalesLeads.jsx         # Assigned leads with pipeline stepper
├── services/
│   ├── leadService.js             # All lead API calls
│   └── userServices.js            # User and team API calls
└── App.jsx                        # Routes and role-based layout
```

---

## Role-Based Pages

**Admin** — `/admin/*`
- Full lead table with search, filters, CSV export, bulk import
- Assign and reassign leads to any user
- User management panel
- Org-wide performance reports with manager and rep breakdowns

**Manager** — `/manager/*`
- Lead table scoped to their team only
- Reassign leads within team
- Team follow-ups view — all upcoming, today, and overdue follow-ups
- Team performance reports

**Sales** — `/sales/*`
- Lead table scoped to assigned leads only
- Visual pipeline stepper per lead
- Quick Won / Lost actions
- Follow-up logging with next date and type
- Overdue / Today / Upcoming 7-day follow-up strip at top of page

---

## Key Features

**Leads**
- Duplicate mobile number detection on create
- Status restricted to create-mode only (Sales cannot set status on create — backend forces "New Lead")
- State and city dropdowns using live Indian data
- Field-level edit restrictions for Sales role
- CSV export of all leads matching current filters

**Bulk Import**
- Upload CSV or Excel file
- Preview and validate rows before importing
- Download sample template with correct column headers
- Row-by-row error reporting after import

**Follow-up Strip (Sales)**
- Computed client-side from existing lead data — no extra API call
- Shows Overdue (red), Today (amber), Upcoming 7 days (blue)
- Each lead name is clickable and opens the detail drawer directly

**Reports**
- KPI cards for total, new, won, lost leads
- Donut chart for status distribution
- Source bar chart
- Manager tab and Rep tab with pagination
- PDF and CSV export

---

## Default Login

```
Username : admin
Password : admin123
```

Change this after first login.

---

*Built from scratch by Toshak Sharma*
*toshak10243@gmail.com*
*[linkedin.com/in/toshaksharma](https://www.linkedin.com/in/toshaksharma/)*