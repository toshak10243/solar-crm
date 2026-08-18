# Solar CRM — Mobile App (Android)

Flutter-based Android application for the Solar CRM system. Built for three roles — Admin, Manager, and Sales — each with a dedicated interface, role-scoped data access, and real-time push notifications.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Flutter | Cross-platform mobile framework |
| Dart | Programming language |
| Riverpod | State management |
| Dio | HTTP client with interceptors |
| flutter_secure_storage | Encrypted JWT token and session storage |
| firebase_core | Firebase SDK initialization |
| firebase_messaging | Push notifications (FCM) |
| flutter_local_notifications | Foreground notification display |
| fl_chart | Charts and analytics graphs |
| google_fonts | Typography |
| url_launcher | Call and WhatsApp integration |
| image_picker | Profile photo upload |
| cached_network_image | Network image caching |
| pdf + printing | PDF generation and sharing |
| share_plus | File and content sharing |
| intl | Date and number formatting |

---

## Prerequisites

- Flutter SDK 3.x installed
- Android SDK configured
- Java 17+
- A Firebase project with `google-services.json`

---

## Setup

```bash
cd solar_crm_mobile
flutter pub get
```

---

## Firebase Setup

Push notifications require Firebase.

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create or open your project
3. Add an Android app — package name: `com.example.solar_crm_mobile`
4. Download `google-services.json`
5. Place it at `android/app/google-services.json`

Without this file the app will not build.

---

## Building the Release APK

```bash
flutter clean
flutter pub get
flutter build apk --release
```

**APK location:**
```
build/app/outputs/flutter-apk/app-release.apk
```

Transfer this file to any Android device and install it. If installation is blocked, enable "Install from unknown sources" in phone settings under Security.

---

## Folder Structure

```
lib/
├── core/
│   ├── constants/
│   │   ├── api_endpoints.dart         # Base URL and all API paths
│   │   ├── app_colors.dart            # Brand color tokens
│   │   └── indian_states_cities.dart  # State and city data for dropdowns
│   ├── network/
│   │   └── api_client.dart            # Dio setup with JWT interceptor
│   ├── services/
│   │   └── firebase_messaging_service.dart  # FCM init, token, handlers
│   ├── theme/
│   │   └── app_theme.dart             # MaterialApp theme
│   └── utils/
│       └── storage_service.dart       # Secure token and session storage
│
├── features/
│   ├── admin/
│   │   ├── data/
│   │   │   └── admin_leads_service.dart
│   │   └── presentation/screens/
│   │       ├── admin_dashboard_screen.dart
│   │       ├── admin_leads_screen.dart
│   │       ├── admin_profile_screen.dart
│   │       ├── admin_reports_screen.dart
│   │       ├── admin_main_layout.dart
│   │       └── user_management_screen.dart
│   │
│   ├── auth/
│   │   ├── data/
│   │   │   └── auth_service.dart
│   │   ├── presentation/
│   │   │   ├── login_screen.dart
│   │   │   └── forgot_password_screen.dart
│   │   └── providers/
│   │       └── auth_provider.dart
│   │
│   ├── manager/
│   │   ├── data/
│   │   └── presentation/screens/
│   │       ├── manager_dashboard_screen.dart
│   │       ├── manager_leads_screen.dart
│   │       ├── manager_lead_detail_modal.dart
│   │       ├── manager_profile_screen.dart
│   │       ├── manager_reports_screen.dart
│   │       ├── manager_main_layout.dart
│   │       ├── team_followups_screen.dart
│   │       └── team_members_screen.dart
│   │
│   ├── notifications/
│   │   └── notification_bell.dart     # AppBar badge widget
│   │
│   ├── sales/
│   │   ├── data/
│   │   └── presentation/screens/
│   │       ├── sales_dashboard_screen.dart
│   │       ├── sales_leads_screen.dart
│   │       ├── sales_main_layout.dart
│   │       └── sales_profile_screen.dart
│   │
│   └── splash/
│       └── splash_screen.dart
│
└── main.dart                          # Firebase init, FCM init, app entry
```

---

## Role-Based Navigation

On login the app reads `role_id` from the JWT response and routes accordingly:

| Role | role_id | Home Screen |
|---|---|---|
| Super Admin | 1 | `AdminMainLayout` |
| Manager | 2 | `ManagerMainLayout` |
| Sales | 3 | `SalesMainLayout` |

Each layout has its own bottom navigation — users only see screens relevant to their role.

---

## Push Notifications

Handled by `firebase_messaging_service.dart`.

**Three states covered:**
- App open (foreground) — local notification shown via `flutter_local_notifications`
- App in background — FCM handles display automatically
- App closed (terminated) — notification shown on lock screen, tap opens app

**FCM token flow:**
1. App initializes Firebase on launch
2. After successful login, FCM token is fetched
3. Token is saved to backend via `PUT /api/users/fcm-token`
4. Backend uses this token to send targeted push notifications

**Notification types received:**

| Type | Trigger |
|---|---|
| `lead_assigned` | Admin or Manager assigned a lead to this user |
| `lead_created` | New lead added (Admin only) |
| `lead_won` | Lead marked Won (Admin + Manager) |
| `lead_lost` | Lead marked Lost or Not Interested |
| `status_changed` | Lead status updated (Manager) |
| `followup_added` | Follow-up logged on team lead (Manager) |
| `followup_today` | Daily 9 AM reminder for today's follow-ups |
| `site_visit_reminder` | Day-before reminder for site visits |
| `overdue_summary` | Daily 6 PM overdue follow-up alert |
| `weekly_summary` | Monday 9 AM team performance summary (Manager) |

---

## Secure Storage

Session data is stored using `flutter_secure_storage` with Android encrypted shared preferences.

```dart
FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
    resetOnError: true,
  ),
)
```

`resetOnError: true` ensures corrupt encrypted data is automatically cleared instead of crashing the app — this handles cases where the Android keystore becomes invalid after OS updates or app reinstalls with backup restore.

`AndroidManifest.xml` has `android:allowBackup="false"` and `android:fullBackupContent="false"` to prevent Android from restoring corrupt encrypted storage data on reinstall.

---

## API Configuration

Base URL is set in `lib/core/constants/api_endpoints.dart`:

```dart
static const String baseUrl = "https://your-domain.com/api";
```

Change this to your backend URL before building.

---

## Key Features by Role

**Admin**
- Full lead list with search and filters
- Create, edit, assign leads
- Delete leads
- User management
- Org-wide reports and charts
- Push notifications for all major events

**Manager**
- Team lead list — scoped to own team
- Reassign leads within team
- Team follow-ups view
- Team performance reports
- Push notifications for team activity

**Sales**
- Personal lead list — only assigned leads
- Visual pipeline stepper per lead
- Quick Won / Lost actions
- Log follow-ups with type, note, next date
- Overdue / Today / Upcoming 7-day strip
- Direct call and WhatsApp from lead card
- Push notifications for assignments and reminders

---

## Common Issues

**"Connecting to Portal" infinite on some phones**
Caused by corrupt `flutter_secure_storage` data. Fixed by `resetOnError: true` and `encryptedSharedPreferences: true`. If it still occurs, clear app data from phone settings.

**Login fails on some phones**
Usually a corrupt keystore or backup-restored encrypted data. Uninstall the app completely and reinstall — `allowBackup="false"` prevents the backup from restoring corrupt data.

**Notifications not showing**
- Check phone notification settings: Settings > Apps > Solar CRM > Notifications > Enable
- OnePlus/Xiaomi/Realme: Enable autostart for the app
- Battery optimization: Set to Unrestricted for Solar CRM

**Date showing 1 day behind**
All `DateTime.parse()` calls use `.toLocal()` to convert UTC server time to IST. If dates appear off, check that the device timezone is set correctly.

---

## Default Login

```
Username : admin
Password : admin123
```

Change this after first login via the profile screen.

---

*Built from scratch by Toshak Sharma*
*toshak10243@gmail.com*
*[linkedin.com/in/toshaksharma](https://www.linkedin.com/in/toshaksharma/)*