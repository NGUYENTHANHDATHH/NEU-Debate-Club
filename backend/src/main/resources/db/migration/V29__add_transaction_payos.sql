-- Link thanh toán PayOS (VietQR) cho khoản "chưa thu". orderCode là số nguyên duy nhất PayOS gửi lại trong webhook.
CREATE SEQUENCE payos_order_code_seq START WITH 100001;
ALTER TABLE transactions
  ADD COLUMN payos_order_code   BIGINT UNIQUE,
  ADD COLUMN payos_checkout_url TEXT,
  ADD COLUMN payos_qr_code      TEXT;
