import { ArrowLeft, Calendar, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/constants/routes";

type Achievement = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  content: string[];
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    slug: "1",
    title: "Vô địch Giải Tranh biện Sinh viên Toàn quốc 2025",
    excerpt:
      "Đội tuyển của NEU Debate Club đã xuất sắc vượt qua hơn 50 đội thi để giành ngôi vị quán quân tại cuộc thi lớn nhất năm.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "15 Tháng 03, 2025",
    category: "Giải Thưởng",
    content: [
      "Chiến thắng này là cột mốc quan trọng, khẳng định năng lực chuyên môn và tinh thần bền bỉ của các thành viên câu lạc bộ.",
      "Trong suốt mùa giải, đội đã thể hiện tư duy phản biện sắc bén, khả năng phối hợp chiến thuật và phong thái thi đấu tự tin.",
    ],
  },
  {
    id: 2,
    slug: "2",
    title: "Giải Cống hiến Phong trào Sinh viên NEU",
    excerpt:
      "Câu lạc bộ vinh dự nhận bằng khen từ Đoàn Thanh niên trường vì những đóng góp tích cực cho phong trào học thuật.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "28 Tháng 02, 2025",
    category: "Vinh Danh",
    content: [
      "Danh hiệu ghi nhận nỗ lực bền bỉ của tập thể trong việc lan toả văn hoá tranh biện và học thuật đến cộng đồng sinh viên.",
      "Các hoạt động đào tạo, workshop và giải đấu nội bộ đã góp phần xây dựng môi trường phát triển toàn diện cho thành viên.",
    ],
  },
  {
    id: 3,
    slug: "3",
    title: "Thành công Workshop 'Nghệ thuật Thuyết phục'",
    excerpt:
      "Hơn 500 sinh viên đã tham dự và nhận được nhiều giá trị từ các diễn giả khách mời hàng đầu về kỹ năng tranh biện.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "10 Tháng 01, 2025",
    category: "Sự Kiện",
    content: [
      "Workshop mang lại góc nhìn thực tế về nghệ thuật lập luận và kỹ năng thuyết phục trong học tập, công việc và cuộc sống.",
      "Phản hồi tích cực từ người tham dự là động lực để câu lạc bộ tiếp tục mở rộng các chương trình chất lượng cao.",
    ],
  },
  {
    id: 4,
    slug: "4",
    title: "Á quân Giải Vô địch Tranh biện Quốc tế V-WSDC",
    excerpt:
      "Đại diện của câu lạc bộ đã có màn thể hiện xuất sắc tại đấu trường quốc tế, mang về thành tích đáng tự hào.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "12 Tháng 12, 2024",
    category: "Giải Thưởng",
    content: [
      "Thành tích á quân tại sân chơi quốc tế là minh chứng rõ nét cho chất lượng đào tạo và khả năng hội nhập của thành viên.",
      "Đội thi đã thể hiện bản lĩnh qua nhiều vòng tranh luận với những đối thủ mạnh đến từ nhiều quốc gia.",
    ],
  },
  {
    id: 5,
    slug: "5",
    title: "Tổ chức thành công Giải đấu N-Debate Mở rộng",
    excerpt:
      "Giải đấu thường niên đã thu hút sự tham gia của các trường đại học lớn trên toàn quốc với chất lượng chuyên môn cao.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "25 Tháng 11, 2024",
    category: "Sự Kiện",
    content: [
      "Giải đấu mở rộng đã tạo nên diễn đàn học thuật sôi nổi, kết nối nhiều đội tranh biện xuất sắc trên cả nước.",
      "Công tác tổ chức chuyên nghiệp giúp nâng cao trải nghiệm cho thí sinh, giám khảo và khán giả theo dõi.",
    ],
  },
  {
    id: 6,
    slug: "6",
    title: "Kỷ niệm 10 năm thành lập câu lạc bộ",
    excerpt:
      "Đêm Gala đầy cảm xúc nhìn lại chặng đường một thập kỷ hình thành và phát triển của Cogito.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "05 Tháng 10, 2024",
    category: "Kỷ Niệm",
    content: [
      "Sự kiện kỷ niệm là dịp để các thế hệ thành viên cùng nhìn lại hành trình phát triển và những dấu mốc đáng nhớ.",
      "Không khí trang trọng và ấm áp của Gala thể hiện tinh thần gắn kết, kế thừa và khát vọng bứt phá.",
    ],
  },
  {
    id: 7,
    slug: "7",
    title: "Thành viên xuất sắc nhất Giải vô địch châu Á",
    excerpt:
      "Cá nhân thành viên chủ chốt đã lọt vào top những người nói tốt nhất tại giải đấu quy mô châu lục.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "15 Tháng 09, 2024",
    category: "Vinh Danh",
    content: [
      "Thành tích cá nhân nổi bật góp phần nâng cao uy tín của câu lạc bộ trong cộng đồng tranh biện khu vực.",
      "Đây là kết quả của quá trình rèn luyện nghiêm túc, tư duy sắc bén và tinh thần cầu tiến không ngừng.",
    ],
  },
];

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AchievementDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const achievement = ACHIEVEMENTS.find(
    (item) => item.slug === slug || String(item.id) === slug,
  );

  if (!achievement) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-white dark:bg-black text-black dark:text-white pt-24 pb-20 transition-colors duration-500">
      <section className="max-w-5xl mx-auto px-6">
        <Link
          href={ROUTES.achievements}
          className="inline-flex items-center gap-2 text-sm font-semibold font-['Montserrat'] text-gray-500 hover:text-[#8A151B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> TRỞ VỀ DANH SÁCH THÀNH TỰU
        </Link>

        <div className="mt-8 relative w-full h-[42vh] md:h-[58vh] overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-black/35 z-10" />
          <Image
            src={achievement.image}
            alt={achievement.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10">
            <span className="w-fit bg-[#8A151B] text-white text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full">
              {achievement.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white font-['Montserrat'] mt-4 leading-tight max-w-4xl">
              {achievement.title}
            </h1>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 border-y border-gray-200 dark:border-[#222] py-5">
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8A151B]" />
            {achievement.date}
          </span>
          <span className="inline-flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#8A151B]" />
            {achievement.category}
          </span>
        </div>

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-gray-700 dark:text-gray-300 font-['Inter']">
          <p className="text-xl md:text-2xl font-light text-black dark:text-white border-l-4 border-[#8A151B] pl-5 italic">
            {achievement.excerpt}
          </p>
          {achievement.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </article>
  );
}
