-- Thu chi gắn một thành viên (đóng quỹ, hoàn ứng, thưởng...). Tùy chọn; xóa thành viên giữ lại giao dịch.
ALTER TABLE transactions ADD COLUMN member_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
