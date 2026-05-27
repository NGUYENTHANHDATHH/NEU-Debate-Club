"use client";

import React from "react";
import { useParams, notFound } from "next/navigation";
import { motion } from "motion/react";
import { Triangle, Hexagon, Circle, Square } from "lucide-react";
import { useLanguage } from "@/provider/LanguageProvider";

export default function DepartmentDetail() {
  const { t } = useLanguage();
  const DEPARTMENTS = [
    {
      id: "truyen-thong",
      name: t("departments.detail.media.name"),
      title: t("departments.detail.media.title"),
      desc: t("departments.detail.media.desc"),
      works: t("departments.detail.media.works"),
      icon: Triangle,
      delay: 0.1,
    },
    {
      id: "doi-ngoai",
      name: t("departments.detail.external.name"),
      title: t("departments.detail.external.title"),
      desc: t("departments.detail.external.desc"),
      works: t("departments.detail.external.works"),
      icon: Hexagon,
      delay: 0.2,
    },
    {
      id: "su-kien",
      name: t("departments.detail.event.name"),
      title: t("departments.detail.event.title"),
      desc: t("departments.detail.event.desc"),
      works: t("departments.detail.event.works"),
      icon: Circle,
      delay: 0.3,
    },
    {
      id: "chuyen-mon",
      name: t("departments.detail.academics.name"),
      title: t("departments.detail.academics.title"),
      desc: t("departments.detail.academics.desc"),
      works: t("departments.detail.academics.works"),
      icon: Square,
      delay: 0.4,
    },
  ];

  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const department = DEPARTMENTS.find((d) => d.id === slug);

  if (!department) {
    notFound();
  }
  const Icon = department.icon;
  return (
    <div className="py-32 px-6 max-w-4xl mx-auto min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 rounded-full border-2 border-[#8A151B] flex items-center justify-center mb-8 bg-gray-50 dark:bg-[#111]">
          <Icon className="w-12 h-12 text-[#8A151B]" />
        </div>

        <span className="uppercase tracking-widest text-[#8A151B] text-sm font-semibold mb-4 block font-['Montserrat']">
          {department.name}
        </span>
        <h1 className="text-4xl md:text-3xl font-bold font-['Montserrat'] mb-10 text-black dark:text-white">
          &quot;{department.title}&quot;
        </h1>

        <div className="w-full h-px bg-linear-to-r from-transparent via-gray-300 dark:via-[#333] to-transparent mb-10" />

        <div className="text-left bg-gray-50 dark:bg-[#0A0A0A] p-10 border border-gray-200 dark:border-[#222] rounded-sm w-full">
          <h2 className="text-2xl font-bold font-['Montserrat'] mb-6 text-black dark:text-white border-l-4 border-[#8A151B] pl-4">
            {t("departments.title")}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 font-['Inter'] text-lg leading-relaxed mb-8">
            {department.desc}
          </p>

          <h2 className="text-2xl font-bold font-['Montserrat'] mb-6 text-black dark:text-white border-l-4 border-[#8A151B] pl-4">
            {t("departments.work")}
          </h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 font-['Inter'] space-y-4 ml-4">
            {department.works.map((work: string, index: number) => (
              <li key={index} className="leading-relaxed">
                {work}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
