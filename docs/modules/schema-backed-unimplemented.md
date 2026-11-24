# Schema-backed modules without application layers

**Audit date:** 2026-11-13. These tables exist in Flyway migrations but have no Java entity, repository, controller, DTO, or frontend API client. Several dashboard routes render static content for them from [MockPages.tsx](../../frontend/src/components/dashboard/MockPages.tsx).

**Change since the previous audit:** `events` now has a full vertical slice ([events.md](events.md)); only event *sub-domains* remain here.

| Domain | Migration | Tables | UI evidence | Status |
|---|---|---|---|---|
| Tenure | V2 (+V8 one-active-season trigger) | `seasons`, `season_members` | `/dashboard/tenure` → `TenurePage` mock | Schema only |
| Announcements | V4 | `announcements` | none (notifications use the `notifications` table instead); public `NotificationWidget` is static | Schema only |
| Event checklists | V5 | `checklist_templates`, `checklist_template_items`, `event_checklist_items` | none | Schema only |
| Finance & partner CRM | V6, V9 columns (V31 dropped the V8 partner-stats trigger) | `transactions`, `partners`, `partner_contacts`, `outreach_logs`, `collaborations` | `/dashboard/finance`, `/dashboard/sponsors` | **Implemented** — finance 2026-11-13, sponsors 2026-11-25 (`partner/PartnerController`, module `SPONSORS`, contracts = Google Drive links, ranking in `PartnerScore`) |
| Media & activity log | V7 | `media_links`, `activity_logs` | `/dashboard/publications`, `/dashboard/activity-log` mocks | Schema only; no code writes `activity_logs` |
| Event content & proposals | V9 | `event_contents`, `proposals` | none | Schema only |
| Attendee check-in | V9, V26 | `event_attendees` | landing bell popup (sign-up), `/dashboard/tools/checkin` | **Implemented 2026-11-14** — see [events.md](events.md) |
| Equipment borrowing | V9 | `equipment`, `equipment_borrows` | none | Schema only |
| Design asset library | V9 | `design_assets` | `/dashboard/library` mock | Schema only |

Also mock-only, not tied to a specific table: dashboard home, tasks hub, charts, health dashboard, roles (permission editing — there is no API to change permissions other than `PUT /members`).

## Related unused Java code

Enums `ChecklistStatus`, `ContentStatus`; empty `CacheConfig`, `SwaggerConfig`; unused `PageResponse`.

## Planning constraint

Tables are not evidence that UI, API, approval rules, or data lifecycle are settled. The Vietnamese needs/use-case documents describe intent but are not contracts. Build one vertical slice at a time: API contract → entity/repository → service/controller with module guard → client types → UI → tests.
