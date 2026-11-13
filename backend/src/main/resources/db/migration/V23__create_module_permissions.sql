-- Trưởng/Phó ban của ban nào được dùng module nào (thành viên thường: không). BCN luôn có mọi module, không lưu ở đây.
-- Bắt đầu trống: BCN tự tick tại /dashboard/roles. Lưu tên enum Java (VD: TRUYEN_THONG, LANDING_CMS).
CREATE TABLE module_permissions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module     VARCHAR(50) NOT NULL,
  department VARCHAR(30) NOT NULL,
  UNIQUE (module, department)
);
