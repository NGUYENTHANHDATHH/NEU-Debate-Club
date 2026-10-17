# Dashboard module access control

## Rules

- `BCN` can manage every registered administrative module.
- A `TRUONG_BAN` can manage a module only when their `department` is assigned to that module.
- `MEMBER` users receive only personal dashboard routes; they cannot manage department modules.
- The backend remains the authority for API authorization. The frontend uses the same module keys to filter navigation and redirect unauthorized direct route visits.

## Module registry

[AdminModule.java](../../backend/src/main/java/com/neudebateclub/backend/common/enums/AdminModule.java) is the backend registry. It assigns module keys to the departments that manage them, while leaving cross-club modules such as cross-department task assignment, activity log, and health dashboard available to BCN only.

The dashboard presents these keys through [dashboard-modules.ts](../../frontend/src/constants/dashboard-modules.ts). To adapt the application for another club, assign that club's departments to the required backend module keys and map its dashboard routes to those keys; no role or department checks need to be scattered through pages.

## Current enforcement

| Concern | Implementation |
|---|---|
| CMS API | `LANDING_CMS`, assigned to `TRUYEN_THONG`; BCN bypasses department checks. |
| Dashboard navigation | Sidebar requests `/api/auth/modules` after login and shows only granted module routes. |
| Direct dashboard routes | Client route guard redirects a signed-in user without the required module to `/dashboard`. |
| Existing mock modules | Their routes are filtered in the UI. They have no backend APIs yet, so server-side endpoint enforcement will be added with each real module. |

## Database note

No migration is required: V1 already defines `bcn` and `truong_ban`; V9 extends department values with `ky_thuat` and `nhan_su`.
