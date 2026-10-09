-- ====================================================================
-- V10__seed_landing_content.sql
-- Seed dữ liệu mẫu cho bảng landing_content (UC-17: CMS Landing Page)
-- ====================================================================

-- Insert một system user để làm updated_by (nếu chưa có)
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system@ndc.neu.edu.vn',
  'System Admin',
  'bcn',
  true
) ON CONFLICT (email) DO NOTHING;

-- Seed từng section của landing page
INSERT INTO landing_content (section, content_json, is_published, updated_by) VALUES

('hero', '{
  "headline": "Cogito, ergo sum",
  "slogan": "Câu lạc bộ Tranh biện Đại học Kinh tế Quốc dân",
  "subtext": "Nơi mỗi lập luận được mài giũa, mỗi quan điểm được trân trọng và mỗi tranh biện viên được tỏa sáng.",
  "ctaLabel": "Đăng ký tuyển thành viên",
  "ctaLink": "/recruitment",
  "backgroundImageUrl": null
}', true, '00000000-0000-0000-0000-000000000001'),

('vision', '{
  "title1": "Tư Duy Phản Biện,",
  "title2": "Định Hình Tương Lai.",
  "description": "Được thành lập năm 2014, CLB Tranh biện NEU (NDC) là ngôi nhà của những tâm hồn yêu tư duy và lập luận. Chúng tôi tin rằng khả năng tranh biện không chỉ là kỹ năng học thuật – đó là năng lực cốt lõi giúp thế hệ trẻ đối mặt với thế giới phức tạp."
}', true, '00000000-0000-0000-0000-000000000001'),

('achievements', '{
  "stats": [
    { "id": 1, "iconType": "trophy", "value": "50+", "label": "Giải thưởng" },
    { "id": 2, "iconType": "target", "value": "100+", "label": "Sự kiện" },
    { "id": 3, "iconType": "users",  "value": "500+", "label": "Thành viên" },
    { "id": 4, "iconType": "star",   "value": "10+",  "label": "Năm thành lập" }
  ],
  "items": [
    {
      "id": 1,
      "title": "CLB Xuất Sắc Nhất NEU 2025",
      "category": "Giải Thưởng",
      "date": "Tháng 12, 2025",
      "image": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
      "desc": "Đạt danh hiệu Top 1 câu lạc bộ sinh viên tiêu biểu có ảnh hưởng nhất khối Đại học Kinh tế Quốc dân nhờ các hoạt động sôi nổi và đóng góp tích cực cho cộng đồng sinh viên.",
      "delay": 0.1
    },
    {
      "id": 2,
      "title": "Quán Quân VUDC 2024",
      "category": "Thành Tích Thi Đấu",
      "date": "Tháng 8, 2024",
      "image": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
      "desc": "Đội tuyển Cogito xuất sắc vượt qua hơn 60 đội thi từ khắp cả nước để lên ngôi Vô địch Giải Tranh biện Sinh viên Toàn quốc (Vietnam Universities Debating Championship).",
      "delay": 0.3
    },
    {
      "id": 3,
      "title": "Cột mốc 100.000 Followers",
      "category": "Truyền Thông",
      "date": "Tháng 3, 2025",
      "image": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
      "desc": "Chính thức cán mốc 100.000 người theo dõi trên Fanpage, trở thành một trong những Fanpage học thuật và kỹ năng có sức ảnh hưởng lớn nhất trong giới sinh viên.",
      "delay": 0.5
    }
  ]
}', true, '00000000-0000-0000-0000-000000000001'),

('projects', '{
  "items": [
    {
      "id": 1,
      "title": "NEU Debate Open 2025",
      "category": "Competition",
      "image": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
      "desc": "Giải đấu tranh biện lớn nhất năm, được tổ chức bởi CLB Tranh biện Đại học Kinh tế Quốc dân kết hợp cùng Liên chi đoàn Khoa Luật – NEU, chính thức trở lại! Năm 2025 đánh dấu cột mốc 5 năm tổ chức, hứa hẹn mang đến một đấu trường bùng nổ.",
      "delay": 0.1
    },
    {
      "id": 2,
      "title": "Compass 4Right Pass (2024)",
      "category": "Talkshow",
      "image": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/compass-4right-path.jpg",
      "desc": "Workshop COMPASS 4RIGHT PATH ra đời với hy vọng sẽ trở thành chiếc la bàn giúp các bạn có cơ hội được chia sẻ những điều trăn trở, khó nói bấy lâu, cũng như lắng nghe kiến thức, kinh nghiệm từ các vị diễn giả uy tín.",
      "delay": 0.3
    },
    {
      "id": 3,
      "title": "Thiêu Đường Tỏ Lối",
      "category": "Talkshow",
      "image": "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/theu-duong-to-loi.jpg",
      "desc": "Workshop THÊU ĐƯỜNG TỎ LỐI được tổ chức với hy vọng định hướng các bạn tân sinh viên thêu dệt nên con đường đúng đắn cho bản thân với sự góp mặt của những diễn giả nổi tiếng có nhiều kinh nghiệm và kiến thức.",
      "delay": 0.5
    }
  ]
}', true, '00000000-0000-0000-0000-000000000001'),

('departments', '{
  "items": [
    { "id": "truyen-thong", "nameKey": "departments.detail.media.name",    "descKey": "departments.detail.media.desc",    "iconType": "triangle" },
    { "id": "doi-ngoai",   "nameKey": "departments.detail.external.name",  "descKey": "departments.detail.external.desc",  "iconType": "hexagon" },
    { "id": "su-kien",     "nameKey": "departments.detail.event.name",     "descKey": "departments.detail.event.desc",     "iconType": "circle" },
    { "id": "chuyen-mon",  "nameKey": "departments.detail.academics.name", "descKey": "departments.detail.academics.desc", "iconType": "square" }
  ]
}', true, '00000000-0000-0000-0000-000000000001'),

('comments', '{
  "items": []
}', true, '00000000-0000-0000-0000-000000000001')

ON CONFLICT (section) DO NOTHING;
