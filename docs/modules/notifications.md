# Notifications module

**Implemented:** 2026-11-13 (uncommitted). Evidence level is **verified** (source read, unit tests run) unless marked.

## Owner decisions (2026-11-13)

| Topic | Decision |
|---|---|
| Automatic notifications | Only when a task is **created**: the assignee is notified. Assigning to all departments notifies each of the six resolved leads. No notification on status/progress/edit/delete. |
| Manual notifications | BCN → whole club, one or more departments, or specific members. Department lead → own whole department or specific members of it. Other roles cannot send. |
| Read state | **None.** No unread badge, no "mark as read". The bell and the read page simply list the newest items. |
| Types | Manual: `GENERAL`, `TASK_UPDATE`, `REWARD`, `URGENT`. Automatic: `TASK_ASSIGNED` (reserved, rejected on manual send). |
| Sender | Stored (`created_by`, V22) and shown. |
| Bell refresh | Polls every 60 s while the tab is visible, and reloads when opened. |
| Bell content | 5 newest + "Xem tất cả" link to the read page. |
| Out of scope (v1) | Pinning, attachments, scheduling, drafts, PWA push, deadline reminders, the public landing-page `NotificationWidget` (static marketing content, untouched). |

## Layer trace

| Layer | Source |
|---|---|
| Schema | V4 `notifications` (one row per recipient: `user_id`, `title`, `body`, `type` VARCHAR(50), `entity_id`, `created_at`); [V22](../../backend/src/main/resources/db/migration/V22__add_notification_sender.sql) adds `created_by → users(id) ON DELETE SET NULL` and index `(user_id, created_at DESC)`. V4 `announcements` remains unused. |
| Entity / repo | [Notification.java](../../backend/src/main/java/com/neudebateclub/backend/notification/Notification.java) (`type` as `@Enumerated(STRING)`), `NotificationRepository` |
| Service | [NotificationService.java](../../backend/src/main/java/com/neudebateclub/backend/notification/NotificationService.java): `listForUser`, `notifyTaskAssigned`, `sendManual` (recipient resolution + authorization) |
| Controller | [NotificationController.java](../../backend/src/main/java/com/neudebateclub/backend/notification/NotificationController.java) |
| Task hook | `TaskController.create` calls `notifyTaskAssigned` after each saved task, in the same transaction |
| Frontend client | `AppNotification`, `CreateNotificationPayload`, `fetchNotifications`, `createNotification` in [api.ts](../../frontend/src/lib/api.ts); labels/colours/links in [lib/notifications.ts](../../frontend/src/lib/notifications.ts) |
| UI | [NotificationBell](../../frontend/src/components/layout/NotificationBell.tsx) in `DashboardHeader`; [NotificationPages.tsx](../../frontend/src/components/dashboard/NotificationPages.tsx) (`ReadNotificationPage`, `CreateNotificationPage`); TodoListPage opens `?task=<id>` |
| Tests | [NotificationServiceTest](../../backend/src/test/java/com/neudebateclub/backend/notification/NotificationServiceTest.java) (9); `TaskControllerTest` verifies the hook. |

## Endpoints

| Method & path | Check | Frontend caller |
|---|---|---|
| `GET /notifications?limit=` | `MEMBER`+; only the caller's rows; newest first; default 50, clamped 1–100 | `fetchNotifications` ← NotificationBell (5), ReadNotificationPage (100) |
| `POST /notifications` | module `NOTIFICATION_MANAGEMENT` + audience rules below; 201 `{ recipientCount }` | `createNotification` ← CreateNotificationPage |

Request body: `title` (≤255), `body` (≤5000), `type`, `audience` = `ALL` \| `DEPARTMENTS` \| `MEMBERS`, `departments[]`, `memberIds[]` (≤500).

## Recipient rules

- Recipients are active users whose role is not `GUEST`; the sender is always excluded. An empty result → 400.
- `ALL`: BCN only (lead → 403).
- `DEPARTMENTS`: BCN any set; lead exactly `[own department]` (anything else → 403).
- `MEMBERS`: every id must exist, be active and not `GUEST` (else 400); a lead may only pick members of their own department (else 403).
- Task hook: skipped when assignee = assigner (e.g. BCN fallback when a department has no active member).

## Click targets

`TASK_ASSIGNED` with `entityId` → `/dashboard/tasks/todo-list?task=<id>`, which opens the progress editor for that task and strips the query. Everything else → `/dashboard/notifications/read?id=<id>`.

## Known limitations

| ID | Limitation |
|---|---|
| N-1 | Fan-out writes one row per recipient; a whole-club send loads all users in memory (`findAllByOrderByFullNameAsc`). Fine at club size. |
| N-2 | No retention/cleanup; rows accumulate. Deleting a task leaves its notifications (link then shows "not found"). |
| N-3 | Recipients are resolved at send time; members added later do not see earlier broadcasts. |
| N-4 | Polling, not push: new items appear within ~60 s. |
| N-5 | ~~Not run against a real DB.~~ **Verified 2026-11-13** on the local Docker DB: Flyway applied V22, Hibernate `validate` passed, backend healthy, `GET /api/notifications` without token → 401. Not yet exercised in a browser with a logged-in user. |
| N-6 | Department names are duplicated again on the frontend (`DEPARTMENT_NAMES`), alongside AssignTaskPage/AssignAllTasksPage. |
