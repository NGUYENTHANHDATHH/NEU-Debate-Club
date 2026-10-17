# Authentication module

## Verified flow

1. [GoogleLoginButton.tsx](../../frontend/src/features/auth/GoogleLoginButton.tsx) navigates the browser to `GET /api/auth/google/authorize`.
2. [AuthController.java](../../backend/src/main/java/com/neudebateclub/backend/auth/AuthController.java) creates a Google authorization URL and accepts its callback.
3. [AuthService.java](../../backend/src/main/java/com/neudebateclub/backend/auth/AuthService.java) exchanges the authorization code, verifies the Google ID token, upserts [User.java](../../backend/src/main/java/com/neudebateclub/backend/user/User.java), and creates a JWT.
4. The callback redirects to the supplied frontend path with `token` and `loginSuccess` query parameters.
5. [userContext.tsx](../../frontend/src/context/userContext.tsx) stores the token in `localStorage`, calls `GET /api/auth/me`, then stores a reduced user profile in `localStorage`.
6. The same provider calls `GET /api/auth/modules` to obtain module permissions for the stored role and department.
7. [JwtAuthenticationFilter.java](../../backend/src/main/java/com/neudebateclub/backend/auth/jwt/JwtAuthenticationFilter.java) verifies later bearer tokens and reloads the user from `users`.

## Cross-layer map

| Layer | Source | Verified responsibility |
|---|---|---|
| Database | V2 `users`; V9 `google_id` | Stores account, role, department, active state, and last login. |
| Entity/repository | `User`, `UserRepository` | Maps the account used for authentication. |
| Service/security | `AuthService`, `JwtService`, JWT filter, `SecurityConfig` | Google identity verification, role assignment, token issue/validation, bearer authentication. |
| API DTO | `GoogleLoginRequest`, `AuthResponse` | Direct ID-token exchange input and login/current-user output. |
| Frontend | `api.ts`, `GoogleLoginButton`, `UserProvider` | Starts redirect authentication and holds browser session state. |
| Dashboard access | `AdminModule`, `RoleGuard`, `/auth/modules`, dashboard module registry | Resolves BCN and department-leader module access. |
| Tests | `BackendApplicationTests` | Only Spring context startup coverage; no auth flow coverage. |

## Verified authorization rules

- A verified Google email whose suffix matches `app.allowed-domain` receives `MEMBER`; all others receive `GUEST` unless an existing higher role is retained.
- Landing CMS requires `TRUONG_BAN` or higher through `RoleGuard`.
- The frontend dashboard guard separately checks that the stored email ends in `.ndc.neu@gmail.com`; it does not call the backend on every route transition.
- Logout is stateless: the backend responds successfully and the frontend implementation removes local storage values.

## Risks and unknowns

- **Verified:** the membership suffix is duplicated in backend configuration and frontend code. Its correctness is unknown without owner confirmation.
- **Verified:** frontend and backend `AuthResponse`/user types are separate declarations with no generated contract.
- **Verified:** the redirect flow places a bearer token in the frontend URL before `UserProvider` removes it. This is a security-sensitive integration choice that should be reviewed before production rollout.
- **Unknown:** Google OAuth console redirect URI/origin configuration and deployed secrets were not inspected.

## Required future test coverage

Add behavior tests before changing this module: valid/invalid ID token, allowed and guest domain roles, inactive account rejection, protected endpoint bearer handling, and callback success/error redirects. No test files were created by this audit.
