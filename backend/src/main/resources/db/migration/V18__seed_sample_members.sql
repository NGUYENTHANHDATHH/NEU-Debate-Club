WITH sample_members AS (
  SELECT
    i,
    (ARRAY[
      'Nguyễn Minh Anh', 'Trần Hải Đăng', 'Lê Thu Hà', 'Phạm Đức Huy',
      'Hoàng Khánh Linh', 'Vũ Quang Minh', 'Đỗ Ngọc Anh', 'Bùi Gia Bảo',
      'Đặng Phương Chi', 'Ngô Thành Công', 'Dương Mai Hương', 'Lý Tuấn Kiệt',
      'Trịnh Hoàng Long', 'Mai Nhật Nam', 'Tạ Bảo Ngọc', 'Cao Minh Phúc',
      'Phan Thảo Quỳnh', 'Hồ Đức Thành', 'Chu Anh Thư', 'Lương Hải Yến'
    ])[((i - 1) % 20) + 1] || ' ' || lpad(i::text, 2, '0') AS full_name
  FROM generate_series(1, 50) AS i
)
INSERT INTO users (email, full_name, role, department, phone, student_id, is_active)
SELECT
  'thanhvien' || lpad(i::text, 2, '0') || '.ndc.neu@gmail.com',
  full_name,
  CASE WHEN i % 8 = 0 THEN 'truong_ban'::role_enum ELSE 'member'::role_enum END,
  (ARRAY[
    'truyen_thong'::department_enum,
    'doi_ngoai'::department_enum,
    'noi_dung'::department_enum,
    'su_kien'::department_enum,
    'ky_thuat'::department_enum,
    'nhan_su'::department_enum
  ])[((i - 1) % 6) + 1],
  '09' || lpad((10000000 + i)::text, 8, '0'),
  '1122' || lpad(i::text, 4, '0'),
  i % 13 <> 0
FROM sample_members
ON CONFLICT (email) DO NOTHING;
