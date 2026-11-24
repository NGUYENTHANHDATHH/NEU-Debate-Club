-- Tài khoản PayOS nhận tiền do BCN đổi trên web; chưa có dòng nào = dùng PAYOS_* trong env.
-- api_key, checksum_key mã hoá AES-GCM (PayosSettingsService).
CREATE TABLE payos_settings (
  id           SMALLINT PRIMARY KEY CHECK (id = 1),
  client_id    TEXT NOT NULL,
  api_key      TEXT NOT NULL,
  checksum_key TEXT NOT NULL,
  updated_by   UUID REFERENCES users(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
