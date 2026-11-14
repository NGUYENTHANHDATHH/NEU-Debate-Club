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

## Sign-up and QR check-in (added 2026-11-14)

Unit-tested only; V26 and the JPA mapping have **not** been run against a real PostgreSQL yet.

| Layer | Source |
|---|---|
| Schema | V9 `event_attendees`; V26 drops the never-used `ticket_code`, `qr_code_hash`, `is_checked_in` and adds `checked_out_at`. `phone`, `student_id`, `organization`, `checked_in_by` stay unmapped |
| Backend | [EventAttendeeController.java](../../backend/src/main/java/com/neudebateclub/backend/event/EventAttendeeController.java), `EventAttendee`, `EventAttendeeRepository`; guest sessions in `AuthService` / `JwtService` (see [auth.md](auth.md)) |
| Frontend | "Đăng ký tham gia" button in the landing bell popup ([NotificationWidget](../../frontend/src/components/ui/HomeLayout/NotificationWidget.tsx)), shown when the CMS `announcement` section has an `eventId` (picker in [CmsPage](../../frontend/src/components/dashboard/CmsPage.tsx)); [CheckinToolPage](../../frontend/src/components/dashboard/CheckinToolPage.tsx) (`/dashboard/tools/checkin`); event picker + QR attachment in [MailToolPage](../../frontend/src/components/dashboard/MailToolPage.tsx). There is no public sign-up page. |
| Tests | [EventAttendeeControllerTest](../../backend/src/test/java/com/neudebateclub/backend/event/EventAttendeeControllerTest.java) (8 tests), `frontend/src/lib/gmail.test.mjs` |

- `POST /public/events/{id}/registrations` (no body; identity = the header sign-in, either a member JWT or a guest token, otherwise 401): anyone with a verified Google account; stores lower-cased email + name; one row per (event, email); repeating the call creates nothing. The response carries **no ticket**: the QR (= row `id`) reaches the registrant only by email (owner decision 2026-11-14).
- `GET /events/{id}/attendees` and `POST /events/{id}/attendees/{ticketId}/check-in|check-out`: any `MEMBER`+. One check-in and one check-out per ticket; check-out requires check-in; a ticket of another event is rejected.
- The bulk-mail tool can load an event's attendees as recipients; rows with a `qr` column get that ticket's QR PNG attached.

## Verified gaps

| ID | Gap |
|---|---|
| E-1 | Previous docs listed events as schema-only; that is no longer true. Checklists and event content remain schema-only. |
| E-2 | Mapped subset only: `is_public`, `thumbnail_url`, attendee counts and post-event fields cannot be read or written through the API. No public events endpoint exists; the sign-up button targets the single event chosen in the CMS announcement. |
| E-6 | Sign-up: attendee list (with check-in/out times and status filters) lives on `/dashboard/tools/checkin` but does not auto-refresh scans made on other devices; no capacity limit or closing time, no record of which tickets were already mailed, scans are not written to the activity log. |
| E-3 | Status is set manually; there is no rule moving events to `ONGOING`/`FINISHED` by date. |
| E-4 | Delete is unconditional; no confirmation of linked tasks beyond `SET NULL`. Not covered by an integration test. |
| E-5 | Event list is not paginated (`PageResponse` exists in `common` but is unused). |
