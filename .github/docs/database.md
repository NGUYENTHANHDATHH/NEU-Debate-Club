## Table `users`

Tất cả người dùng hệ thống

### Columns

| Name            | Type              | Constraints |
| --------------- | ----------------- | ----------- |
| `id`            | `uuid`            | Primary     |
| `google_id`     | `varchar`         | Unique      |
| `email`         | `varchar`         | Unique      |
| `full_name`     | `varchar`         |             |
| `avatar_url`    | `text`            | Nullable    |
| `role`          | `role_enum`       |             |
| `department`    | `department_enum` | Nullable    |
| `phone`         | `varchar`         | Nullable    |
| `student_id`    | `varchar`         | Nullable    |
| `is_active`     | `bool`            |             |
| `last_login_at` | `timestamptz`     | Nullable    |
| `created_at`    | `timestamptz`     |             |
| `updated_at`    | `timestamptz`     |             |

## Table `seasons`

Nhiệm kỳ CLB — mỗi năm học là 1 nhiệm kỳ

### Columns

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `id`         | `uuid`        | Primary     |
| `name`       | `varchar`     |             |
| `start_date` | `date`        |             |
| `end_date`   | `date`        |             |
| `is_active`  | `bool`        |             |
| `created_at` | `timestamptz` |             |

## Table `season_members`

### Columns

| Name         | Type              | Constraints |
| ------------ | ----------------- | ----------- |
| `id`         | `uuid`            | Primary     |
| `season_id`  | `uuid`            |             |
| `user_id`    | `uuid`            |             |
| `role`       | `role_enum`       |             |
| `department` | `department_enum` |             |
| `joined_at`  | `date`            |             |
| `left_at`    | `date`            | Nullable    |

## Table `tasks`

### Columns

| Name                  | Type                 | Constraints |
| --------------------- | -------------------- | ----------- |
| `id`                  | `uuid`               | Primary     |
| `title`               | `varchar`            |             |
| `description`         | `text`               | Nullable    |
| `priority`            | `task_priority_enum` |             |
| `status`              | `task_status_enum`   |             |
| `deadline`            | `timestamptz`        | Nullable    |
| `assigned_to`         | `uuid`               |             |
| `assigned_by`         | `uuid`               |             |
| `department`          | `department_enum`    | Nullable    |
| `is_cross_department` | `bool`               |             |
| `completed_at`        | `timestamptz`        | Nullable    |
| `created_at`          | `timestamptz`        |             |
| `updated_at`          | `timestamptz`        |             |

## Table `task_comments`

### Columns

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `id`         | `uuid`        | Primary     |
| `task_id`    | `uuid`        |             |
| `user_id`    | `uuid`        |             |
| `content`    | `text`        |             |
| `created_at` | `timestamptz` |             |
| `updated_at` | `timestamptz` |             |

## Table `announcements`

### Columns

| Name                | Type                       | Constraints |
| ------------------- | -------------------------- | ----------- |
| `id`                | `uuid`                     | Primary     |
| `title`             | `varchar`                  |             |
| `content`           | `text`                     |             |
| `target_role`       | `announcement_target_enum` |             |
| `target_department` | `department_enum`          | Nullable    |
| `is_pinned`         | `bool`                     |             |
| `created_by`        | `uuid`                     |             |
| `created_at`        | `timestamptz`              |             |
| `updated_at`        | `timestamptz`              |             |

## Table `announcement_reads`

### Columns

| Name              | Type          | Constraints |
| ----------------- | ------------- | ----------- |
| `id`              | `uuid`        | Primary     |
| `announcement_id` | `uuid`        |             |
| `user_id`         | `uuid`        |             |
| `read_at`         | `timestamptz` |             |

## Table `events`

### Columns

| Name                 | Type                | Constraints |
| -------------------- | ------------------- | ----------- |
| `id`                 | `uuid`              | Primary     |
| `title`              | `varchar`           |             |
| `description`        | `text`              | Nullable    |
| `thumbnail_url`      | `text`              | Nullable    |
| `event_date`         | `timestamptz`       |             |
| `location`           | `varchar`           | Nullable    |
| `status`             | `event_status_enum` |             |
| `is_public`          | `bool`              |             |
| `budget`             | `numeric`           |             |
| `actual_attendees`   | `int4`              | Nullable    |
| `expected_attendees` | `int4`              | Nullable    |
| `post_event_notes`   | `text`              | Nullable    |
| `post_event_rating`  | `int2`              | Nullable    |
| `created_by`         | `uuid`              |             |
| `created_at`         | `timestamptz`       |             |
| `updated_at`         | `timestamptz`       |             |

## Table `checklist_templates`

### Columns

| Name          | Type          | Constraints |
| ------------- | ------------- | ----------- |
| `id`          | `uuid`        | Primary     |
| `name`        | `varchar`     |             |
| `description` | `text`        | Nullable    |
| `created_by`  | `uuid`        |             |
| `created_at`  | `timestamptz` |             |

## Table `checklist_template_items`

### Columns

| Name                | Type                 | Constraints |
| ------------------- | -------------------- | ----------- |
| `id`                | `uuid`               | Primary     |
| `template_id`       | `uuid`               |             |
| `title`             | `varchar`            |             |
| `days_before_event` | `int4`               |             |
| `priority`          | `task_priority_enum` |             |
| `order_index`       | `int4`               |             |

## Table `event_checklist_items`

### Columns

| Name                | Type                    | Constraints |
| ------------------- | ----------------------- | ----------- |
| `id`                | `uuid`                  | Primary     |
| `event_id`          | `uuid`                  |             |
| `title`             | `varchar`               |             |
| `status`            | `checklist_status_enum` |             |
| `priority`          | `task_priority_enum`    |             |
| `assigned_to`       | `uuid`                  | Nullable    |
| `deadline`          | `timestamptz`           | Nullable    |
| `days_before_event` | `int4`                  | Nullable    |
| `order_index`       | `int4`                  |             |
| `created_at`        | `timestamptz`           |             |
| `updated_at`        | `timestamptz`           |             |

## Table `transactions`

### Columns

| Name               | Type                    | Constraints |
| ------------------ | ----------------------- | ----------- |
| `id`               | `uuid`                  | Primary     |
| `type`             | `transaction_type_enum` |             |
| `amount`           | `numeric`               |             |
| `description`      | `varchar`               |             |
| `category`         | `varchar`               | Nullable    |
| `event_id`         | `uuid`                  | Nullable    |
| `transaction_date` | `date`                  |             |
| `receipt_url`      | `text`                  | Nullable    |
| `created_by`       | `uuid`                  |             |
| `created_at`       | `timestamptz`           |             |
| `updated_at`       | `timestamptz`           |             |

## Table `media_links`

### Columns

| Name         | Type              | Constraints |
| ------------ | ----------------- | ----------- |
| `id`         | `uuid`            | Primary     |
| `title`      | `varchar`         |             |
| `url`        | `text`            |             |
| `platform`   | `platform_enum`   |             |
| `department` | `department_enum` |             |
| `event_id`   | `uuid`            | Nullable    |
| `reach`      | `int4`            |             |
| `likes`      | `int4`            |             |
| `shares`     | `int4`            |             |
| `comments`   | `int4`            |             |
| `posted_at`  | `date`            |             |
| `created_by` | `uuid`            |             |
| `created_at` | `timestamptz`     |             |
| `updated_at` | `timestamptz`     |             |

## Table `content_posts`

### Columns

| Name             | Type                  | Constraints |
| ---------------- | --------------------- | ----------- |
| `id`             | `uuid`                | Primary     |
| `title`          | `varchar`             |             |
| `content`        | `text`                | Nullable    |
| `platform`       | `platform_enum`       |             |
| `status`         | `content_status_enum` |             |
| `scheduled_date` | `date`                |             |
| `assigned_to`    | `uuid`                | Nullable    |
| `department`     | `department_enum`     |             |
| `media_link_id`  | `uuid`                | Nullable    |
| `created_by`     | `uuid`                |             |
| `created_at`     | `timestamptz`         |             |
| `updated_at`     | `timestamptz`         |             |

## Table `documents`

### Columns

| Name          | Type              | Constraints |
| ------------- | ----------------- | ----------- |
| `id`          | `uuid`            | Primary     |
| `title`       | `varchar`         |             |
| `description` | `text`            | Nullable    |
| `url`         | `text`            |             |
| `tags`        | `_text`           | Nullable    |
| `department`  | `department_enum` | Nullable    |
| `is_public`   | `bool`            |             |
| `created_by`  | `uuid`            |             |
| `created_at`  | `timestamptz`     |             |
| `updated_at`  | `timestamptz`     |             |

## Table `partners`

### Columns

| Name                   | Type                  | Constraints |
| ---------------------- | --------------------- | ----------- |
| `id`                   | `uuid`                | Primary     |
| `company_name`         | `varchar`             |             |
| `field`                | `varchar`             | Nullable    |
| `logo_url`             | `text`                | Nullable    |
| `status`               | `partner_status_enum` |             |
| `total_collaborations` | `int4`                |             |
| `total_sponsored`      | `numeric`             |             |
| `notes`                | `text`                | Nullable    |
| `created_by`           | `uuid`                |             |
| `created_at`           | `timestamptz`         |             |
| `updated_at`           | `timestamptz`         |             |

## Table `partner_contacts`

### Columns

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `id`         | `uuid`        | Primary     |
| `partner_id` | `uuid`        |             |
| `full_name`  | `varchar`     |             |
| `position`   | `varchar`     | Nullable    |
| `phone`      | `varchar`     | Nullable    |
| `email`      | `varchar`     | Nullable    |
| `is_primary` | `bool`        |             |
| `created_at` | `timestamptz` |             |

## Table `outreach_logs`

### Columns

| Name             | Type                   | Constraints |
| ---------------- | ---------------------- | ----------- |
| `id`             | `uuid`                 | Primary     |
| `partner_id`     | `uuid`                 |             |
| `contact_date`   | `date`                 |             |
| `method`         | `varchar`              |             |
| `content`        | `text`                 |             |
| `result`         | `outreach_result_enum` |             |
| `follow_up_date` | `date`                 | Nullable    |
| `created_by`     | `uuid`                 |             |
| `created_at`     | `timestamptz`          |             |

## Table `collaborations`

### Columns

| Name                 | Type          | Constraints |
| -------------------- | ------------- | ----------- |
| `id`                 | `uuid`        | Primary     |
| `partner_id`         | `uuid`        |             |
| `event_id`           | `uuid`        | Nullable    |
| `description`        | `varchar`     |             |
| `sponsored_amount`   | `numeric`     |             |
| `mou_link`           | `text`        | Nullable    |
| `collaboration_date` | `date`        |             |
| `created_by`         | `uuid`        |             |
| `created_at`         | `timestamptz` |             |

## Table `landing_content`

### Columns

| Name           | Type                   | Constraints |
| -------------- | ---------------------- | ----------- |
| `id`           | `uuid`                 | Primary     |
| `section`      | `landing_section_enum` | Unique      |
| `content_json` | `jsonb`                |             |
| `is_published` | `bool`                 |             |
| `updated_by`   | `uuid`                 |             |
| `updated_at`   | `timestamptz`          |             |

## Table `notifications`

### Columns

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `id`         | `uuid`        | Primary     |
| `user_id`    | `uuid`        |             |
| `title`      | `varchar`     |             |
| `body`       | `text`        |             |
| `type`       | `varchar`     |             |
| `entity_id`  | `uuid`        | Nullable    |
| `is_read`    | `bool`        |             |
| `created_at` | `timestamptz` |             |

## Table `activity_logs`

Insert-only — không bao giờ UPDATE hay DELETE

### Columns

| Name          | Type                   | Constraints |
| ------------- | ---------------------- | ----------- |
| `id`          | `uuid`                 | Primary     |
| `user_id`     | `uuid`                 |             |
| `action`      | `activity_action_enum` |             |
| `entity_type` | `varchar`              |             |
| `entity_id`   | `uuid`                 |             |
| `metadata`    | `jsonb`                | Nullable    |
| `created_at`  | `timestamptz`          |             |
