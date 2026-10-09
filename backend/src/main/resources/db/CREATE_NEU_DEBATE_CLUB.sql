-- NEU Debate Club database bootstrap
-- Run from the backend directory with psql:
-- psql -h localhost -U postgres -d neu_debate_club -f src/main/resources/db/CREATE_NEU_DEBATE_CLUB.sql
-- This runs all migrations in order, including tables, triggers, and mock landing data.

\set ON_ERROR_STOP on

\ir migration/V1__create_enums.sql
\ir migration/V2__create_core_tables.sql
\ir migration/V3__create_task_tables.sql
\ir migration/V4__create_announcement_tables.sql
\ir migration/V5__create_event_tables.sql
\ir migration/V6__create_finance_partner_tables.sql
\ir migration/V7__create_cms_media_activity_tables.sql
\ir migration/V8__create_triggers.sql
\ir migration/V9__supplement_missing_tables_and_fixes.sql
\ir migration/V10__seed_landing_content.sql
\ir migration/V11__complete_landing_content.sql
\ir migration/V12__repair_landing_content.sql
\ir migration/V13__create_landing_content_versions.sql
\ir migration/V14__create_landing_projects.sql
\ir migration/V15__create_landing_achievements.sql
SELECT 'NEU Debate Club schema, triggers, and landing mock data created.' AS result;
