# Landing and CMS module

## Two separate content stores

The implementation has two independent persistence models:

| Store | Tables | Backend public read | Backend CMS write | Current frontend use |
|---|---|---|---|---|
| Section JSON | `landing_content`, `landing_content_versions` | `GET /api/public/landing/{section}` | Section CMS endpoints under `/api/public/landing/cms/landing` | Home components fetch hero, vision, departments, comments, and achievement statistics. |
| Catalog rows | `projects`, `achievements` | `/api/public/projects...` and `/api/public/achievements...` | Catalog CMS endpoints under `/api/public/cms/landing/catalog` | Home cards and public list/detail pages. |

This split is verified in controllers, migrations, and frontend calls. Whether it is intentional is unknown.

## Section content trace

- **Schema:** V7 creates `landing_content`; V9 converts `content_json` to JSONB; V13 adds draft/history rows in `landing_content_versions`.
- **Backend:** [LandingContentController.java](../../backend/src/main/java/com/neudebateclub/backend/cms/LandingContentController.java) reads published JSON and creates/publishes drafts. [LandingSection.java](../../backend/src/main/java/com/neudebateclub/backend/common/enums/LandingSection.java) permits six section names.
- **Frontend:** `Hero`, `Vision`, `Departments`, and `Comments` use `fetchLandingSection`; `Achievements` uses it only for statistics. The caller owns the expected JSON shape.
- **Access:** public GETs are allowed by [SecurityConfig.java](../../backend/src/main/java/com/neudebateclub/backend/config/SecurityConfig.java); CMS reads/writes call `RoleGuard.requireModuleManager` for `LANDING_CMS`.

## Catalog trace

- **Schema:** V14 creates `projects`; V15 creates `achievements`; V16 copies the legacy JSON seed only when the corresponding catalog is empty; V17 adds the remaining public mock rows without overwriting an existing slug. Both catalog tables reference `users` for creation/update metadata.
- **Backend:** [LandingCatalogController.java](../../backend/src/main/java/com/neudebateclub/backend/cms/LandingCatalogController.java) exposes visible public rows and privileged catalog replacement-style publish operations.
- **Frontend:** [CmsPage.tsx](../../frontend/src/components/dashboard/CmsPage.tsx) loads all section fields from the CMS APIs. Catalog entries render as image/title/description cards; selecting one reveals its editable table-backed fields. Public home/list/detail pages use `fetchPublicCatalog` and `fetchPublicCatalogItem`.

## Contract alignment

[api.ts](../../frontend/src/lib/api.ts) now calls the controllers' concrete CMS route prefixes. Project and achievement UI reads use catalog field names (`imageUrl`, `description`, `displayOrder`, and `visible`) directly. The remaining type declarations are handwritten, so this alignment needs automated contract coverage before endpoint changes.

## Test status

[CmsPublishIntegrationTest.java](../../backend/src/test/java/com/neudebateclub/backend/cms/CmsPublishIntegrationTest.java) exercises real HTTP requests against PostgreSQL: draft/publish/public read/history for all six sections, both catalog types with text/empty/structured content, catalog batch rollback, validation errors, authorization, and runtime OpenAPI publish routes. It runs Flyway and Hibernate schema validation with Open Session in View disabled. Frontend rendering/error states still have no automated UI coverage.

The suite is opt-in: set `CMS_TEST_DATABASE_URL` to a **disposable PostgreSQL database**, plus `CMS_TEST_DATABASE_USERNAME` and `CMS_TEST_DATABASE_PASSWORD` (both default to `cms_test`). Run `./mvnw.cmd -Dtest=CmsPublishIntegrationTest,RoleGuardTest test` from `backend`. The test disables local `.env` imports and baseline-on-migrate, supplies test-only auth configuration, and writes fixture users/content. Never point it at application data. Without the URL, the CMS suite is skipped.

## Publish persistence and response behavior

- PostgreSQL enum columns remain unchanged. CMS entity mappings explicitly cast string values on writes; section mappings also cast enum reads to text so repository predicates work with string parameters. This fixes the `landing_project_enum` write mismatch and `landing_section_enum = character varying` read failure seen in backend logs. No migration or data rewrite is required.
- Catalog `content` is stored as a JSON value and returned as the corresponding JSON value. Text (including empty strings, quotes, and newlines) is encoded as a JSON string; objects remain objects. The frontend's existing `string | Record<string, unknown> | null` representation covers its supported editor payloads.
- Catalog responses omit the lazy `createdBy`/`updatedBy` user relationships. These are persistence metadata, not fields in the frontend catalog contract; serializing their Hibernate proxies can fail after a successful save. Timestamps remain in the response.
- Each catalog publish request is transactional. Section publication updates the published row and draft status in one transaction. Invalid section/type, missing required catalog text, invalid category, and publishing without a draft return HTTP 400 using the existing error envelope.
- Achievement catalog and statistics still use separate requests. The editor retains saved catalog IDs before publishing statistics, so a retry updates those rows if the later statistics request fails. There is no transaction spanning those requests.
- Routes are unchanged; Springdoc remains the runtime contract source. No generated TypeScript client or checked-in OpenAPI specification was introduced.

## Current ownership decision

Catalog rows are now the application source for public projects and achievements. Landing JSON remains for independently authored landing sections and achievement statistics. Existing project/achievement item JSON in `landing_content` should be retired only after deployment data has been checked.
