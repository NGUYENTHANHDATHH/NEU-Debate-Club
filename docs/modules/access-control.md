# Dashboard module access control

**Audit date:** 2026-11-13.

## Rules (verified)

- `BCN` can manage every `AdminModule`.
- Since 2026-11-13 the department → module mapping is **data, not code**: table `module_permissions` (V23), edited by BCN only on `/dashboard/roles` (`PUT /module-permissions`, activity-logged). It starts empty: until BCN ticks something, only BCN has modules.
- A ticked department grants the module only to that department's active **`TRUONG_BAN`** users. `MEMBER`, `GUEST` and inactive users get nothing (personal routes only). Single source: `RoleGuard.modulesOf`.
- The backend is the authority for API authorization; the frontend uses the same keys only to filter navigation and redirect. The sidebar refreshes its module list on login/reload; the API applies changes immediately.

## Registry (verified, keys match on both sides)

[AdminModule.java](../../backend/src/main/java/com/neudebateclub/backend/common/enums/AdminModule.java) ↔ `ADMIN_MODULE_KEYS` in [dashboard-modules.ts](../../frontend/src/constants/dashboard-modules.ts) — 15 identical keys, maintained by hand. Which department holds which key lives only in `module_permissions`.

| Module | Dashboard route(s) |
|---|---|
| `TASK_ASSIGNMENT`, `NOTIFICATION_MANAGEMENT`, `DEPARTMENT_OPERATIONS`, `ANALYTICS` | assign, notifications/create, department-operations, charts |
| `PUBLICATIONS`, `ASSET_LIBRARY`, `LANDING_CMS` | publications, library, cms |
| `FINANCE`, `EVENT_MANAGEMENT`, `SPONSORS` | finance, events, sponsors (`/partners` API) |
| `SPONSORS` exception | a tick also grants ordinary MEMBERs of that department (`RoleGuard.MEMBER_MODULES`, owner 2026-11-25) |
| `MEMBERSHIP`, `TENURE` | members, **roles** (read-only matrix for non-BCN), tenure |
| `CROSS_DEPARTMENT_TASKS`, `ACTIVITY_LOG`, `HEALTH_DASHBOARD` | assign-all, activity-log, health-dashboard |

## Server-side enforcement (verified)

| API | Check used | Matches the module the UI gates on? |
|---|---|---|
| CMS sections & catalog writes/admin reads | `requireModuleManager(LANDING_CMS)` | Yes |
| `POST/PUT /members` | `requireModuleManager(MEMBERSHIP)` | Yes |
| `GET /members` | `TRUONG_BAN`+ with department filter | Intentionally broader (used by assignment pages) |
| `GET /module-permissions` / `PUT` | `MEMBERSHIP` / `BCN` only (BCN department rejected) | Yes |
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

V23 `module_permissions(module, department)` stores Java enum names as VARCHAR (unique pair, no seed). Roles/departments themselves are still the V1/V9 PostgreSQL enums.
