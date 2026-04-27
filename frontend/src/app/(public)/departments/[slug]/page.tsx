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
      title: t("departments.detail.media.name"),
      desc: t("departments.detail.media.desc"),
      icon: Triangle,
      delay: 0.1,
    },
    {
      id: "doi-ngoai",
      title: t("departments.detail.external.name"),
      desc: t("departments.detail.external.desc"),
      icon: Hexagon,
      delay: 0.2,
    },
    {
      id: "su-kien",
      title: t("departments.detail.event.name"),
      desc: t("departments.detail.event.desc"),
      icon: Circle,
      delay: 0.3,
    },
    {
      id: "chuyen-mon",
      title: t("departments.detail.academics.name"),
      desc: t("departments.detail.academics.desc"),
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
          Ban Chuyên Môn
        </span>
        <h1 className="text-4xl md:text-6xl font-bold font-['Montserrat'] mb-10 text-black dark:text-white">
          {department.title}
        </h1>

        <div className="w-full h-px bg-linear-to-r from-transparent via-gray-300 dark:via-[#333] to-transparent mb-10" />

        <div className="text-left bg-gray-50 dark:bg-[#0A0A0A] p-10 border border-gray-200 dark:border-[#222] rounded-sm w-full">
          <h2 className="text-2xl font-bold font-['Montserrat'] mb-6 text-black dark:text-white border-l-4 border-[#8A151B] pl-4">
            Nhiệm Vụ Cốt Lõi
          </h2>
          <p className="text-gray-700 dark:text-gray-300 font-['Inter'] text-lg leading-relaxed mb-8">
            {department.desc} Tại ban {department.title}, chúng tôi tập trung
            vào việc đẩy mạnh khả năng làm việc nhóm, tư duy logic và kỹ năng
            giải quyết vấn đề thực tế.
          </p>

          <h2 className="text-2xl font-bold font-['Montserrat'] mb-6 text-black dark:text-white border-l-4 border-[#8A151B] pl-4">
            Hoạt Động Tiêu Biểu
          </h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 font-['Inter'] space-y-4 ml-4">
            <li>Lên kế hoạch và thực hiện các dự án theo mảng đảm nhiệm.</li>
            <li>
              Tham gia các buổi workshop nội bộ đào tạo kỹ năng chuyên sâu.
            </li>
            <li>Báo cáo định kỳ và đánh giá hiệu suất (KPIs).</li>
            <li>Hỗ trợ các ban khác trong các sự kiện quy mô lớn của CLB.</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
