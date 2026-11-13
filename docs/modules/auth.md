# Authentication module

**Audit date:** 2026-11-13. Evidence level is **verified** unless marked.

## Flow

1. [GoogleLoginButton.tsx](../../frontend/src/features/auth/GoogleLoginButton.tsx) navigates to `GET /api/auth/google/authorize?returnUrl=…`.
2. [AuthController.java](../../backend/src/main/java/com/neudebateclub/backend/auth/AuthController.java) sets an HttpOnly `ndc_oauth_nonce` cookie (path `/api/auth/google`, SameSite=Lax, 10 min) and redirects to Google with `redirect_uri` built from the **incoming request's** scheme/host/port and `state` = a signed 10-minute JWT holding the nonce and the sanitized return path ([GoogleLoginFlow.java](../../backend/src/main/java/com/neudebateclub/backend/auth/GoogleLoginFlow.java)). *Since 2026-11-13.*
3. On callback, [AuthService.java](../../backend/src/main/java/com/neudebateclub/backend/auth/AuthService.java) exchanges the code, verifies the ID token (audience = `GOOGLE_CLIENT_ID`), requires `email_verified`, and looks up `users` by email (case-insensitive). Unknown or inactive users are rejected. It then writes `google_id`, `last_login_at`, `avatar_url` **and `full_name`** from Google, and issues a JWT.
4. The callback rejects a missing/expired/tampered `state` or one whose nonce does not match the cookie, clears the cookie, then redirects to `<frontend origin><safe return path>?authCode=…&loginSuccess=true` (or `googleError=…`). `authCode` is a random single-use code valid for 60 s, held in backend memory (single-instance assumption). The frontend origin is the request `Origin`/`Referer` if allow-listed, else the first `CORS_ALLOWED_ORIGINS` entry.
5. [userContext.tsx](../../frontend/src/context/userContext.tsx) strips the query string, redeems the code with `POST /auth/google/exchange`, stores `ndc_token`, calls `GET /auth/modules`, and stores `ndc_user`.
6. [JwtAuthenticationFilter](../../backend/src/main/java/com/neudebateclub/backend/auth/jwt/JwtAuthenticationFilter.java) validates later bearer tokens and reloads the user from `users`; inactive users become anonymous.
7. `POST /auth/google` (ID-token exchange) is an alternative path used by `completeGoogleLogin` in the same context.
8. Logout is client-side only; `POST /auth/logout` exists but is not called and does not revoke tokens.

## Layer map

| Layer | Source |
|---|---|
| Database | V2 `users`; V9 `google_id` (nullable, unique) |
| Entity / repo | `User`, `UserRepository` |
| Service / security | `AuthService`, `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig`, `UserPrincipal` |
| DTOs | `GoogleLoginRequest`, `AuthResponse` (+ nested `UserDTO`) |
| Frontend | `api.ts` (`BackendUserDTO`, `AuthResponse`, `exchangeGoogleIdToken`, `fetchAccessibleModules`), `userContext.tsx`, `GoogleLoginButton`, `DashboardAccessGuard` |
| Tests | [AuthServiceTest](../../backend/src/test/java/com/neudebateclub/backend/auth/AuthServiceTest.java): active DB user logs in without a club e-mail suffix; unknown account rejected. Passed 2026-11-13. |

## Corrections to the previous audit

- The membership suffix (`.ndc.neu@gmail.com`) is **not** enforced anywhere in code. `ALLOWED_DOMAIN` is present only in env templates and unread. The earlier note that the suffix is "duplicated in backend configuration and frontend code" is no longer true.
- `exchangeGoogleIdToken` is now used (by `completeGoogleLogin`).

## Risks

| ID | Risk | Evidence level |
|---|---|---|
| ~~A-1~~ | Unvalidated `state`/`returnUrl` open redirect + no CSRF binding. **Fixed 2026-11-13 (commit 3bcc82c):** return path restricted to `/…` (no `//`, `\`, control chars); state signed and bound to the nonce cookie. `GoogleLoginFlowTest` covers it. | Verified by unit tests. |
| ~~A-2~~ | JWT in the URL query string. **Fixed 2026-11-13 (commit 3bcc82c):** URL carries only a single-use 60 s code. Not yet tested against real Google OAuth in a browser. | Verified by unit tests. |
| ~~A-10~~ | `GoogleLoginFlow` had two constructors without `@Autowired`, so the Spring context failed to start (unit tests did not catch it). **Fixed 2026-11-13**; backend verified healthy in Docker, `/auth/google/authorize` returns 302 with the nonce cookie and signed state. | Verified at runtime. |
| A-8 | Login codes are stored in memory: lost on restart, not shared across multiple backend instances. | Verified (design limitation). |
| ~~A-9~~ | `JWT_SECRET` not valid Base64 (e.g. contains `-`) crashed signing. **Fixed 2026-11-13.** | Verified by unit test. |
| A-3 | `AuthResponse.expiresIn` is hard-coded `604800000` and ignores `JWT_EXPIRATION_MS`. | Verified. |
| A-4 | Google profile overwrites the admin-entered `full_name` on every login. **Intended — owner confirmed 2026-11-13.** | Verified. |
| A-5 | Callback `redirect_uri` is derived from the request host; behind a proxy without forwarded-header handling it may not match the Google console configuration. | Inferred. |
| A-6 | Token in `localStorage`; no refresh/revocation. | Verified. |
| A-7 | Frontend and backend auth types are separate handwritten declarations; `role`/`department` are lowercase here but uppercase in other modules. | Verified. |

## Missing test coverage

Callback success/error redirects, `returnUrl` validation, inactive user rejection at login and in the JWT filter, expired/invalid token handling, `/auth/modules` output per role.
