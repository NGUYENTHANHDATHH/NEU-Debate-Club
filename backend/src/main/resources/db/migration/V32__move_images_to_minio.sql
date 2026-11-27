-- Ảnh chuyển từ Supabase Storage về MinIO trên server (bucket "media", phục vụ qua /media/*).
-- File ảnh được chép bằng scripts/migrate-supabase-images.sh; ở đây chỉ đổi URL.
UPDATE projects
SET image_url = replace(image_url, 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/', '/media/')
WHERE image_url LIKE 'https://lzefoyqkqqppbsyzmmuw.supabase.co/%';

UPDATE achievements
SET image_url = replace(image_url, 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/', '/media/')
WHERE image_url LIKE 'https://lzefoyqkqqppbsyzmmuw.supabase.co/%';

UPDATE landing_content
SET content_json = replace(content_json::text, 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/', '/media/')::jsonb
WHERE content_json::text LIKE '%lzefoyqkqqppbsyzmmuw.supabase.co%';

UPDATE landing_content_versions
SET content_json = replace(content_json::text, 'https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/', '/media/')::jsonb
WHERE content_json::text LIKE '%lzefoyqkqqppbsyzmmuw.supabase.co%';
