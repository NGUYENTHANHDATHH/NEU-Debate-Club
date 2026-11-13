# Database migrations

**Audit date:** 2026-11-13. No live database was inspected. Everything below comes from migration files, `application.yml`, and git history.

## Inventory

| Version | Kind | Content |
|---|---|---|
| V1 | DDL | 14 enum types |
| V2 | DDL | `users`, `seasons`, `season_members` |
| V3 | DDL | `tasks`, `task_comments` |
| V4 | DDL | `announcements`, `notifications` |
| V5 | DDL | `events`, checklist templates/items, `event_checklist_items` |
| V6 | DDL | `transactions`, `partners`, `partner_contacts`, `outreach_logs`, `collaborations` |
| V7 | DDL | `media_links`, `landing_content`, `activity_logs` |
| V8 | DDL | triggers: `updated_at`, task `completed_at`, partner stats, single active season |
| V9 | DDL | `users.google_id`, department enum +2, `tasks.event_id`, collaboration columns, JSONB `content_json`, `event_contents`, `proposals`, `event_attendees`, `equipment`, `equipment_borrows`, `design_assets` and their enums |
| V10–V12 | Seed | landing content and a fixed BCN account (`id …0001`) |
| V13–V15 | DDL | `landing_content_versions`, `projects`, `achievements` |
| V16–V17 | Seed | catalog rows |
| V18 | Seed | 50 sample members |
| V19 | DDL | `events.resource_urls` |
| V20 | Seed | 10 sample events (creates a system BCN user if none exists) |
| V21 | DDL + data | task progress columns and backfill |
| V22 | DDL | `notifications.created_by` (FK `users`, `ON DELETE SET NULL`) + index `(user_id, created_at DESC)` — added 2026-11-13; applied to the local Docker DB (`ndc_db`) on 2026-11-13 |

## Integrity findings (verified from git)

| File | Change after first commit | Consequence for a database migrated earlier |
|---|---|---|
| V1 | `4aeb762` added `landing_project_enum`, `landing_achievement_enum` | Flyway checksum mismatch; V14/V15 fail because the types are missing. |
| V2 | `c2d8c34` removed `google_id VARCHAR(255) NOT NULL UNIQUE` | Checksum mismatch; `google_id NOT NULL` stays, breaking `POST /members` and V18 inserts. |
| V12 | `e0d851c` changed the seeded account e-mail and `ON CONFLICT (email)` → `(id)` | Checksum mismatch. |

`baseline-on-migrate: true` + `baseline-version: 12` means a non-empty schema **without** `flyway_schema_history` is stamped V12 and only V13+ run, regardless of whether it actually matches V1–V12.

Fresh databases created from the current files are not affected (inferred).

## Other observations

- Seed/sample data lives in versioned migrations, so it will be applied to any production database.
- `CREATE_NEU_DEBATE_CLUB.sql` runs the same files via `psql` without recording Flyway history; a database bootstrapped that way would then be baselined at V12 on first app start and re-run V13–V21 — V13 `CREATE TABLE landing_content_versions` (no `IF NOT EXISTS`) would fail (inferred).
- Timestamp types are inconsistent: most tables use `TIMESTAMPTZ`; `projects`/`achievements` (V14/V15) use `TIMESTAMP`.
- `task_status_enum`/`task_priority_enum` are narrower than the Java enums (see [tasks.md](tasks.md) T-5).

## Safe verification procedure (proposed, not executed)

On each real database, read-only:

```sql
SELECT installed_rank, version, description, checksum, success FROM flyway_schema_history ORDER BY installed_rank;
SELECT is_nullable FROM information_schema.columns WHERE table_name='users' AND column_name='google_id';
SELECT typname FROM pg_type WHERE typname IN ('landing_project_enum','landing_achievement_enum');
```

Compare checksums with the current files (`.\mvnw.cmd flyway:info` is **not** configured in `pom.xml`; the Flyway Maven plugin would need adding). Fix forward with new migrations or a documented `flyway repair` decision — never by editing V1–V21 again.
