"use client";

/* eslint-disable @next/next/no-img-element -- catalog images are CMS-configured URLs. */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { routePath } from "@/constants/routes";
import { useLanguage } from "@/provider/LanguageProvider";
import { CmsCatalogItem, fetchPublicCatalog } from "@/lib/api";

const ITEMS_PER_PAGE = 6;

export default function AllProjects() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<CmsCatalogItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPublicCatalog("projects").then(setProjects).catch(console.error);
  }, []);

  const totalPages = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE));
  const currentProjects = projects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto min-h-screen">
      <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-5xl font-bold font-['Montserrat'] mb-4 text-black dark:text-white">{t("projects.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 font-['Inter']">{t("projects.desc")}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {currentProjects.map((project, index) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="group cursor-pointer relative">
            <Link href={routePath.projectDetail(project.slug)} className="absolute inset-0 z-40" aria-label={`View project ${project.title}`} />
            <div className="overflow-hidden aspect-4/3 mb-6 relative rounded-sm bg-gray-200 dark:bg-[#111]">
              {project.imageUrl && <img src={project.imageUrl} alt={project.imageAlt || project.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />}
              <div className="absolute inset-0 bg-[#8A151B]/10 dark:bg-[#8A151B]/20 opacity-0 group-hover:opacity-100 mix-blend-color z-20 transition-opacity duration-500" />
            </div>
            <div>
              <p className="text-[#8A151B] font-semibold text-xs uppercase tracking-widest mb-3 font-['Montserrat']">{project.category}</p>
              <h3 className="text-xl font-bold font-['Montserrat'] mb-4 text-black dark:text-white group-hover:text-[#8A151B] transition-colors">{project.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 font-light font-['Inter'] text-sm leading-relaxed line-clamp-2">{project.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {projects.length > ITEMS_PER_PAGE && (
        <div className="mt-20 flex items-center justify-center gap-4">
          <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="p-2 border border-gray-300 dark:border-[#333] text-black dark:text-white rounded-full disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-['Montserrat'] font-semibold text-black dark:text-white">Trang {currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="p-2 border border-gray-300 dark:border-[#333] text-black dark:text-white rounded-full disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );
}
