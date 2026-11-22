# Run locally with Docker

Requires Docker Desktop running Linux containers and Docker Compose v2.
Run these commands from the repository root in PowerShell.

## Environment

Keep your existing `.env`. For a new checkout only:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.docker.example .env }
```

Fill in the database password and JWT secret. Generate a JWT secret with:

```powershell
$secretBytes = New-Object byte[] 32
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
$random.GetBytes($secretBytes)
$random.Dispose()
[Convert]::ToBase64String($secretBytes)
```

Set `GOOGLE_CLIENT_ID` to your Google OAuth web client ID for login, and configure
`http://localhost:3000` as an authorized JavaScript origin in Google Cloud.
The frontend uses this ID unless `NEXT_PUBLIC_GOOGLE_CLIENT_ID` overrides it.
The application can start without Google credentials, but Google login will not work.

Compose supplies the backend database URL using the `db` service name and the
`POSTGRES_*` values. Local `DATABASE_*` variables and package-level `.env` files
are not used inside the containers. Environment files are excluded from images.

## PayOS (optional)

Members can pay their "Chưa thu" charges by VietQR from **Công cụ → Thu chi của tôi**.
Create a payment channel at https://my.payos.vn and put its `PAYOS_CLIENT_ID`,
`PAYOS_API_KEY`, and `PAYOS_CHECKSUM_KEY` in `.env`; leave them empty to disable online
payment. Set `FRONTEND_URL` to the public website address (PayOS returns members there).

Payments are confirmed two ways: the open QR dialog asks PayOS every 3 seconds (works
locally with no extra setup), and the webhook confirms payments made after the dialog
closes. Register the webhook in my.payos.vn as
`https://<public-domain>/api/public/payos/webhook`; locally it needs a public tunnel
(for example `cloudflared tunnel --url http://localhost:8080`). Requests with a wrong
signature get HTTP 400.

## Build and start

```powershell
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 180
docker compose ps
```

- Website: http://localhost:3000
- Backend health: http://localhost:8080/api/actuator/health
- Swagger UI: http://localhost:8080/api/swagger-ui/index.html
- PostgreSQL: localhost:5432

Startup waits for database, backend, and frontend health checks in that order.
Flyway runs the versioned SQL migrations; Hibernate validates the resulting schema.
Backend image builds skip tests. The frontend build includes TypeScript checking.

The frontend uses a frozen pnpm lockfile and Next.js standalone output. Its server
and static files are nested under `app/` because the tracing root is the parent
of the frontend build directory. Rebuild after changing `NEXT_PUBLIC_*` values.

## Logs, rebuild, and stop

```powershell
docker compose logs --tail 100 backend
docker compose logs --tail 100 frontend
docker compose up -d --build --wait --wait-timeout 180
docker compose down
```

The `ndc_postgres_data` volume persists across rebuilds and `docker compose down`.
Do not add `-v` unless you intend to delete all database data. An existing volume
retains its original database credentials; changing `POSTGRES_*` does not update
users or passwords already stored in PostgreSQL.

## Recovery notes

The missing frontend source, assets, manifest, and lockfile were recovered from
commit `4aeb762`. V12 was recovered from the previously working backend image to
preserve the checksum already recorded by Flyway. Do not edit applied migrations
or run Flyway repair to hide a checksum mismatch; restore the matching SQL file.

## Dev sample data

> Local/dev only. Never run this against a shared or production database.

`backend/dev-seed/dashboard-sample-data.sql` fills the dashboard with sample tasks,
transactions, publication links, seasons, activity logs, and notifications. It is
not a Flyway migration, so it only runs when you apply it by hand after the stack
is up (it needs the users from the V18 seed or real accounts in every department):

```powershell
docker exec -i ndc_db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backend/dev-seed/dashboard-sample-data.sql
```

Run it from the repository root in Git Bash, or use
`Get-Content -Raw -Encoding UTF8 backend/dev-seed/dashboard-sample-data.sql | docker exec -i ndc_db sh -c '...'`
in PowerShell, which has no `<` redirection. Every row has a fixed id, so running
it again inserts nothing new.
