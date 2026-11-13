# Members module

**Audit date:** 2026-11-13. Evidence level is **verified** unless marked.

## Layer trace

| Layer | Source |
|---|---|
| Schema | V2 `users` (`email` UNIQUE, `full_name` NOT NULL, `role role_enum`, `department department_enum`, `phone`, `student_id`, `is_active`); V9 adds `google_id UNIQUE` (nullable); V18 seeds 50 sample members |
| Entity / repo | [User.java](../../backend/src/main/java/com/neudebateclub/backend/user/User.java), [UserRepository.java](../../backend/src/main/java/com/neudebateclub/backend/user/UserRepository.java) — shared with auth and tasks |
| Controller + DTOs | [MemberController.java](../../backend/src/main/java/com/neudebateclub/backend/user/MemberController.java) — nested `MemberRequest`, `MemberResponse` |
| Frontend | `Member`, `CreateMemberInput`, `fetchMembers`/`createMember`/`updateMember` in [api.ts](../../frontend/src/lib/api.ts); [MembersPage](../../frontend/src/components/dashboard/MembersPage.tsx) (client-side pagination); assignee pickers in task pages |
| Tests | [MemberControllerTest](../../backend/src/test/java/com/neudebateclub/backend/user/MemberControllerTest.java) — 5 Mockito tests, passed on 2026-11-13 |

## Rules implemented

- List: `TRUONG_BAN`+; BCN sees everyone, a lead sees only their department; `GUEST` rows hidden. (The list does **not** require the `MEMBERSHIP` module — any department lead can list their own department, which the task-assignment pages rely on.)
- Create/update: module `MEMBERSHIP` (BCN or the `NHAN_SU` lead). Email normalized to lowercase; email and student id must be unique (case-insensitive); `role=BCN` ⇔ `department=BCN`; only BCN may grant or edit BCN; `GUEST` cannot be created here.

## Verified gaps

| ID | Gap |
|---|---|
| M-1 | No delete/deactivate endpoint other than toggling `active` via `PUT`. Users are referenced by tasks with `ON DELETE RESTRICT`. |
| M-2 | `AuthService` overwrites `full_name` and `avatar_url` from the Google profile on every login, so names entered in the member form are replaced. If Google omits `name`, the NOT NULL column would reject the save (inferred). |
| M-3 | `users.student_id` has no unique constraint in the schema; uniqueness is enforced only in the controller (race-prone). |
| M-4 | `MemberResponse` returns `department`/`role` as uppercase enum names; `/auth/me` returns lowercase. |
| M-5 | Tenure (`seasons`, `season_members`) is not connected; role/department history is not recorded. |
| M-6 | The use-case document describes a separate `members` table with `status = 'ACTIVE'`; the code uses `users.is_active`. |
| M-7 | A database migrated with the original V2 has `users.google_id NOT NULL`; member creation would fail there (see [database-migrations.md](database-migrations.md)). |
