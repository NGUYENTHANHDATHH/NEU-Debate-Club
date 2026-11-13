-- Người gửi thông báo (người tạo thủ công hoặc người giao task). NULL = hệ thống / tài khoản đã bị xóa.
ALTER TABLE notifications
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Truy vấn chính: thông báo mới nhất của một người dùng.
CREATE INDEX idx_notifications_user_created_at ON notifications(user_id, created_at DESC);
