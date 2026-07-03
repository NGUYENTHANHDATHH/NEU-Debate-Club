# ClubHub Database Overview

> Version: 1.0
> Database: PostgreSQL
> Purpose: High-level database documentation for developers and AI coding agents.

---

# 1. Overview

ClubHub is an internal management system for the NEU Debate Club.

The database is designed around business domains rather than technical features. Every module is responsible for managing a specific aspect of the club.

Main domains:

- User & Membership
- Task Management
- Announcement
- Event Management
- Finance
- Media & Content
- Partner CRM
- Landing Page CMS
- Notification
- Activity Logging

The database uses UUID as the primary key for every table.

Authentication is handled entirely through Google OAuth.

---

# 2. Database Architecture

The system follows a relational database architecture.

```
Users
│
├── Seasons
│
├── Tasks
│   └── Task Comments
│
├── Announcements
│   └── Announcement Reads
│
├── Events
│   ├── Event Checklist
│   └── Transactions
│
├── Media
│   └── Content Posts
│
├── Documents
│
├── Partners
│   ├── Contacts
│   ├── Outreach Logs
│   └── Collaborations
│
├── Landing Content
│
├── Notifications
│
└── Activity Logs
```

Users are the central entity of the entire system.

Almost every business object is created by or belongs to a user.

---

# 3. User & Membership

## Purpose

Manage authentication, permissions and member history.

Main tables

- users
- seasons
- season_members

## Business Concept

A person has only one user account.

A user may participate in multiple club seasons.

A user's historical role is stored inside season_members.

The users table stores only the current profile.

## Roles

Guest

- Can only access the public landing page.

Member

- Can access dashboard.
- Complete assigned tasks.
- View announcements.

Department Head

- Manage department members.
- Assign tasks.
- Review progress.

Executive Board (BCN)

- Full system access.
- Cross-department management.
- Finance management.
- Landing page management.

---

# 4. Task Management

## Purpose

Manage all internal work assignments.

Main tables

- tasks
- task_comments

## Workflow

Task Created

↓

Assigned

↓

In Progress

↓

Completed

## Business Rules

Every task has exactly one creator.

Every task has exactly one assignee.

A task may belong to a department.

Cross-department tasks require executive board permission.

When a task becomes completed, the completion timestamp is automatically recorded.

Comments belong to one task.

Comments preserve discussion history.

---

# 5. Announcement Management

## Purpose

Distribute internal announcements.

Main tables

- announcements
- announcement_reads

Announcements may target

- Everyone
- Department Heads
- Members
- Specific departments

Read status is tracked individually for every user.

Pinned announcements always appear first.

---

# 6. Event Management

## Purpose

Manage club events.

Main tables

- events
- checklist_templates
- checklist_template_items
- event_checklist_items

Each event contains

- Basic information
- Budget
- Attendance
- Post-event report

Each event may use a reusable checklist template.

Checklist items can be assigned to members.

---

# 7. Finance

## Purpose

Track all club income and expenses.

Main table

- transactions

Transactions may belong to

- an event
- or general club finance

Transaction types

- Income
- Expense

Amounts are always positive.

Transaction type determines the financial direction.

Financial reports should be generated from database views whenever possible.

---

# 8. Media & Content

## Purpose

Manage communication department assets.

Main tables

- media_links
- content_posts

Media links store published social media posts.

Content posts store the editorial calendar before publication.

Content lifecycle

Idea

↓

Writing

↓

Review

↓

Approved

↓

Published

After publishing, a content post may reference a media link.

---

# 9. Documents

## Purpose

Provide an internal document library.

Main table

- documents

Examples

- Debate scripts
- Training materials
- Motion lists
- Internal guidelines

Documents may belong to a department or be public.

---

# 10. Partner CRM

## Purpose

Manage sponsors and external organizations.

Main tables

- partners
- partner_contacts
- outreach_logs
- collaborations

Workflow

Partner Created

↓

Contact Established

↓

Outreach

↓

Negotiation

↓

Collaboration

↓

Statistics Updated

Partner statistics should never be manually edited.

Database triggers maintain collaboration counts and sponsorship totals.

---

# 11. Landing Page CMS

## Purpose

Allow administrators to manage public website content.

Main table

- landing_content

Each section exists only once.

Examples

- Hero
- About
- Statistics
- Activities
- Team
- Blog

Content is stored using JSON for flexibility.

---

# 12. Notifications

## Purpose

Deliver real-time notifications.

Main table

- notifications

Notification examples

- Task assigned
- Announcement published
- Event updated

Notifications belong to individual users.

Read status is tracked separately.

---

# 13. Activity Logging

## Purpose

Maintain an audit trail of important actions.

Main table

- activity_logs

Typical actions

- Task created
- Task updated
- Member created
- Event updated
- Transaction created

Activity logs should never be modified or deleted.

---

# 14. Relationships

Core relationships

```
User
 ├── Tasks
 ├── Events
 ├── Announcements
 ├── Transactions
 ├── Media
 ├── Documents
 ├── Notifications
 └── Activity Logs
```

```
Season
 └── Season Members
      └── User
```

```
Partner
 ├── Contacts
 ├── Outreach Logs
 └── Collaborations
```

```
Event
 ├── Checklist Items
 ├── Transactions
 └── Media Links
```

---

# 15. Business Rules

General rules

- UUID is used for every primary key.
- Foreign keys must always reference existing records.
- Historical information should be preserved.
- Soft delete is preferred whenever history is important.
- Audit logs should be append-only.

Task rules

- Only the assignee can complete a task.
- Only managers or creators can edit assignments.

Finance rules

- Amounts cannot be negative.
- Financial history should not be rewritten.

Partner rules

- Statistics are maintained automatically.
- Collaboration history cannot be lost.

---

# 16. Database Automation

The database contains triggers that automatically enforce business logic.

Examples

- Update modification timestamps.
- Record task completion time.
- Update partner statistics.
- Ensure only one active season exists.

Backend code should not duplicate these responsibilities.

---

# 17. Reporting

Database views provide optimized reporting.

Examples

- Dashboard overview
- Department workload
- Monthly finance
- Member to-do list

Whenever possible, dashboard APIs should query these views instead of rebuilding statistics.

---

# 18. Development Guidelines

When implementing new features:

- Always validate foreign keys.
- Respect role-based permissions.
- Keep business logic consistent with existing domains.
- Preserve historical data.
- Avoid deleting records unless explicitly required.
- Record important actions in activity logs.
- Use transactions for multi-table operations.
- Prefer database views for reporting.
- Reuse existing enums before creating new status values.

---

# 19. Future Extension

The schema is designed to support future modules such as

- Attendance management
- Recruitment process
- Equipment inventory
- Budget approval workflow
- Email notification service
- Analytics dashboard
- Mobile application support

These features should integrate with the existing user, event and activity log domains whenever possible.
