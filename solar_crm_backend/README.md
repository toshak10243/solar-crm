# Solar CRM — Backend API

Node.js REST API for the Solar CRM system. Handles authentication, lead management, user management, push notifications, and scheduled reminders for a solar installation business.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web framework |
| MySQL | Primary database |
| mysql2 | MySQL driver with promise support |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Multer | File uploads (profile photos) |
| firebase-admin | Firebase Admin SDK for push notifications |
| node-cron | Scheduled notification jobs |
| dotenv | Environment variable management |
| cors | Cross-origin request handling |

---

## Getting Started

**Requirements:** Node.js 18+, MySQL 8+

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
node server.js
```

**With PM2 (recommended for production):**
```bash
npm install -g pm2
pm2 start server.js --name solar-crm-backend
pm2 save
pm2 startup
```

The API runs at `http://localhost:5000`.

---

## Environment Variables

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

## Folder Structure

```
backend/
├── config/
│   ├── db.js                      # MySQL connection pool
│   └── serviceAccountKey.json     # Firebase Admin SDK key (not in git)
├── controllers/
│   ├── authController.js          # Login, OTP, password reset
│   ├── dashboardController.js     # KPI queries per role
│   ├── leadController.js          # All lead operations + notification triggers
│   ├── profileController.js       # Profile view, update, photo upload
│   ├── settingsController.js      # Organization settings
│   └── userController.js          # User CRUD + FCM token update
├── middleware/
│   ├── authMiddleware.js          # JWT verification
│   └── roleMiddleware.js          # Role-based route authorization
├── models/
│   ├── leadModel.js               # All lead DB queries
│   └── userModel.js               # All user DB queries
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── leadRoutes.js
│   ├── notificationRoutes.js
│   ├── profileRoutes.js
│   ├── settingsRoutes.js
│   └── userRoutes.js
├── services/
│   ├── notificationService.js     # Firebase FCM — send to user, send to role
│   └── scheduledNotifications.js  # node-cron daily and weekly jobs
├── uploads/                       # Profile photos stored locally
├── app.js                         # Express app setup, middleware, route mounting
├── server.js                      # Server entry point, DB connect, cron start
└── package.json
```

---

## Database Setup

Import the included SQL file:

```bash
mysql -u root -p solar_crm < database/solar_crm.sql
```

Or create the database manually and import:

```bash
mysql -u root -p -e "CREATE DATABASE solar_crm;"
mysql -u root -p solar_crm < database/solar_crm.sql
```

**Tables:**

| Table | Purpose |
|---|---|
| users | All users — Admin, Manager, Sales — with FCM tokens |
| roles | Role definitions (1=Admin, 2=Manager, 3=Sales) |
| leads | All lead records with full pipeline data |
| lead_followups | Follow-up notes per lead |
| lead_activity_logs | Audit trail of every change on every lead |
| lead_assignments | Assignment history — who assigned, when |
| notifications | Push notification history per user |
| settings | Organization-level configuration |
| password_reset_otps | OTP records for password reset flow |

---

## API Reference

### Auth

```
POST   /api/auth/login              # Login with username/email/mobile
POST   /api/auth/forgot-password    # Send OTP to email
POST   /api/auth/verify-otp         # Verify OTP
POST   /api/auth/reset-password     # Reset password after OTP verified
```

### Users (Admin only)

```
GET    /api/users                   # All users with filters
POST   /api/users                   # Create user
GET    /api/users/:id               # Single user
PUT    /api/users/:id               # Update user
PATCH  /api/users/status/:id        # Activate or deactivate user
DELETE /api/users/:id               # Soft delete user
GET    /api/users/team              # Manager's team members
PUT    /api/users/fcm-token         # Save FCM token after login (all roles)
```

### Leads

```
GET    /api/leads                   # All leads (scoped by role)
POST   /api/leads                   # Create lead (Admin, Manager, Sales)
GET    /api/leads/:id               # Single lead detail
PUT    /api/leads/:id               # Update lead (field-restricted for Sales)
PATCH  /api/leads/:id/status        # Update pipeline status
POST   /api/leads/:id/assign        # Assign lead to a user
POST   /api/leads/:id/followups     # Add follow-up note
GET    /api/leads/:id/followups     # Get follow-up timeline
GET    /api/leads/:id/logs          # Get activity log
DELETE /api/leads/:id               # Delete lead (Admin only)
POST   /api/leads/bulk-import       # Bulk import from CSV/Excel
PATCH  /api/leads/bulk-reassign     # Bulk reassign all leads from one user to another
GET    /api/leads/team/followups    # All team follow-ups (Manager only)
```

### Dashboard

```
GET    /api/dashboard               # KPI data scoped by role
```

### Notifications

```
GET    /api/notifications                    # User's notification history
GET    /api/notifications/unread-count       # Unread badge count
PATCH  /api/notifications/mark-all-read      # Mark all as read
PATCH  /api/notifications/:id/read           # Mark single notification as read
```

### Profile

```
GET    /api/profile                 # Current user profile
PUT    /api/profile                 # Update profile details
POST   /api/profile/change-password # Change password
POST   /api/profile/upload-photo    # Upload profile photo
```

### Settings

```
GET    /api/settings                # Get organization settings
PUT    /api/settings                # Update settings (Admin only)
```

---

## Role-Based Access Control

Routes are protected at two levels:

**JWT Middleware (`authMiddleware.js`)** — verifies token on every protected route.

**Role Middleware (`roleMiddleware.js`)** — restricts routes to specific roles.

```javascript
// Example: Only Admin can delete leads
router.delete("/:id", verifyToken, authorizeRoles(1), deleteLead);

// Admin, Manager, and Sales can create leads
router.post("/", verifyToken, authorizeRoles(1, 2, 3), createLead);
```

**Data scoping in controllers:**
- Admin sees all leads
- Manager sees only leads assigned to their team members
- Sales sees only leads assigned to themselves

**Additional security rules enforced in controllers:**
- Sales reps cannot set `assigned_to` — backend forces self-assignment
- Sales reps can only edit: `interest_status`, `required_kw`, `remark`, `priority`, `next_follow_up_date`, `site_visit_date`, `quotation_amount`
- Managers can only assign leads to users within their own team

---

## Push Notifications

Firebase Admin SDK is used to send push notifications to Android devices.

**Setup:**
1. Download `serviceAccountKey.json` from Firebase Console (Project Settings > Service Accounts)
2. Place it at `config/serviceAccountKey.json`
3. Add `config/serviceAccountKey.json` to `.gitignore` — this file must never be committed

**Notification triggers in `leadController.js`:**

| Action | Who is notified |
|---|---|
| Lead created | Admin (all admins) |
| Lead assigned | The sales rep receiving the lead |
| Lead marked Won | Admin + Manager of that team |
| Lead marked Lost or Not Interested | Admin + Manager of that team |
| Lead status changed | Manager of that team |
| Follow-up added | Manager of that team |
| Bulk import completed | The user who triggered the import |

---

## Scheduled Notifications

Defined in `services/scheduledNotifications.js`, started from `server.js` on boot.

All times are IST (Asia/Kolkata timezone).

| Schedule | Job |
|---|---|
| 8:00 AM daily | Site visit reminders — sales rep notified 1 day before |
| 9:00 AM daily | Today's follow-up reminders — sales rep + manager |
| 6:00 PM daily | Overdue follow-up summary — sales rep |
| 9:00 AM every Monday | Weekly team performance summary — manager |

---

## File Uploads

Profile photos are uploaded via Multer and stored in the `uploads/` folder.

Served as static files at `/uploads/filename.jpg`.

Make sure the `uploads/` folder exists and is writable:

```bash
mkdir -p uploads
chmod 755 uploads
```

---

## Default Admin Account

```
Username : admin
Password : admin123
```

Change this password immediately after first deployment.

---

## PM2 Useful Commands

```bash
pm2 status                          # Check process status
pm2 logs solar-crm-backend          # Live logs
pm2 logs solar-crm-backend --lines 50 --nostream   # Last 50 lines
pm2 restart solar-crm-backend       # Restart
pm2 flush solar-crm-backend         # Clear logs
pm2 stop solar-crm-backend          # Stop
```

---

*Built from scratch by Toshak Sharma*
*toshak10243@gmail.com*
*[linkedin.com/in/toshaksharma](https://www.linkedin.com/in/toshaksharma/)*