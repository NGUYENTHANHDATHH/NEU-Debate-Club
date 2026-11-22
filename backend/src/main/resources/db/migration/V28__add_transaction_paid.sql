-- paid = false: khoản thành viên cần đóng nhưng CLB chưa nhận tiền, chưa tính vào quỹ.
-- Chỉ khoản thu, không gắn sự kiện (kiểm tra thành viên bắt buộc nằm ở backend vì member_id có ON DELETE SET NULL).
ALTER TABLE transactions ADD COLUMN paid BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE transactions ADD CONSTRAINT transactions_unpaid_check
  CHECK (paid OR (type = 'income' AND event_id IS NULL));
