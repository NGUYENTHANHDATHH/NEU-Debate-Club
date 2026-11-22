# Finance: ledger, per-member dues, PayOS QR payments

**Written:** 2026-11-20. **State:** all of this is **uncommitted** on `main` (see `git status`). Base list/add/delete ledger dates from 2026-11-13; everything below was added 2026-11-19 → 2026-11-20.

## Owner decisions (do not re-litigate)

Confirmed by the owner in chat; also in Claude memory `owner-decisions-2026-11.md`.

- Member income/expense is an ordinary `transactions` row with optional `member_id`. **No separate dues table, no fixed dues amount, not tied to seasons.**
- Both income and expense may link a member (dues, reimbursements, rewards).
- An ordinary member sees **only their own** rows (`/dashboard/tools/finance`, "Thu chi của tôi", in the "Công cụ" sidebar group, no module needed).
- "Còn thiếu" = an INCOME row with `paid = false` ("Chưa thu"). Only FINANCE managers mark it paid manually.
- Every member-linked transaction notifies that member (in-app + Web Push). A CSV import sends **one grouped notification per member**.
- PayOS VietQR payment for "Chưa thu" rows, confirmed automatically.

Claude's choices, **not** owner-confirmed: CSV member column matched by **email**; the person who records a transaction never notifies themselves (mirrors task assignment); only the charged member can open the QR (finance managers cannot); hand-written PayOS client instead of the SDK.

## Data model

| Migration | Change |
|---|---|
| V27 | `transactions.member_id UUID REFERENCES users ON DELETE SET NULL` + index |
| V28 | `transactions.paid BOOLEAN NOT NULL DEFAULT true`; `CHECK (paid OR (type='income' AND event_id IS NULL))` |
| V29 | sequence `payos_order_code_seq` (starts 100001); `payos_order_code BIGINT UNIQUE`, `payos_checkout_url TEXT`, `payos_qr_code TEXT` |

**Next free migration number: V30.** The pending task-enum migration (BLOCKED/CANCELLED/URGENT) must use V30 or later.

Rules enforced in [FinanceController.save](../../backend/src/main/java/com/neudebateclub/backend/finance/FinanceController.java): `paid=false` requires INCOME + `memberId` + no `eventId` (400 otherwise). "Member required" lives in code only, because `ON DELETE SET NULL` would break a DB check.

**Money rule:** unpaid rows are **not** in the fund. Frontend `summarizeTransactions` skips `paid === false`; `summarizeByMember` puts them in `owed`. Settling sets `paid=true` **and `transaction_date` = today (Asia/Ho_Chi_Minh)**, so monthly totals reflect when money arrived.

## Backend API (`/api` prefix)

| Route | Who | Notes |
|---|---|---|
| `GET /finance/transactions` | FINANCE (all) / EVENT_MANAGEMENT (event-linked only) | unchanged rule |
| `POST /finance/transactions` | FINANCE; EVENT_MANAGEMENT only with `eventId` | body has `memberId`, `paid` (null = paid) |
| `POST /finance/transactions/import` | same | all-or-nothing, ≤1000 rows, one grouped notification per member |
| `POST /finance/transactions/{id}/paid` | FINANCE | manual settle; cancels an open PayOS link |
| `DELETE /finance/transactions/{id}` | same as before | cancels an open PayOS link first (best effort) |
| `GET /finance/transactions/mine` | any logged-in user | own rows incl. unpaid |
| `GET /finance/transactions/members` | FINANCE | `{id, fullName, email}` of all active non-guest users (`/members` is department-scoped for leads) |
| `POST /finance/transactions/{id}/payos` | the charged member only | create or reuse link → `{transactionId, amount, qrCode, checkoutUrl, paid}` |
| `POST /finance/transactions/{id}/payos/refresh` | the charged member only | asks PayOS; settles if PAID → `boolean` |
| `POST /public/payos/webhook` | no auth (permitAll in SecurityConfig) | HMAC-verified; bad signature → 400, otherwise always 200 |

Settle logic lives in one place: `MemberPaymentService.settle` (manual, refresh, webhook). Activity log actions: `CREATE`, `DELETE`, `MARK_PAID`, `PAYOS_PAID` (actor = member when PayOS confirms).

## Notifications

- New `NotificationType.FINANCE` (auto, excluded from manual types: `isManual()` and frontend `ManualNotificationType`). Stored as VARCHAR, so no DB enum change.
- `NotificationService.notifyMemberTransactions(list, senderId)` groups by member and skips `senderId`. Titles: "Bạn có khoản cần đóng" / "CLB đã nhận tiền của bạn" / "CLB đã chi cho bạn" / "Bạn có N khoản thu chi mới" (+ "Tổng cần đóng").
- Click target `/dashboard/tools/finance` is defined **twice**: frontend `notificationHref` ([notifications.ts](../../frontend/src/lib/notifications.ts)) and backend `PushService.url`. Keep them in sync (they had drifted once and were fixed 2026-11-20).

## PayOS integration

Files: [PayosClient.java](../../backend/src/main/java/com/neudebateclub/backend/finance/PayosClient.java), [MemberPaymentService.java](../../backend/src/main/java/com/neudebateclub/backend/finance/MemberPaymentService.java), [PayosWebhookController.java](../../backend/src/main/java/com/neudebateclub/backend/finance/PayosWebhookController.java), [PayosDialog.tsx](../../frontend/src/components/dashboard/PayosDialog.tsx).

- **Why not the SDK:** `vn.payos:payos-java` depends on `jackson-databind 2.20.0` + OkHttp 4.12.0 (verified in its pom.xml). The backend uses Jackson 3 (`tools.jackson`). The client uses JDK `HttpClient` + `javax.crypto` HmacSHA256 and calls three endpoints: create, get, cancel `/v2/payment-requests`.
- **Signatures:** create = HMAC over `amount=…&cancelUrl=…&description=…&orderCode=…&returnUrl=…`. Webhook = `data` keys sorted, `key=value&…`, null → "". Verified against the **official docs sample** (key `1a5471…7675`, signature `412e91…aa03`) in `PayosClientTest`. Compare with `MessageDigest.isEqual`.
- **Link reuse:** a stored `payos_order_code` whose status is PENDING is reused; PAID → settle; any other status → new order code from the sequence. Only PENDING/PAID are relied on: the docs list statuses `PAID, PENDING, PROCESSING, CANCELLED` (Return URL page) and no enum in the API reference.
- **Confirmation has two paths:** the open dialog polls `/refresh` every 3 s (works locally, no webhook needed); the webhook covers payments made after the dialog closed. `returnUrl` = `FRONTEND_URL/dashboard/tools/finance?pay=<txId>`, and the page calls refresh on load.
- `description` is fixed to `NDCQUY`: PayOS limits it to 9 chars for non-linked accounts. Matching uses `orderCode`, never the description.
- **Config:** `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` (empty = feature off, logged at startup), `FRONTEND_URL`. Wired through `application.yml` (`app.payos.*`, `app.frontend-url`), `docker-compose.yml`, `.env.docker.example`. Values are `trim()`med (the owner's `.env` had leading spaces).
- **No sandbox:** PayOS has no test environment; tests are real transfers. Use small amounts.

## Frontend

- [FinancePage.tsx](../../frontend/src/components/dashboard/FinancePage.tsx): CSV import + template download, "Theo thành viên" table (Đã đóng / Đã nhận / Đóng − nhận / Còn thiếu), member column + filter, "Chưa thu" badge, "Đã thu" button.
- [TransactionForm.tsx](../../frontend/src/components/dashboard/TransactionForm.tsx): "Thành viên liên quan" select (hidden when `members` is empty, e.g. event leads or EventFinanceDialog) and a "Chưa thu" checkbox (INCOME + member only; disables the event select).
- [MyFinancePage.tsx](../../frontend/src/components/dashboard/MyFinancePage.tsx) at `/dashboard/tools/finance` (page wraps it in `<Suspense>` because of `useSearchParams`). DashboardHomePage shows a 3-number card linking there.
- CSV ([financeImport.ts](../../frontend/src/components/dashboard/financeImport.ts), template [public/mau-thu-chi.csv](../../frontend/public/mau-thu-chi.csv), UTF-8 BOM, CRLF). Columns are matched by header name, so order is free:
  - Required: `Ngày` (dd/mm/yyyy or ISO), `Loại` (Thu/Chi), `Số tiền` (dots, commas, "đ" stripped; integer VND only), `Mô tả`.
  - Optional: `Danh mục`, `Sự kiện` (exact title), `Thành viên` (email), `Trạng thái` (empty/Đã thu/Đã chi/Chưa thu).
  - Delimiter `,` or `;`; quoted cells supported. Errors are reported per Excel line number and nothing is saved.

## Tests

- Backend: `FinanceControllerTest` 16, `MemberPaymentServiceTest` 5, `PayosClientTest` 2, `NotificationServiceTest` 10, all green. Full suite: 107 run, 1 error = `BackendApplicationTests.contextLoads`, which needs a live Postgres and **failed identically before these changes**.
- Frontend: `node --test src/components/dashboard/financeMetrics.test.mjs src/components/dashboard/financeImport.test.mjs` (10 green); `npx tsc --noEmit`, eslint clean.

## Verified vs not verified

- **Verified:** Docker rebuild applied V27–V29 (DB at v29); backend starts with PayOS enabled; the owner's PayOS keys authenticate (`GET /v2/payment-requests/1` → `{"code":"101","desc":"Mã thanh toán không tồn tại"}`, not an auth error).
- **Not verified:**
  - No real QR payment end-to-end yet; the owner was told to test with a small amount.
  - The webhook has not been registered (needs a public domain; deploy is deferred to DigitalOcean, see [deploy-plan.md](../deploy-plan.md)).
  - The UI has not been clicked through in a browser.
  - The menu path "my.payos.vn → Kênh thanh toán → Webhook" written in DOCKER.md is **not confirmed by PayOS docs**; the documented alternative is `POST /confirm-webhook`.

## Known gaps / risks

- A webhook and a refresh arriving at the same moment can both settle and send **two receipts** (no `@Version` on `Transaction`). The paid state stays correct.
- If a member pays a link whose charge was deleted, or pays a different amount, the backend only logs a warning; a human must reconcile.
- No partial payments (split into several charges instead), no reminders for unpaid charges, no editing of transactions (owner rule: add + delete only).
- PayOS payouts (paying members) are not integrated; their signature scheme differs from payment-requests.

## Gotchas for the next agent

- **Shell on this Windows machine mangles backslash escapes in Bash heredocs** (`\n`, `﻿` became real characters and broke TS files). For code edits use the Edit/Write tools, or put Python scripts in the scratchpad and run them.
- `npx tsc --noEmit` rewrites `frontend/tsconfig.tsbuildinfo`; revert it with `git checkout -- frontend/tsconfig.tsbuildinfo`.
- Jackson 3: use `asString()`; `asText()` is deprecated.
- `TransactionRequest` is a positional record. Adding a field breaks every `new TransactionRequest(...)` in `FinanceControllerTest`.
- `FinanceController` now takes `NotificationService` + `MemberPaymentService`; tests build a real `MemberPaymentService` around a mocked `PayosClient`.
- Report for the thesis: [docs/bao-cao-cong-nghe-payos.docx](../bao-cao-cong-nghe-payos.docx) ("Công nghệ sử dụng", every fact cited to payos.vn/docs or the SDK pom). Regenerating it needs the `docx` npm package. LibreOffice is not installed here; Word COM (PowerShell) + PyMuPDF were used to render the check images.
