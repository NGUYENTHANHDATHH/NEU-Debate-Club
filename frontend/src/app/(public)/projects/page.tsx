"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MOCK_PROJECTS } from "@/components/ui/HomeLayout/Projects";
import Image from "next/image";

// Sinh thêm dữ liệu giả để biểu diễn phân trang
export const ALL_PROJECTS = [
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

export default function AllProjects() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(ALL_PROJECTS.length / itemsPerPage);

  const currentProjects = ALL_PROJECTS.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto min-h-screen">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold font-['Montserrat'] mb-4 text-black dark:text-white">
          Tất Cả Dự Án
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-['Inter']">
          Khám phá những dấu ấn nổi bật của NEU Debate Club qua từng năm tháng.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {currentProjects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group cursor-pointer relative"
          >
            <Link
              href={`/project/${project.id}`}
              className="absolute inset-0 z-40"
              aria-label={`Xem chi tiết dự án ${project.title}`}
            />
            <div className="overflow-hidden aspect-4/3 mb-6 relative rounded-sm">
              <div className="absolute inset-0 bg-black/10 dark:bg-black/40 group-hover:bg-transparent dark:group-hover:bg-black/10 transition-colors duration-500 z-10" />
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 filter grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-[#8A151B]/10 dark:bg-[#8A151B]/20 opacity-0 group-hover:opacity-100 mix-blend-color z-20 transition-opacity duration-500" />
            </div>

            <div>
              <p className="text-[#8A151B] font-semibold text-xs uppercase tracking-widest mb-3 font-['Montserrat']">
                {project.category}
              </p>
              <h3 className="text-xl font-bold font-['Montserrat'] mb-4 text-black dark:text-white group-hover:text-[#8A151B] dark:group-hover:text-[#8A151B] transition-colors">
                {project.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-light font-['Inter'] text-sm leading-relaxed">
                {project.desc}
              </p>
            </div>
            <div className="absolute top-0 left-0 w-0 h-1 bg-[#8A151B] group-hover:w-full transition-all duration-500 z-30" />
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-20 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 dark:border-[#333] text-black dark:text-white rounded-full disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-['Montserrat'] font-semibold text-black dark:text-white">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 dark:border-[#333] text-black dark:text-white rounded-full disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
