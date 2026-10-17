-- Preserve the remaining public-page mock records in the catalog tables.
-- Existing catalog rows always win over this development seed.

INSERT INTO projects (title, slug, description, image_url, category, display_order, is_visible)
VALUES
  ('Kim Cổ Âm Vang', '4', 'Bản sắc Việt trong dòng chảy hội nhập.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/kim-co-am-vang.jpg', 'workshop', 4, true),
  ('Vinci''s Arcane', '5', 'Lấy cảm hứng từ kiệt tác The Da Vinci Code của Dan Brown.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/vincis-arcane.jpg', 'other', 5, true),
  ('NEU Debate Open 2024', '6', 'Lấy ý tưởng từ bộ truyện kinh điển Alice''s Adventures in Wonderland.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg', 'debate_tournament', 6, true),
  ('NEU Debate Open 2023', '7', 'NDO 2023 lấy cảm hứng từ bộ phim The Greatest Showman.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2023.jpg', 'debate_tournament', 7, true),
  ('NEU Debate Open 2022', '8', 'Một mùa giải tạo nên những dấu ấn khó quên.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2022.jpg', 'debate_tournament', 8, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO achievements (title, slug, description, image_url, category, display_order, is_visible)
VALUES
  ('Á quân Giải Vô địch Tranh biện Quốc tế V-WSDC', '4', 'Đại diện câu lạc bộ có màn thể hiện xuất sắc tại đấu trường quốc tế.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg', 'award', 4, true),
  ('Tổ chức thành công Giải đấu N-Debate Mở rộng', '5', 'Giải đấu thường niên thu hút sự tham gia của các trường đại học lớn trên toàn quốc.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg', 'event', 5, true),
  ('Kỷ niệm 10 năm thành lập câu lạc bộ', '6', 'Đêm Gala nhìn lại hành trình một thập kỷ hình thành và phát triển.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg', 'other', 6, true),
  ('Thành viên xuất sắc nhất Giải vô địch châu Á', '7', 'Thành tích cá nhân góp phần nâng cao uy tín của câu lạc bộ trong cộng đồng tranh biện khu vực.', 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg', 'award', 7, true)
ON CONFLICT (slug) DO NOTHING;
