# Schema-backed modules without application layers

The following domain tables are present in Flyway migrations but have no matching Java entity/repository/service/controller/DTO and no frontend API client in this checkout. Dashboard pages for several of these domains render static/mock UI from [MockPages.tsx](../../frontend/src/components/dashboard/MockPages.tsx).

| Domain | Migration source | Tables | UI evidence | Implementation status |
|---|---|---|---|---|
| Membership and tenure | V2 | `seasons`, `season_members` | Tenure route imports mock page | Schema only. |
| Tasks | V3, V9 | `tasks`, `task_comments` | Task routes import mock pages | Schema only. |
| Announcements and notifications | V4 | `announcements`, `notifications` | Notification routes import mock pages | Schema only. |
| Events and checklists | V5 | `events`, `checklist_templates`, `checklist_template_items`, `event_checklist_items` | No API caller found | Schema only. |
| Finance and partner CRM | V6, V9 | `transactions`, `partners`, `partner_contacts`, `outreach_logs`, `collaborations` | Finance route imports mock page | Schema only. |
| Media and activity log | V7 | `media_links`, `activity_logs` | Publication and activity routes import mock pages | Schema only. |
| Event content and proposals | V9 | `event_contents`, `proposals` | Department operations is mock UI | Schema only. |
| Attendee check-in | V9 | `event_attendees` | No API caller found | Schema only. |
| Equipment borrowing | V9 | `equipment`, `equipment_borrows` | No API caller found | Schema only. |
| Design asset library | V9 | `design_assets` | Library route imports mock page | Schema only. |

## Database consistency observations

- V1 creates the initial `department_enum` values.
- V9 adds `ky_thuat` and `nhan_su` with `ALTER TYPE ... ADD VALUE IF NOT EXISTS`.
- The Java [Department.java](../../backend/src/main/java/com/neudebateclub/backend/common/enums/Department.java) enum matches the resulting migration-defined enum values.

## Planning constraint

These tables are not evidence that their UI, API, approval rules, or data lifecycle are finalized. Existing Vietnamese needs/use-case documents describe intended behavior, but they are not executable contracts. Choose one vertical slice at a time, define its API contract, then add entity/repository/service/controller/client/tests together.
