"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { Link } from "react-router";

// Dữ liệu mock cho các bài blog thành tựu
const ALL_POSTS = [
  {
    id: 1,
    title: "Vô địch Giải Tranh biện Sinh viên Toàn quốc 2025",
    excerpt:
      "Đội tuyển của NEU Debate Club đã xuất sắc vượt qua hơn 50 đội thi để giành ngôi vị quán quân tại cuộc thi lớn nhất năm.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "15 Tháng 03, 2025",
    category: "Giải Thưởng",
  },
  {
    id: 2,
    title: "Giải Cống hiến Phong trào Sinh viên NEU",
    excerpt:
      "Câu lạc bộ vinh dự nhận bằng khen từ Đoàn Thanh niên trường vì những đóng góp tích cực cho phong trào học thuật.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "28 Tháng 02, 2025",
    category: "Vinh Danh",
  },
  {
    id: 3,
    title: "Thành công Workshop 'Nghệ thuật Thuyết phục'",
    excerpt:
      "Hơn 500 sinh viên đã tham dự và nhận được nhiều giá trị từ các diễn giả khách mời hàng đầu về kỹ năng tranh biện.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "10 Tháng 01, 2025",
    category: "Sự Kiện",
  },
  {
    id: 4,
    title: "Á quân Giải Vô địch Tranh biện Quốc tế V-WSDC",
    excerpt:
      "Đại diện của câu lạc bộ đã có màn thể hiện xuất sắc tại đấu trường quốc tế, mang về thành tích đáng tự hào.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "12 Tháng 12, 2024",
    category: "Giải Thưởng",
  },
  {
    id: 5,
    title: "Tổ chức thành công Giải đấu N-Debate Mở rộng",
    excerpt:
      "Giải đấu thường niên đã thu hút sự tham gia của các trường đại học lớn trên toàn quốc với chất lượng chuyên môn cao.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "25 Tháng 11, 2024",
    category: "Sự Kiện",
  },
  {
    id: 6,
    title: "Kỷ niệm 10 năm thành lập câu lạc bộ",
    excerpt:
      "Đêm Gala đầy cảm xúc nhìn lại chặng đường một thập kỷ hình thành và phát triển của Cogito.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "05 Tháng 10, 2024",
    category: "Kỷ Niệm",
  },
  {
    id: 7,
    title: "Thành viên xuất sắc nhất Giải vô địch châu Á",
    excerpt:
      "Cá nhân thành viên chủ chốt đã lọt vào top những người nói tốt nhất tại giải đấu quy mô châu lục.",
    image:
      "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    date: "15 Tháng 09, 2024",
    category: "Vinh Danh",
  },
];

const POSTS_PER_PAGE = 3;

export default function AchievementsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(ALL_POSTS.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = ALL_POSTS.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pt-24 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-500">
      {/* Header Section */}
      <section className="py-20 bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#111]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Trophy className="w-12 h-12 text-[#8A151B] mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold font-['Montserrat'] mb-6">
              Góc Thành Tựu
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-['Inter'] max-w-2xl mx-auto text-lg">
              Cùng nhìn lại những dấu ấn, giải thưởng và sự kiện nổi bật trên
              hành trình phát triển của NEU Debate Club qua các bài viết chi
              tiết.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog List Section */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col gap-12">
            {currentPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex flex-col md:flex-row gap-8 bg-gray-50 dark:bg-[#0A0A0A] p-6 rounded-2xl border border-gray-100 dark:border-[#222] hover:border-[#8A151B]/50 dark:hover:border-[#8A151B]/50 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none"
              >
                <div className="w-full md:w-2/5 overflow-hidden rounded-xl h-64 md:h-auto shrink-0 relative">
                  <div className="absolute top-4 left-4 z-10 bg-[#8A151B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {post.category}
                  </div>
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                </div>

                <div className="w-full md:w-3/5 flex flex-col justify-center py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 font-['Inter']">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-['Montserrat'] mb-4 group-hover:text-[#8A151B] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 font-['Inter'] mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center gap-2 font-['Montserrat'] font-semibold text-[#8A151B] group/btn cursor-pointer w-fit">
                    Đọc tiếp
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-16 flex items-center justify-center gap-4"
            >
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-3 rounded-full border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#8A151B] hover:text-[#8A151B] transition-colors"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageClick(i + 1)}
                    className={`w-10 h-10 rounded-full font-['Montserrat'] font-semibold transition-colors flex items-center justify-center
                      ${
                        currentPage === i + 1
                          ? "bg-[#8A151B] text-white"
                          : "bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-3 rounded-full border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#8A151B] hover:text-[#8A151B] transition-colors"
                aria-label="Trang tiếp"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
