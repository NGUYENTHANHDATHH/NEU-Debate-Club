# Task progress and comment history

Migration V21 adds `tasks.progress` (required, 0–100) and nullable `task_comments.progress` (a snapshot at comment time). Existing completed tasks become 100%, in-progress tasks become 1%; older comments retain `NULL` because their historical progress is unknown.

`PATCH /api/tasks/{id}/progress` accepts `progress` (0–100) and a nonblank `content` (up to 5000 characters). It atomically updates the task and inserts a comment authored by the authenticated assignee. Progress 0 maps to `TODO`, 100 to `DONE`, and intermediate values to `IN_PROGRESS`. The older status endpoint also records a comment when an assignee, department lead, or BCN changes status.

`GET /api/tasks/{id}/comments` returns comments oldest first. The assignee, BCN, and the task's department lead may read the history. The UI prepends a “task created” milestone using `tasks.created_at`, then renders the stored comments and their progress snapshots. The todo-list modal is the assignee's editor; task previews expose read-only history for managers.
