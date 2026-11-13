# Events module

**Audit date:** 2026-11-13. Evidence level is **verified** unless marked.

## Layer trace

| Layer | Source |
|---|---|
| Schema | V5 `events` (incl. `thumbnail_url`, `is_public`, attendee counts, post-event notes/rating — **not mapped**); V19 `resource_urls JSONB NOT NULL DEFAULT '[]'` with array check; V20 seeds 10 sample events |
| Entity / repo | [Event.java](../../backend/src/main/java/com/neudebateclub/backend/event/Event.java) (maps id, title, description, location, event_date, budget, status, resource_urls, created_by, timestamps), `EventRepository.findAllByOrderByEventDateDesc` |
| Controller + DTOs | [EventController.java](../../backend/src/main/java/com/neudebateclub/backend/event/EventController.java) — nested `EventRequest`, `EventResponse` |
| Frontend | `ClubEvent`, `SaveEventInput`, `fetchEvents`/`createEvent`/`updateEvent`/`deleteEvent` in [api.ts](../../frontend/src/lib/api.ts); [EventsPage](../../frontend/src/components/dashboard/EventsPage.tsx); event pickers in task-assignment pages |
| Tests | [EventControllerTest](../../backend/src/test/java/com/neudebateclub/backend/event/EventControllerTest.java) — 4 Mockito tests, passed on 2026-11-13 |

## Rules implemented

- List: any `MEMBER`+. Create/update/delete: module `EVENT_MANAGEMENT` (BCN or `SU_KIEN` lead).
- Validation: title ≤ 255, description ≤ 5000, `eventDate` and `budget ≥ 0` required, status defaults to `UPCOMING`; up to 10 distinct `http(s)` resource URLs.
- Delete is a hard delete. `tasks.event_id` and `proposals.event_id` become `NULL` (V9 `ON DELETE SET NULL`); `event_checklist_items` (V5), `event_contents` and `event_attendees` (V9) rows are deleted by `ON DELETE CASCADE`.

## Verified gaps

| ID | Gap |
|---|---|
| E-1 | Previous docs listed events as schema-only; that is no longer true. Checklists, attendees/check-in, event content and finance links remain schema-only. |
| E-2 | Mapped subset only: `is_public`, `thumbnail_url`, attendee counts and post-event fields cannot be read or written through the API. No public events endpoint exists. |
| E-3 | Status is set manually; there is no rule moving events to `ONGOING`/`FINISHED` by date. |
| E-4 | Delete is unconditional; no confirmation of linked tasks beyond `SET NULL`. Not covered by an integration test. |
| E-5 | Event list is not paginated (`PageResponse` exists in `common` but is unused). |
