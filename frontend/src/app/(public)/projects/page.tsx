"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ALL_PROJECTS } from "@/constants/projects";
import { routePath } from "@/constants/routes";
import Image from "next/image";

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
              href={routePath.projectDetail(project.id)}
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
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 "
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
              <p className="text-gray-600 dark:text-gray-400 font-light font-['Inter'] text-sm leading-relaxed line-clamp-2">
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
