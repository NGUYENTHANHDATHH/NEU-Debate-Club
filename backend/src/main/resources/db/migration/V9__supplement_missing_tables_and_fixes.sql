-- ====================================================================
-- V9__supplement_missing_tables_and_fixes.sql
-- Bổ sung các bảng còn thiếu và sửa các lỗi ràng buộc/cấu trúc theo USE_CASES_HE_THONG_CLB_NEU.md
-- ====================================================================

-- 1. SỬA LỖI BẢNG USERS: Bổ sung cột google_id để đồng bộ với User.java và AuthService
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. MỞ RỘNG ENUM DEPARTMENT (nếu CLB có ban kỹ thuật / nhân sự riêng biệt)
ALTER TYPE department_enum ADD VALUE IF NOT EXISTS 'ky_thuat';
ALTER TYPE department_enum ADD VALUE IF NOT EXISTS 'nhan_su';

-- 3. SỬA LỖI BẢNG TASKS: Bổ sung event_id để liên kết công việc với Sự kiện (UC-01, UC-10, UC-14)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);

-- 4. BỔ SUNG CỘT CHO BẢNG COLLABORATIONS (UC-05: Hồ sơ tài trợ & quyền lợi)
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS tier VARCHAR(50); -- 'kim_cuong', 'vang', 'bac', 'dong', 'hien_vat'
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS contract_status VARCHAR(50) NOT NULL DEFAULT 'da_ky'; -- 'dang_dam_phan', 'da_ky', 'da_thanh_ly'
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS benefits_committed TEXT;

-- 5. CHUYỂN ĐỔI content_json CỦA landing_content SANG JSONB (UC-17: CMS Landing Page)
ALTER TABLE landing_content ALTER COLUMN content_json DROP DEFAULT;
ALTER TABLE landing_content ALTER COLUMN content_json TYPE JSONB USING content_json::jsonb;
ALTER TABLE landing_content ALTER COLUMN content_json SET DEFAULT '{}'::jsonb;

-- 6. TẠO BẢNG event_contents (UC-03 & UC-04: Content Handover & Status Lock của BCM)
-- (Sử dụng content_status_enum đã tạo sẵn ở V1__create_enums.sql nhưng chưa có bảng dùng)
CREATE TABLE IF NOT EXISTS event_contents (
  id           UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID                 NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title        VARCHAR(255)         NOT NULL,
  speakers     TEXT,
  description  TEXT,
  doc_url      TEXT,
  status       content_status_enum  NOT NULL DEFAULT 'idea',
  is_locked    BOOLEAN              NOT NULL DEFAULT false,
  approved_by  UUID                 REFERENCES users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  created_by   UUID                 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ          NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_contents_event_id ON event_contents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_contents_status   ON event_contents(status);

-- 7. TẠO BẢNG proposals (UC-02: Approval Center / Kế hoạch Đề xuất của BCN)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status_enum') THEN
    CREATE TYPE proposal_status_enum AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS proposals (
  id             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(255)         NOT NULL,
  proposal_type  VARCHAR(50)          NOT NULL, -- 'event_plan', 'budget_request', 'ad_hoc'
  content        TEXT                 NOT NULL,
  attachment_url TEXT,
  event_id       UUID                 REFERENCES events(id) ON DELETE SET NULL,
  department     department_enum      NOT NULL,
  status         proposal_status_enum NOT NULL DEFAULT 'pending',
  review_notes   TEXT,
  submitted_by   UUID                 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by    UUID                 REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ          NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proposals_status       ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_department   ON proposals(department);
CREATE INDEX IF NOT EXISTS idx_proposals_submitted_by ON proposals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_proposals_event_id     ON proposals(event_id);

-- 8. TẠO BẢNG event_attendees (UC-11 & UC-12: Tạo Mã QR/ID & Quét Check-in đón tiếp sinh viên)
CREATE TABLE IF NOT EXISTS event_attendees (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_code    VARCHAR(50)  NOT NULL,
  qr_code_hash   VARCHAR(255) NOT NULL UNIQUE,
  full_name      VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(20),
  student_id     VARCHAR(20),
  organization   VARCHAR(255),
  is_checked_in  BOOLEAN      NOT NULL DEFAULT false,
  checked_in_at  TIMESTAMPTZ,
  checked_in_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
  registered_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_event_attendee_email  UNIQUE (event_id, email),
  CONSTRAINT uq_event_attendee_ticket UNIQUE (event_id, ticket_code)
);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id      ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_qr_code_hash  ON event_attendees(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_attendees_ticket_code   ON event_attendees(ticket_code);
CREATE INDEX IF NOT EXISTS idx_attendees_is_checked_in ON event_attendees(is_checked_in);

-- 9. TẠO BẢNG equipment & equipment_borrows (UC-13: Quản lý thiết bị & Mượn/Trả CSVC CLB)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_status_enum') THEN
    CREATE TYPE equipment_status_enum AS ENUM ('good', 'fair', 'damaged', 'lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'borrow_status_enum') THEN
    CREATE TYPE borrow_status_enum AS ENUM ('borrowing', 'returned', 'overdue', 'damaged');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS equipment (
  id                 UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  code               VARCHAR(50)           NOT NULL UNIQUE,
  name               VARCHAR(255)          NOT NULL,
  category           VARCHAR(100),
  total_quantity     INTEGER               NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  available_quantity INTEGER               NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  condition_status   equipment_status_enum NOT NULL DEFAULT 'good',
  storage_location   VARCHAR(255),
  notes              TEXT,
  created_at         TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ           NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_code     ON equipment(code);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);

CREATE TABLE IF NOT EXISTS equipment_borrows (
  id                     UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id           UUID               NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  borrower_id            UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_id               UUID               REFERENCES events(id) ON DELETE SET NULL,
  quantity               INTEGER            NOT NULL DEFAULT 1 CHECK (quantity > 0),
  borrowed_at            TIMESTAMPTZ        NOT NULL DEFAULT now(),
  expected_return_at     TIMESTAMPTZ        NOT NULL,
  actual_returned_at     TIMESTAMPTZ,
  purpose                TEXT               NOT NULL,
  status                 borrow_status_enum NOT NULL DEFAULT 'borrowing',
  return_condition_notes TEXT,
  approved_by            UUID               REFERENCES users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ        NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_borrows_equip    ON equipment_borrows(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_borrows_borrower ON equipment_borrows(borrower_id);
CREATE INDEX IF NOT EXISTS idx_equipment_borrows_status   ON equipment_borrows(status);

-- 10. TẠO BẢNG design_assets (UC-07 & UC-08: Kho Lưu trữ File Thiết kế Gốc & Media Drive)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type_enum') THEN
    CREATE TYPE asset_type_enum AS ENUM (
      'brand_identity',
      'figma_source',
      'design_template',
      'event_photos_raw',
      'event_photos_highlight',
      'video_recap',
      'other'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS design_assets (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(255)    NOT NULL,
  asset_type          asset_type_enum NOT NULL,
  url                 TEXT            NOT NULL,
  event_id            UUID            REFERENCES events(id) ON DELETE SET NULL,
  department          department_enum NOT NULL DEFAULT 'truyen_thong',
  file_format         VARCHAR(50),
  description         TEXT,
  is_public_internal  BOOLEAN         NOT NULL DEFAULT true,
  created_by          UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_design_assets_type       ON design_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_design_assets_event_id   ON design_assets(event_id);
CREATE INDEX IF NOT EXISTS idx_design_assets_department ON design_assets(department);

-- 11. BỔ SUNG TRIGGER AUTO UPDATED_AT CHO CÁC BẢNG MỚI
CREATE TRIGGER trg_event_contents_updated_at    BEFORE UPDATE ON event_contents    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_proposals_updated_at         BEFORE UPDATE ON proposals         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_event_attendees_updated_at   BEFORE UPDATE ON event_attendees   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_equipment_updated_at         BEFORE UPDATE ON equipment         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_equipment_borrows_updated_at BEFORE UPDATE ON equipment_borrows FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_design_assets_updated_at     BEFORE UPDATE ON design_assets     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
