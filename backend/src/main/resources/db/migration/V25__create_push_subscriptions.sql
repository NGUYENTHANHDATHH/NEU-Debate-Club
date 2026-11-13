-- Web Push: mỗi dòng là một trình duyệt/thiết bị đã bật thông báo.
-- user_id NULL = khách chưa đăng nhập (chỉ nhận thông báo sự kiện của landing page).
CREATE TABLE push_subscriptions (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   TEXT         NOT NULL UNIQUE,
  p256dh     VARCHAR(200) NOT NULL,
  auth       VARCHAR(100) NOT NULL,
  user_id    UUID         REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
