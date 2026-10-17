"use client";

/* eslint-disable @next/next/no-img-element -- catalog images are CMS-configured URLs. */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/provider/LanguageProvider";
import { CmsCatalogItem, fetchPublicCatalog } from "@/lib/api";

const POSTS_PER_PAGE = 3;

export default function AchievementsPage() {
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState<CmsCatalogItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPublicCatalog("achievements").then(setAchievements).catch(console.error);
  }, []);

  const totalPages = Math.max(1, Math.ceil(achievements.length / POSTS_PER_PAGE));
  const currentItems = achievements.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  return (
    <div className="pt-24 min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <section className="py-20 bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#111]"><div className="max-w-7xl mx-auto px-6 text-center"><Trophy className="w-12 h-12 text-[#8A151B] mx-auto mb-6" /><h1 className="text-4xl md:text-6xl font-bold font-['Montserrat'] mb-6">{t("achievements.title")}</h1><p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">{t("achievements.desc")}</p></div></section>
      <section className="py-20"><div className="max-w-5xl mx-auto px-6 flex flex-col gap-12">
        {currentItems.map((achievement, index) => (
          <motion.article key={achievement.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="group flex flex-col md:flex-row gap-8 bg-gray-50 dark:bg-[#0A0A0A] p-6 rounded-2xl border border-gray-100 dark:border-[#222]">
            <Link href={`/achievements/${achievement.slug}`} className="flex w-full flex-col gap-8 md:flex-row">
              <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-xl md:w-2/5 bg-gray-200 dark:bg-[#111]">
                {achievement.imageUrl && <img src={achievement.imageUrl} alt={achievement.imageAlt || achievement.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                <div className="absolute top-4 left-4 bg-[#8A151B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">{achievement.category}</div>
              </div>
              <div className="w-full md:w-3/5 flex flex-col justify-center py-2"><h2 className="text-2xl md:text-3xl font-bold font-['Montserrat'] mb-4 group-hover:text-[#8A151B]">{achievement.title}</h2><p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">{achievement.description}</p><span className="inline-flex items-center gap-2 font-semibold text-[#8A151B]">Read more <ArrowRight className="w-4 h-4" /></span></div>
            </Link>
          </motion.article>
        ))}
      </div>
      {achievements.length > POSTS_PER_PAGE && <div className="mt-16 flex items-center justify-center gap-4"><button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="p-3 rounded-full border disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button><span>{currentPage} / {totalPages}</span><button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="p-3 rounded-full border disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button></div>}
      </section>
    </div>
  );
}
