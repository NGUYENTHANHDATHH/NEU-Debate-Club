# Dashboard module access control

**Audit date:** 2026-11-13.

## Rules (verified)

- `BCN` can manage every `AdminModule`.
- A `TRUONG_BAN` can manage a module only when their `department` is in that module's department set.
- `MEMBER` (and `GUEST`) manage no modules; they get personal routes only.
- Inactive users manage nothing.
- The backend is the authority for API authorization; the frontend uses the same keys only to filter navigation and redirect.

## Registry (verified, keys match on both sides)

[AdminModule.java](../../backend/src/main/java/com/neudebateclub/backend/common/enums/AdminModule.java) ↔ `ADMIN_MODULE_KEYS` in [dashboard-modules.ts](../../frontend/src/constants/dashboard-modules.ts) — 14 identical keys, maintained by hand.

| Module | Managed by (besides BCN) | Dashboard route(s) |
|---|---|---|
| `TASK_ASSIGNMENT`, `NOTIFICATION_MANAGEMENT`, `DEPARTMENT_OPERATIONS`, `ANALYTICS` | every specialised department lead | assign, notifications/create, department-operations, charts |
| `PUBLICATIONS` | TRUYEN_THONG, NOI_DUNG | publications |
| `ASSET_LIBRARY` | KY_THUAT | library |
| `LANDING_CMS` | TRUYEN_THONG | cms |
| `FINANCE` | DOI_NGOAI | finance |
| `EVENT_MANAGEMENT` | SU_KIEN | events |
| `MEMBERSHIP` | NHAN_SU | members, **roles** |
| `TENURE` | NHAN_SU | tenure |
| `CROSS_DEPARTMENT_TASKS`, `ACTIVITY_LOG`, `HEALTH_DASHBOARD` | BCN only | assign-all, activity-log, health-dashboard |

## Server-side enforcement (verified)

| API | Check used | Matches the module the UI gates on? |
|---|---|---|
| CMS sections & catalog writes/admin reads | `requireModuleManager(LANDING_CMS)` | Yes |
| `POST/PUT /members` | `requireModuleManager(MEMBERSHIP)` | Yes |
| `GET /members` | `TRUONG_BAN`+ with department filter | Intentionally broader (used by assignment pages) |
| `POST/PUT/DELETE /events` | `requireModuleManager(EVENT_MANAGEMENT)` | Yes |
| `GET /events` | `MEMBER`+ | n/a |
| `POST /tasks` | `TASK_ASSIGNMENT` (lead limited to own department); `assignToAllDepartments` requires `CROSS_DEPARTMENT_TASKS` (BCN) | Yes (since 2026-11-13) |
| `PUT/DELETE /tasks/{id}` | `TASK_ASSIGNMENT` and task in lead's department (BCN: any) | Yes (since 2026-11-13) |
| `GET /tasks` | BCN: all; lead: own department only (other department → 403); member: own assigned tasks | Yes (since 2026-11-13) |
| `GET /tasks/{id}`, `/comments`, `PATCH /status` | assignee, BCN, or lead of the task's department | Yes |
| `POST /notifications` | `requireModuleManager(NOTIFICATION_MANAGEMENT)`; lead limited to own department/members | Yes (since 2026-11-13) |
| `GET /notifications` | `MEMBER`+, own rows only | n/a |
| Mock-only modules | none (no API) | n/a |

## Frontend enforcement (verified)

- Sidebar shows only granted module routes (`visibleDashboardGroups`).
- `DashboardAccessGuard` redirects a **signed-in** user without the module to `/dashboard`.
- `UserProvider` in `userContext.tsx` redirects an anonymous visitor on any `/dashboard` path to `/` once the session check finishes (static content can render briefly first). `middleware.ts` is a no-op, so there is no server-side route protection; the API remains the real boundary.
- `/dashboard/tasks/update` is not in the path map, so the guard treats it as forbidden; the page itself redirects to todo-list.

## Database note

No migration is needed for this model: V1 defines `bcn` and `truong_ban`; V9 adds `ky_thuat` and `nhan_su` departments.
