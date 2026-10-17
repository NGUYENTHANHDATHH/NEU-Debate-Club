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
- **Access:** public GETs are allowed by [SecurityConfig.java](../../backend/src/main/java/com/neudebateclub/backend/config/SecurityConfig.java); writes call `RoleGuard.requireCmsEditor`.

## Catalog trace

- **Schema:** V14 creates `projects`; V15 creates `achievements`; V16 copies the legacy JSON seed only when the corresponding catalog is empty. Both catalog tables reference `users` for creation/update metadata.
- **Backend:** [LandingCatalogController.java](../../backend/src/main/java/com/neudebateclub/backend/cms/LandingCatalogController.java) exposes visible public rows and privileged catalog replacement-style publish operations.
- **Frontend:** [CmsPage.tsx](../../frontend/src/components/dashboard/CmsPage.tsx) uses catalog helpers. Public home/list/detail pages use `fetchPublicCatalog` and `fetchPublicCatalogItem`.

## Contract alignment

[api.ts](../../frontend/src/lib/api.ts) now calls the controllers' concrete CMS route prefixes. Project and achievement UI reads use catalog field names (`imageUrl`, `description`, `displayOrder`, and `visible`) directly. The remaining type declarations are handwritten, so this alignment needs automated contract coverage before endpoint changes.

## Test status

No tests cover public landing reads, CMS authorization, draft/publish/history behavior, catalog publishing, schema validation, or frontend rendering/error states.

## Current ownership decision

Catalog rows are now the application source for public projects and achievements. Landing JSON remains for independently authored landing sections and achievement statistics. Existing project/achievement item JSON in `landing_content` should be retired only after deployment data has been checked.
