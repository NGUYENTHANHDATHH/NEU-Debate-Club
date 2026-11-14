-- Đăng ký tham gia sự kiện qua web + quét QR check-in/check-out.
-- Mã QR chính là id của dòng (UUID ngẫu nhiên) nên bỏ các cột mã/hash chưa từng được dùng;
-- is_checked_in trùng nghĩa với checked_in_at.
ALTER TABLE event_attendees
  DROP COLUMN ticket_code,
  DROP COLUMN qr_code_hash,
  DROP COLUMN is_checked_in,
  ADD COLUMN checked_out_at TIMESTAMPTZ;
