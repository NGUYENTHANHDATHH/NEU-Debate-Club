# Tasks module

**Audit date:** 2026-11-13. Evidence level is **verified** (source read) unless marked.

## Layer trace

| Layer | Source |
|---|---|
| Schema | V3 `tasks`, `task_comments`; V9 adds `tasks.event_id → events(id) ON DELETE SET NULL`; V21 adds `tasks.progress` (0–100, NOT NULL) and nullable `task_comments.progress`; V8 trigger `trg_task_completed_at` sets/clears `completed_at` on UPDATE |
| Entities | [Task.java](../../backend/src/main/java/com/neudebateclub/backend/task/Task.java), [TaskComment.java](../../backend/src/main/java/com/neudebateclub/backend/task/TaskComment.java) |
| Repositories | `TaskRepository` (derived queries + native `findWithFilters`), `TaskCommentRepository` (`@EntityGraph` user) |
| Controller + DTOs | [TaskController.java](../../backend/src/main/java/com/neudebateclub/backend/task/TaskController.java) — no service layer; DTO records nested in the controller |
| Frontend client | `BackendTask`, `CreateTaskPayload`, `UpdateTaskPayload`, `TaskComment` and helpers in [api.ts](../../frontend/src/lib/api.ts) |
| UI | [TodoListPage](../../frontend/src/components/dashboard/TodoListPage.tsx) (assignee), [AssignTaskPage](../../frontend/src/components/dashboard/AssignTaskPage.tsx) (department lead), [AssignAllTasksPage](../../frontend/src/components/dashboard/AssignAllTasksPage.tsx) (BCN), [TaskHistory](../../frontend/src/components/dashboard/TaskHistory.tsx), `DepartmentOperationsPage` in MockPages |
| Tests | [TaskControllerTest](../../backend/src/test/java/com/neudebateclub/backend/task/TaskControllerTest.java) — 6 Mockito tests, passed on 2026-11-13 |

Endpoints are listed in [dependency-map.md](../dependency-map.md#tasks--taskcontroller).

## Behaviour

- **Create.** Department leads must pick an `assignedToId` in their own department. BCN may omit it; the lead is then resolved by `LIMIT 1` query (first active `truong_ban` → any active member of that department → the assigner). `assignToAllDepartments=true` creates one task per specialised department (6), each assigned to the resolved lead, `crossDepartment=true`.
- **Progress** (`PATCH /{id}/progress`): assignee only; `progress` 0–100 and non-blank `content` ≤ 5000. 0 → `TODO`, 100 → `DONE`, else `IN_PROGRESS`. Writes a comment with a progress snapshot in the same transaction.
- **Status** (`PATCH /{id}/status`): assignee, BCN, or same-department lead. Records a comment.
- **Comments** are returned oldest first. V21 left historical comments with `progress = NULL`. The UI prepends a synthetic "task created" milestone from `tasks.created_at`.
- `completed_at` is written both by the controller and by the V8 trigger on UPDATE (duplicated rule; the trigger wins on UPDATE).

## Verified gaps

**Status 2026-11-13:** T-1, T-2, T-3, T-4, T-8 and T-9 are fixed in the working tree (uncommitted) under the strict visibility rule; `TaskControllerTest` now uses the real `RoleGuard` and has 14 passing tests. T-5, T-6, T-7 remain open.

| ID | Gap (as found by the audit) | Evidence |
|---|---|---|
| T-1 | Any authenticated `MEMBER` can list **all** tasks of every department (`GET /tasks`) and read any task by id (`GET /tasks/{id}`). DepartmentOperationsPage fetches all tasks and filters client-side. | `list`/`getById` only call `requireMemberOrAbove`. |
| T-2 | Any `TRUONG_BAN` can `PUT` or `DELETE` tasks of **other** departments. | `update`/`delete` only call `requireTruongBanOrAbove`. |
| T-3 | A `TRUONG_BAN` sending `assignToAllDepartments=true` bypasses the own-department check and broadcasts to all six departments. | `resolveAssignee` is skipped on that branch. |
| T-4 | Backend never checks the `TASK_ASSIGNMENT` or `CROSS_DEPARTMENT_TASKS` modules; only the frontend uses them for navigation. | No `requireModuleManager` call in `TaskController`. |
| T-5 | Java `TaskStatus.BLOCKED/CANCELLED` and `TaskPriority.URGENT` are accepted by the API but persisted as `todo`/`high`. | Converters vs V1 enums. |
| T-6 | Unknown `eventId` is silently stored as `null`. | `findById(...).orElse(null)`. |
| T-7 | `updateTask` client helper and `GET /tasks/{id}` have no frontend caller. | grep of `frontend/src`. |
| T-8 | Many `if (currentUser != null)` branches and the "no current user" assigner fallback are dead code because the security filter requires authentication. | `SecurityConfig` + controller. |
| T-9 | No test covers T-1…T-3 authorization boundaries, filter query, or delete. | Test list above. |

## Unknowns

- ~~Intended visibility rule~~ — **decided 2026-11-13 (option A, strict):** member reads only tasks assigned to them; department lead reads/edits/deletes only their department's tasks; BCN reads and writes all; only BCN may use `assignToAllDepartments`. This is the target fix for T-1…T-3.
- ~~Whether `BLOCKED`/`CANCELLED`/`URGENT` are wanted~~ — **confirmed wanted (2026-11-13)**; requires a forward migration extending both PostgreSQL enums.
