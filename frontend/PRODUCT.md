# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: members of the NEU Debate Club (a student academic club at the National Economics University) using the internal `/dashboard`. Three roles, each seeing only what it is allowed to:

- **BCN (Ban Chủ Nhiệm, the executive board):** needs a quick picture of the whole club (task progress, overdue work, finance, activity log) and can assign work to every department.
- **Trưởng ban (department heads):** run one department; assign and track tasks, send notifications and manage data for their own department only.
- **Members:** see their own assigned tasks, read notifications and use the shared library.

The seven departments are BCN, Truyền thông (communications), Đối ngoại (external relations), Nội dung (content/academic), Sự kiện (events/logistics), Kỹ thuật (design/media) and Nhân sự (HR).

Secondary: visitors to the public site (students, prospective members, partners) looking at the club's departments, projects and achievements.

## Product Purpose

An internal hub that fixes the club's real bottlenecks: information getting lost between departments, resources getting lost from one cohort (Gen) to the next, and work handed out over Zalo that disappears. Success means members check the dashboard instead of chasing chat threads, and BCN can see the state of the club without asking.

The public site presents the club to outsiders. Its content is edited by the club through the CMS.

## Positioning

A hub and helper, not a replacement. Students already use Google Sheets, Docs, Canva and Notion, and departments whose work already runs well there (e.g. Truyền thông planning in Notion or Sheets) are not asked to switch. The website steps in only where those tools fail: task handover between departments, permissions by role and department, and a record that survives each cohort change.

## Operating Context

- Members mostly use it on a laptop. Phones are used for quick checks: tasks, notifications, links opened from Zalo.
- Sign-in is Google only. Anyone listed as active in `users` can sign in; there is no email-domain rule.
- Notifications are in-app (a bell that polls every 60 s and shows the 5 newest). A task creation notifies its assignee; BCN and heads can send notices by hand. Notices have no read/unread state.
- Work is organised by event and by department. Membership changes each academic season (tenure/Gen).

## Capabilities and Constraints

- Live today: Google login; members; tasks (strict visibility by role and department); events; notifications; finance transactions (list/add/delete); publications and library (read-only merged links); tenure/seasons; activity log (BCN only); landing CMS for sections, projects and achievements; charts and overviews built only on real data.
- Planned (database tables exist, no feature yet): partners/outreach, event checklists, proposals and approvals, QR check-in, equipment tracking, design assets.
- Deliberately removed: health score, contribution score, budget, "chờ duyệt" (pending approval) counts and permission toggles. Do not show any number the data cannot back up. The roles matrix is read-only.
- Task statuses and priorities include BLOCKED, CANCELLED and URGENT.
- Terms: BCN, Trưởng ban, Ban (department), Gen (cohort), mùa/nhiệm kỳ (season/tenure). Keep these Vietnamese terms instead of translating them.

## Brand Commitments

- Name: NEU Debate Club. The logo is `public/logo.png`.
- Language: Vietnamese first. English is a translation, offered through the existing VI/EN switch, mainly for visitors and partners. Write Vietnamese copy first and make sure Vietnamese text (diacritics, longer labels) fits.

## Evidence on Hand

- `public/logo.png`, `public/vision-bg.jpg`.
- Public-site sections, projects and achievements come from the CMS database. Use those, and never hard-code claims.
- Product research: `NHU_CAU_VA_GIAI_PHAP_WEBSITE_CLB_NEU.md` (interviews with each department) and `USE_CASES_HE_THONG_CLB_NEU.md`. Where they disagree with `docs/master-plan.md` "Owner decisions", the master plan wins.
- None of these exist: testimonials, sponsor logos, member counts, press coverage. Do not invent them.

## Product Principles

1. **Only where it hurts.** Build for a real bottleneck. If a department's existing tool works, link to it rather than copying it.
2. **Real data or nothing.** No placeholder metrics, scores or counts shown as if real; drop a widget rather than fake it.
3. **Each role sees its own world.** Members see their own work, heads see their own department, BCN sees everything. Visibility rules are product rules, not decoration.
4. **Survive the handover.** Anything worth keeping must outlast a cohort change and be findable by next year's Gen.
5. **Vietnamese first, laptop first, phone-friendly.** Design for a student at a laptop, and still let quick checks work on a phone.
