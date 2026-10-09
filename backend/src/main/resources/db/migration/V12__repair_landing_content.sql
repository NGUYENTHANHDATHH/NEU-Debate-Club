-- Repair databases created before the complete UC-17 landing seed.

ALTER TYPE landing_section_enum ADD VALUE IF NOT EXISTS 'comments';

INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system.ndc.neu@gmail.com',
  'System Admin',
  'bcn',
  true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO landing_content (section, content_json, is_published, updated_by)
VALUES
('hero', '{
  "headline": "Cogito, ergo sum",
  "slogan": "Câu lạc bộ Tranh biện Đại học Kinh tế Quốc dân",
  "subtext": "Nơi mỗi lập luận được mài giũa, mỗi quan điểm được trân trọng và mỗi tranh biện viên được tỏa sáng.",
  "ctaLabel": "Đăng ký tuyển thành viên",
  "ctaLink": "/recruitment"
}'::jsonb, true, '00000000-0000-0000-0000-000000000001'),
('vision', '{
  "title1": "Tư Duy Phản Biện,",
  "title2": "Định Hình Tương Lai.",
  "description": "Được thành lập năm 2014, CLB Tranh biện NEU là ngôi nhà của những tâm hồn yêu tư duy và lập luận."
}'::jsonb, true, '00000000-0000-0000-0000-000000000001'),
('departments', '{
  "items": [
    {"id":"truyen-thong","nameKey":"departments.detail.media.name","descKey":"departments.detail.media.desc","iconType":"triangle"},
    {"id":"doi-ngoai","nameKey":"departments.detail.external.name","descKey":"departments.detail.external.desc","iconType":"hexagon"},
    {"id":"su-kien","nameKey":"departments.detail.event.name","descKey":"departments.detail.event.desc","iconType":"circle"},
    {"id":"chuyen-mon","nameKey":"departments.detail.academics.name","descKey":"departments.detail.academics.desc","iconType":"square"}
  ]
}'::jsonb, true, '00000000-0000-0000-0000-000000000001'),
('comments', '{
  "items": [
    {"id":1,"img":"https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg","quote":"NEU Debate Club là một lò rèn, nơi những ý tưởng được mài giũa để trở nên sắc bén.","author":"Vũ Việt Anh","role":"Trưởng Ban Chuyên Môn (2024)","delay":0.1},
    {"id":2,"img":"https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg","quote":"Bạn sẽ học được cách bảo vệ luận điểm của mình và biết cách lắng nghe để phát triển.","author":"Nguyễn Phương Ánh","role":"Thành viên Ban Đối Ngoại","delay":0.3},
    {"id":3,"img":"https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg","quote":"Mọi sự kiện lớn đều bắt đầu bằng tư duy hệ thống học được tại NEU Debate Club.","author":"Tạ Tấn Minh","role":"Thành viên Ban Sự Kiện","delay":0.5}
  ]
}'::jsonb, true, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (section) DO UPDATE
SET content_json = EXCLUDED.content_json,
    is_published = EXCLUDED.is_published,
    updated_by = EXCLUDED.updated_by;