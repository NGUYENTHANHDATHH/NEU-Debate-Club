-- Complete UC-17 landing content seed and updated_at trigger.

INSERT INTO landing_content (section, content_json, is_published, updated_by)
SELECT
  'comments'::landing_section_enum,
  '{
    "items": [
      {
        "id": 1,
        "img": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
        "quote": "NEU Debate Club không chỉ là một câu lạc bộ, mà là một lò rèn. Tại đây, những ý tưởng mơ hồ nhất cũng bị bẻ gãy, mài giũa để trở thành sắc bén.",
        "author": "Vũ Việt Anh",
        "role": "Trưởng Ban Chuyên Môn (2024)",
        "delay": 0.1
      },
      {
        "id": 2,
        "img": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
        "quote": "Môi trường ở đây khắc nghiệt nhưng công bằng. Bạn sẽ học được cách bảo vệ luận điểm của mình, đồng thời biết cách lắng nghe để phát triển.",
        "author": "Nguyễn Phương Ánh",
        "role": "Thành viên Ban Đối Ngoại",
        "delay": 0.3
      },
      {
        "id": 3,
        "img": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
        "quote": "Từ những việc điều phối sự kiện lớn, mọi thứ đều bắt đầu bằng tư duy hệ thống học được tại NEU Debate Club.",
        "author": "Tạ Tấn Minh",
        "role": "Thành viên Ban Sự Kiện",
        "delay": 0.5
      }
    ]
  }'::jsonb,
  true,
  u.id
FROM users u
WHERE u.email = 'system@ndc.neu.edu.vn'
ON CONFLICT (section) DO UPDATE
SET content_json = EXCLUDED.content_json,
    is_published = EXCLUDED.is_published,
    updated_by = EXCLUDED.updated_by;

DROP TRIGGER IF EXISTS trg_landing_content_updated_at ON landing_content;
CREATE TRIGGER trg_landing_content_updated_at
  BEFORE UPDATE ON landing_content
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();