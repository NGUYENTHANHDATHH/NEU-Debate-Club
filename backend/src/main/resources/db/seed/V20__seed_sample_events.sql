-- ====================================================================
-- V20__seed_sample_events.sql
-- Seed 10 sự kiện cũ (trước đây) có kèm ngân sách và liên kết tài liệu
-- ====================================================================

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Lấy user admin (BCN) sẵn có hoặc tạo mới nếu chưa tồn tại
  SELECT id INTO v_admin_id FROM users WHERE role = 'bcn' LIMIT 1;
  IF v_admin_id IS NULL THEN
    INSERT INTO users (id, email, full_name, role, is_active)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'system@ndc.neu.edu.vn',
      'System Admin',
      'bcn',
      true
    ) ON CONFLICT (email) DO UPDATE SET role = 'bcn'
    RETURNING id INTO v_admin_id;
  END IF;

  INSERT INTO events (id, title, description, location, event_date, status, budget, resource_urls, created_by)
  VALUES
    (
      'e0000000-0000-0000-0000-000000000001',
      'Giải Tranh biện Mở rộng NEU Debate Open 2025',
      'Giải đấu tranh biện theo luật Nghị viện Anh (BP) quy mô toàn quốc quy tụ hơn 80 đội thi từ các trường đại học hàng đầu.',
      'Hội trường A2 & Nhà D2 - ĐH Kinh tế Quốc dân',
      '2025-11-15 08:00:00+07',
      'finished',
      45000000.00,
      '[
        "https://docs.google.com/spreadsheets/d/1neu-open-budget-2025/edit",
        "https://docs.google.com/document/d/1neu-open-rulebook-guidelines/edit",
        "https://drive.google.com/drive/folders/1neu-debate-open-media-assets"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000002',
      'Freshers Debate Cup 2025 - Tranh biện Tân sinh viên K67',
      'Giải đấu nhập môn tranh biện nội bộ dành riêng cho các bạn tân sinh viên khóa mới làm quen với tư duy logic và kỹ năng nói trước đám đông.',
      'Hội trường 1000 chỗ Nhà A1 - NEU',
      '2025-10-05 13:30:00+07',
      'finished',
      18000000.00,
      '[
        "https://docs.google.com/spreadsheets/d/1freshers-cup-match-schedule/edit",
        "https://docs.google.com/document/d/1freshers-debate-motions-list/edit"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000003',
      'Workshop Kỹ năng Xây dựng Luận điểm & Phản biện Sắc bén',
      'Chuỗi bài giảng kết hợp thực hành cùng các diễn giả là Quán quân và Trọng tài quốc tế về cách nhận diện ngụy biện và cấu trúc luận điểm PEEL.',
      'Phòng Hội thảo B102 - Tòa nhà A2',
      '2025-08-20 18:30:00+07',
      'finished',
      8500000.00,
      '[
        "https://docs.google.com/presentation/d/1workshop-argumentation-slides/edit",
        "https://docs.google.com/document/d/1workshop-handbook-peel-structure/edit",
        "https://docs.google.com/forms/d/1workshop-feedback-survey/viewform"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000004',
      'Showmatch Tranh biện: Trí tuệ Nhân tạo & Tương lai Việc làm',
      'Trận tranh biện biểu diễn kịch tính giữa các thành viên kỳ cựu của NDC về tác động của GenAI đối với thị trường lao động sinh viên kinh tế.',
      'Hội trường B - Ký túc xá NEU',
      '2025-06-12 19:00:00+07',
      'finished',
      6200000.00,
      '[
        "https://docs.google.com/document/d/1showmatch-script-and-motions/edit",
        "https://drive.google.com/drive/folders/1showmatch-livestream-records"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000005',
      'Trại Huấn luyện Tranh biện Hè - NDC Summer Camp 2025',
      'Khóa tập huấn 3 ngày 2 đêm tập trung vào nghiên cứu chính sách kinh tế vĩ mô, xã hội học và kỹ thuật mở rộng case tranh biện chuyên sâu.',
      'Khu Huấn luyện Ngoại thành Ba Vì, Hà Nội',
      '2025-07-18 07:00:00+07',
      'finished',
      32000000.00,
      '[
        "https://docs.google.com/spreadsheets/d/1summer-camp-logistics-expenses/edit",
        "https://docs.google.com/document/d/1summer-camp-training-curriculum/edit",
        "https://drive.google.com/drive/folders/1summer-camp-photo-album"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000006',
      'Talkshow: Nghệ thuật Thuyết phục trong Đàm phán Doanh nghiệp',
      'Chương trình đối thoại cùng cựu thành viên NDC hiện là Quản lý chiến lược tại các tập đoàn đa quốc gia chia sẻ ứng dụng tranh biện trong sự nghiệp.',
      'Phòng Hội thảo A101 - ĐH Kinh tế Quốc dân',
      '2025-04-26 14:00:00+07',
      'finished',
      14500000.00,
      '[
        "https://docs.google.com/presentation/d/1persuasion-negotiation-deck/edit",
        "https://docs.google.com/spreadsheets/d/1talkshow-guest-and-sponsor-budget/edit"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000007',
      'Giao lưu Tranh biện Tứ hùng: NEU - FTU - DAV - HANU',
      'Giải đấu giao hữu 4 câu lạc bộ tranh biện đại học hàng đầu miền Bắc trước thềm giải đấu toàn quốc VNC.',
      'Hội trường Khoa Luật - ĐH Ngoại thương & NEU',
      '2025-03-15 08:30:00+07',
      'finished',
      9800000.00,
      '[
        "https://docs.google.com/spreadsheets/d/1inter-university-friendly-tab/edit",
        "https://docs.google.com/document/d/1friendly-match-protocol/edit"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000008',
      'Tập huấn Kỹ năng Trọng tài & Phân tích Động thái Vòng thi',
      'Buổi chia sẻ chuyên sâu về bảng tiêu chí chấm điểm, cách ra quyết định phân định thắng thua và đưa ra lời nhận xét mang tính xây dựng cho thí sinh.',
      'Phòng D2-105 - Nhà D2 NEU',
      '2025-01-10 18:00:00+07',
      'finished',
      4500000.00,
      '[
        "https://docs.google.com/document/d/1adjudication-standard-rubrics/edit",
        "https://docs.google.com/forms/d/1adjudication-test-and-feedback/viewform"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000009',
      'Giải Tranh biện Tiếng Anh NEU IV 2024 (English Debate)',
      'Giải đấu tranh biện hoàn toàn bằng tiếng Anh thu hút hơn 40 đội thi từ các trường chuyên và đại học trên cả nước.',
      'Hội trường Nhà A2 - ĐH Kinh tế Quốc dân',
      '2024-11-28 08:00:00+07',
      'finished',
      28000000.00,
      '[
        "https://docs.google.com/spreadsheets/d/1neu-iv-2024-finance-and-tab/edit",
        "https://docs.google.com/document/d/1neu-iv-2024-tournament-rules/edit",
        "https://drive.google.com/drive/folders/1neu-iv-2024-media-drive"
      ]'::jsonb,
      v_admin_id
    ),
    (
      'e0000000-0000-0000-0000-000000000010',
      'Gala Kỷ niệm 8 Năm Thành lập & Báo cáo Nhiệm kỳ NDC',
      'Đêm tiệc kỷ niệm hành trình 8 năm thành lập CLB Tranh biện NEU, tri ân cựu thành viên các thế hệ và chuyển giao ban chủ nhiệm nhiệm kỳ mới.',
      'Trung tâm Hội nghị Trống Đồng Palace, Hà Nội',
      '2024-10-18 18:00:00+07',
      'finished',
      38000000.00,
      '[
        "https://docs.google.com/spreadsheets/d/1gala-anniversary-financial-report/edit",
        "https://docs.google.com/document/d/1gala-ceremony-runsheet/edit",
        "https://drive.google.com/drive/folders/1gala-8-years-video-and-photos"
      ]'::jsonb,
      v_admin_id
    )
  ON CONFLICT (id) DO NOTHING;
END $$;
