# Design System: NEU Debate Club Dashboard

## 1. Visual Theme & Atmosphere

A restrained, gallery-airy interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is clinical yet warm. Density is balanced, variance runs high to prevent symmetrical boredom, and motion is fluid but never theatrical. Designed specifically for the hierarchical roles of the NEU Debate Club (Thành viên, Trưởng ban, BCN).

## 2. Color Palette & Roles

- **Canvas White** (#F9FAFB) — Primary background surface. Warm-neutral.
- **Pure Surface** (#FFFFFF) — Card and container fill. Used with whisper shadow.
- **Charcoal Ink** (#18181B) — Primary text. Zinc-950 depth — never pure black.
- **Steel Secondary** (#71717A) — Body text, descriptions, metadata.
- **Whisper Border** (rgba(226,232,240,0.5)) — Card borders, 1px lines.
- **Deep Rose** (#E11D48) — Single Accent Color for CTAs, active states, focus rings.

## 3. Typography Rules

- **Display:** `Satoshi` or `Geist` — Track-tight, controlled scale, weight-driven hierarchy.
- **Body:** `Satoshi` or `Geist` — Relaxed leading (1.65), 65ch max-width.
- **Mono:** `JetBrains Mono` — For metadata, timestamps, and activity logs.
- **Banned:** Inter, generic serifs.

## 4. Component Stylings

- **Buttons:** Flat surface, no outer glow. Tactile -1px translateY on active. Deep Rose fill for primary.
- **Cards:** Generously rounded corners (2.5rem). Diffused whisper shadow. Pure white fill.
- **Inputs:** Label above, error below. Focus ring in Deep Rose. No floating labels.
- **Loaders:** Skeletal shimmer matching layout dimensions.
- **Empty States:** Composed illustrations — not just "No data".

## 5. Layout Principles

- **Grid-First:** CSS Grid over Flexbox math.
- **Role-Based Views:**
  - Thành viên (Todo-list, Cập nhật task, Thông báo, Thư viện)
  - Trưởng ban (Giao task, Tạo thông báo, Nghiệp vụ ban, Biểu đồ, Ấn phẩm)
  - BCN (Quản lý thành viên, Phân quyền, Tài chính, CMS, Health, Giao task tổng, Activity Log, Nhiệm kỳ)
- No overlapping elements. Bento grid architecture where applicable. Max-width 1400px centered.

## 6. Motion & Interaction

- Spring Physics default (stiffness: 100, damping: 20).
- Staggered waterfall reveals for tasks and activity logs.

## 7. Anti-Patterns (Banned)

- No emojis.
- No pure black (#000000).
- No 3-column equal card layouts for features.
- No neon glows or AI copywriting clichés.
- No generic serif fonts in the dashboard.
