# Solar CRM

A full-stack Customer Relationship Management system built specifically for solar installation businesses. Manages leads, tracks sales pipelines, handles team assignments, and delivers real-time push notifications across web and mobile.

---

## Built By

**Toshak Sharma**
toshak10243@gmail.com
[linkedin.com/in/toshaksharma](https://www.linkedin.com/in/toshaksharma/)

---

## What This System Does

Solar CRM is designed for companies that sell and install solar panels. It gives the admin full visibility over all leads in the organization, lets managers track and assign leads within their team, and gives sales representatives a focused view of their own pipeline — with follow-up reminders, site visit alerts, and push notifications delivered directly to their phones even when the app is closed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js, Express.js |
| Database | MySQL |
| Web Frontend | React 18, Material UI (MUI) |
| Mobile App | Flutter (Android) |
| Authentication | JWT (JSON Web Tokens) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| File Storage | Multer (local uploads) |
| Scheduled Jobs | node-cron |
| State Management (Flutter) | Riverpod |

---

## Role-Based Access

The system has three roles. Each role sees only what it needs to.

**Super Admin (role_id = 1)**
- Full access to all leads across the organization
- Create, edit, delete, assign, and bulk-import leads
- Manage all users (create, activate, deactivate)
- View org-wide reports and performance data
- Receives notifications when leads are created, won, lost, or bulk-imported

**Manager (role_id = 2)**
- Access limited to their own team's leads
- Create and reassign leads within their team
- View team follow-ups and performance reports
- Receives notifications on team pipeline changes, follow-ups, and weekly summaries

**Sales (role_id = 3)**
- Access limited to leads assigned to them
- Create new leads (auto-assigned to themselves)
- Update interest status, required kW, priority, remark, follow-up dates
- Receives notifications when leads are assigned or reassigned to them

---

## Project Structure

```
solar-crm/
├── backend/                        # Node.js + Express API
│   ├── config/
│   │   ├── db.js                   # MySQL connection
│   │   └── serviceAccountKey.json  # Firebase Admin SDK key (not in git)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── leadController.js
│   │   ├── profileController.js
│   │   ├── settingsController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── leadModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── leadRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── notificationService.js  # Firebase Admin SDK + FCM
│   │   └── scheduledNotifications.js # node-cron scheduled reminders
│   ├── uploads/                    # Profile photos (local)
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/                       # React + MUI Web App
│   ├── src/
│   │   ├── components/
│   │   │   └── ImportLeadsDialog.jsx
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Leads.jsx
│   │   │   │   ├── Reports.jsx
│   │   │   │   └── Users.jsx
│   │   │   ├── Manager/
│   │   │   │   ├── ManagerDashboard.jsx
│   │   │   │   ├── ManagerLeads.jsx
│   │   │   │   ├── ManagerReports.jsx
│   │   │   │   ├── TeamFollowups.jsx
│   │   │   │   └── LeadDetailModal.jsx
│   │   │   └── Sales/
│   │   │       ├── SalesDashboard.jsx
│   │   │       └── SalesLeads.jsx
│   │   ├── services/
│   │   │   ├── leadService.js
│   │   │   └── userServices.js
│   │   └── App.jsx
│   └── package.json
│
├── solar_crm_mobile/               # Flutter Android App
│   ├── lib/
│   │   ├── core/
│   │   │   ├── constants/
│   │   │   │   ├── api_endpoints.dart
│   │   │   │   └── app_colors.dart
│   │   │   ├── network/
│   │   │   │   └── api_client.dart
│   │   │   └── services/
│   │   │       └── firebase_messaging_service.dart
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── manager/
│   │   │   ├── notifications/
│   │   │   │   └── notification_bell.dart
│   │   │   └── sales/
│   │   └── main.dart
│   ├── android/
│   │   └── app/
│   │       ├── google-services.json
│   │       └── src/main/AndroidManifest.xml
│   └── pubspec.yaml
│
└── database/
    └── solar_crm.sql               # Full database dump
```

---

## Database

The database file is included in the `database/` folder.

**Import it:**
```bash
mysql -u root -p solar_crm < database/solar_crm.sql
```

**Key tables:**

| Table | Purpose |
|---|---|
| users | All users with roles, FCM tokens |
| leads | All lead records with full pipeline data |
| lead_followups | Follow-up notes per lead |
| lead_activity_logs | Audit trail of every change |
| lead_assignments | Assignment history |
| notifications | In-app notification history |
| settings | Organization-level settings |
| password_reset_otps | OTP records for password reset |

---

## Default Admin Account

```
Username : admin
Password : admin123
```

Change this password immediately after first login.

---

## Environment Variables

Create a `.env` file in the `backend/` folder. An example file `.env.example` is included.

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=solar_crm

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

---

## Running the Backend

**Requirements:** Node.js 18+, MySQL 8+

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

node server.js
# or with PM2 for production:
pm2 start server.js --name solar-crm-backend
```

The API will be available at `http://localhost:5000`.

---

## Running the Web Frontend

**Requirements:** Node.js 18+

```bash
cd frontend
npm install
npm run dev
```

The web app will open at `http://localhost:5173`.

---

## Firebase Setup (Push Notifications)

Push notifications require a Firebase project.

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Add an Android app with your package name
4. Download `google-services.json` and place it in `solar_crm_mobile/android/app/`
5. Go to Project Settings > Service Accounts > Generate new private key
6. Download the JSON file, rename it `serviceAccountKey.json`
7. Place it in `backend/config/serviceAccountKey.json`
8. Add it to `.gitignore` — this file must never be committed

---

## Building the Flutter App (Release APK)

**Requirements:** Flutter SDK installed, Android SDK configured

```bash
cd solar_crm_mobile

flutter clean
flutter pub get
flutter build apk --release
```

**The release APK will be at:**
```
solar_crm_mobile/build/app/outputs/flutter-apk/app-release.apk
```

Transfer this file to any Android device and install it. If installation is blocked, enable "Install from unknown sources" in phone settings.

---

## API Endpoints

**Auth**
```
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/verify-otp
POST   /api/auth/reset-password
```

**Users** (Admin only)
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
PATCH  /api/users/status/:id
DELETE /api/users/:id
PUT    /api/users/fcm-token
```

**Leads**
```
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
PATCH  /api/leads/:id/status
POST   /api/leads/:id/assign
POST   /api/leads/:id/followups
GET    /api/leads/:id/followups
GET    /api/leads/:id/logs
DELETE /api/leads/:id
POST   /api/leads/bulk-import
PATCH  /api/leads/bulk-reassign
GET    /api/leads/team/followups
```

**Dashboard**
```
GET    /api/dashboard
```

**Notifications**
```
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/mark-all-read
PATCH  /api/notifications/:id/read
```

**Profile**
```
GET    /api/profile
PUT    /api/profile
POST   /api/profile/change-password
POST   /api/profile/upload-photo
```

---

## Push Notification Events

| Event | Who Gets Notified |
|---|---|
| New lead created | Admin |
| Lead assigned to sales rep | That sales rep |
| Lead marked Won | Admin + Manager |
| Lead marked Lost or Not Interested | Admin + Manager |
| Lead status changed | Manager |
| Follow-up added | Manager |
| Bulk import completed | Admin (who triggered it) |
| Today's follow-ups (9 AM daily) | Sales rep + Manager |
| Tomorrow's site visits (8 AM daily) | Sales rep |
| Overdue follow-ups (6 PM daily) | Sales rep |
| Weekly team summary (Monday 9 AM) | Manager |

---

## Lead Pipeline

A lead moves through these stages:

```
New Lead
  Contacted
    Follow-up Pending
      Site Visit Scheduled
        Quotation Sent
          Negotiation
            Won
```

Terminal states (lead stops moving): **Lost**, **Not Interested**

Both terminal states can be reopened to "Contacted" if the situation changes.

---

## Key Features

**Lead Management**
- Full CRUD with duplicate mobile number detection
- Bulk import from CSV or Excel files
- CSV export of all leads with filters applied
- Bulk reassign leads when a sales rep leaves

**Pipeline Tracking**
- Visual stepper in mobile app
- Quick Won / Lost actions
- Status-specific validations (quotation amount required for "Quotation Sent", site visit date required for "Site Visit Scheduled")

**Follow-up System**
- Log calls, WhatsApp messages, meetings, site visits
- Set next follow-up date per interaction
- Overdue follow-up alerts on web and mobile
- Today / Upcoming 7 days / Overdue summary strip

**Team Management**
- Manager sees only their own team's leads
- Admin can reassign across any team
- Team follow-ups view for managers
- Sales performance reports

**Mobile App**
- Android APK
- Role-based navigation (Admin / Manager / Sales)
- Push notifications — background, foreground, and terminated app states
- Call and WhatsApp directly from lead card
- Offline-tolerant with JWT session persistence

---

## Security

- All routes protected with JWT middleware
- Role-based authorization on every route
- Sales reps cannot assign leads to other users — backend forces self-assignment
- Managers can only assign leads to their own team members
- Sales reps can only edit a restricted set of fields on their leads
- `serviceAccountKey.json` must be in `.gitignore` — never committed

---

## Scheduled Reminders (node-cron, IST timezone)

| Time | Job |
|---|---|
| 8:00 AM daily | Site visit reminders for tomorrow |
| 9:00 AM daily | Today's follow-up reminders |
| 6:00 PM daily | Overdue follow-up summary |
| 9:00 AM Monday | Weekly team performance summary |

---

*Built from scratch by Toshak Sharma*
*toshak10243@gmail.com*
*[linkedin.com/in/toshaksharma](https://www.linkedin.com/in/toshaksharma/)*