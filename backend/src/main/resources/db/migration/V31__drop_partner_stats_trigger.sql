-- Số lần/tổng tiền tài trợ tính lúc đọc từ collaborations (chỉ hợp đồng đã ký/đã thanh lý).
-- Trigger V8 chỉ chạy khi INSERT (xoá không trừ) và đếm cả hợp đồng đang đàm phán, nên bỏ.
DROP TRIGGER IF EXISTS trg_update_partner_stats ON collaborations;
DROP FUNCTION IF EXISTS update_partner_stats();
ALTER TABLE partners DROP COLUMN IF EXISTS total_collaborations;
ALTER TABLE partners DROP COLUMN IF EXISTS total_sponsored;
