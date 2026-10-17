export type Project = {
  id: number;
  title: string;
  category: string;
  image: string;
  desc: string;
  delay: number;
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    title: "NEU Debate Open 2025",
    category: "Competition",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
    desc: "Giải đấu tranh biện lớn nhất năm, được tổ chức bởi CLB Tranh biện Đại học Kinh tế Quốc dân kết hợp cùng Liên chi đoàn Khoa Luật – NEU, chính thức trở lại! Năm 2025 đánh dấu cột mốc 5 năm tổ chức, hứa hẹn mang đến một đấu trường bùng nổ, nơi những lập luận sắc bén và bản lĩnh tranh biện sẽ tỏa sáng, khẳng định vị thế trong cộng đồng tranh biện Việt Nam.",
    delay: 0.1,
  },
  {
    id: 2,
    title: "Compass 4Right Pass (2024)",
    category: "Talkshow",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/compass-4right-path.jpg",
    desc: "Workshop “COMPASS 4RIGHT PATH” ra đời với hy vọng sẽ trở thành chiếc “la bàn” giúp các bạn có cơ hội được chia sẻ những điều trăn trở, khó nói bấy lâu, cũng như lắng nghe kiến thức, kinh nghiệm và trải nghiệm từ các vị diễn giả uy tín.",
    delay: 0.3,
  },
  {
    id: 3,
    title: "Thiêu Đường Tỏ Lối ",
    category: "Talkshow",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/theu-duong-to-loi.jpg",
    desc: "workshop “THÊU ĐƯỜNG TỎ LỐI” được tổ chức với hy vọng sẽ định hướng các bạn tân sinh viên thêu dệt nên con đường đúng đắn cho bản thân mình với sự góp mặt của những diễn giả vô cùng nổi tiếng có nhiều kinh nghiệm, trải nghiệm và kiến thức.",
    delay: 0.5,
  },
];

export const ALL_PROJECTS: Project[] = [
  ...MOCK_PROJECTS,
  {
    id: 4,
    title: "Kim Cổ Âm Vang",
    category: "Workshop",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/kim-co-am-vang.jpg",
    desc: "BẢN SẮC VIỆT TRONG DÒNG CHẢY HỘI NHẬP.",
    delay: 0.1,
  },
  {
    id: 5,
    title: "Vinci's Arcane",
    category: "Recruitment",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/vincis-arcane.jpg",
    desc: "Lấy cảm hứng từ kiệt tác 𝐓𝐡𝐞 𝐃𝐚 𝐕𝐢𝐧𝐜𝐢 𝐂𝐨𝐝𝐞 của Dan Brown",
    delay: 0.2,
  },
  {
    id: 6,
    title: "NEU Debate Open 2024",
    category: "Competition",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    desc: "Lấy ý tưởng từ bộ truyện kinh điển “Alice's adventures in wonderland” ",
    delay: 0.3,
  },
  {
    id: 7,
    title: "NEU Debate Open 2023",
    category: "Competition",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2023.jpg",
    desc: "NDO 2023 lấy cảm hứng từ bộ phim điện ảnh “The Greatest Showman” hay còn được biết tới với tên tiếng việt là “Bậc thầy của những ước mơ”.",
    delay: 0.4,
  },
  {
    id: 8,
    title: "NEU Debate Open 2022",
    category: "Competition",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2022.jpg",
    desc: "Giống như những cơn mưa sao băng hiếm khi xuất hiện, hiếm khi có người được chiêm ngưỡng.",
    delay: 0.5,
  },
];
