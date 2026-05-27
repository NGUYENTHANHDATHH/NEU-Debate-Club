import React from "react";
import { motion } from "motion/react";
import {
  Trophy,
  Target,
  Users,
  Star,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/provider/LanguageProvider";
import Link from "next/link";
import Image from "next/image";

export const Achievements = () => {
  const { t } = useLanguage();
  const stats = [
    {
      id: 1,
      icon: <Trophy className="w-8 h-8" />,
      value: "50+",
      label: t("achievements.reward"),
    },
    {
      id: 2,
      icon: <Target className="w-8 h-8" />,
      value: "100+",
      label: t("achievements.event"),
    },
    {
      id: 3,
      icon: <Users className="w-8 h-8" />,
      value: "500+",
      label: t("achievements.member"),
    },
    {
      id: 4,
      icon: <Star className="w-8 h-8" />,
      value: "10+",
      label: t("achievements.established"),
    },
  ];
  const MOCK_ACHIEVEMENTS = [
    {
      id: 1,
      title: "CLB Xuất Sắc Nhất NEU 2025",
      category: "Giải Thưởng",
      date: "Tháng 12, 2025",
      image:
        "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
      desc: "Đạt danh hiệu Top 1 câu lạc bộ sinh viên tiêu biểu có ảnh hưởng nhất khối Đại học Kinh tế Quốc dân nhờ các hoạt động sôi nổi và đóng góp tích cực cho cộng đồng sinh viên.",
      delay: 0.1,
    },
    {
      id: 2,
      title: "Quán Quân VUDC 2024",
      category: "Thành Tích Thi Đấu",
      date: "Tháng 8, 2024",
      image:
        "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
      desc: "Đội tuyển Cogito xuất sắc vượt qua hơn 60 đội thi từ khắp cả nước để lên ngôi Vô địch Giải Tranh biện Sinh viên Toàn quốc (Vietnam Universities Debating Championship).",
      delay: 0.3,
    },
    {
      id: 3,
      title: "Cột mốc 100.000 Followers",
      category: "Truyền Thông",
      date: "Tháng 3, 2025",
      image:
        "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2025.jpg",
      desc: "Chính thức cán mốc 100.000 người theo dõi trên Fanpage, trở thành một trong những Fanpage học thuật và kỹ năng có sức ảnh hưởng lớn nhất trong giới sinh viên.",
      delay: 0.5,
    },
  ];

  return (
    <section
      id="achievements"
      className="py-24 md:py-32 bg-white dark:bg-[#050505] text-black dark:text-white border-t border-gray-200 dark:border-[#111] transition-colors duration-500 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-150 h-150 bg-linear-to-bl from-[#8A151B]/5 dark:from-[#8A151B]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-linear-to-tr from-amber-500/5 dark:from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* STATS SECTION */}

        {/* HIGHLIGHTED ACHIEVEMENTS SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="flex items-center gap-2 uppercase tracking-widest text-[#8A151B] text-sm font-semibold mb-3 font-['Montserrat']">
              <Sparkles className="w-4 h-4" /> {t("achievements.chapter")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-['Montserrat']">
              {t("achievements.title")}
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-['Inter'] max-w-xl">
              {t("achievements.desc")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/achievements"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors font-['Inter'] group pb-2 border-b border-transparent hover:border-[#8A151B]"
            >
              {t("achievements.viewAll")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gray-50/50 dark:bg-[#0A0A0A]/50 border border-gray-100 dark:border-[#222] backdrop-blur-sm transition-colors group relative overflow-hidden"
              >
                <div className="text-[#8A151B] mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold font-['Montserrat'] text-black dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium font-['Inter'] text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_ACHIEVEMENTS.map((achievement, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: achievement.delay }}
              className="relative group rounded-3xl overflow-hidden h-120 flex flex-col shadow-lg hover:shadow-2xl transition-all duration-500 cursor-default"
            >
              {/* Background Image Container */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={achievement.image}
                  alt={achievement.title}
                  fill
                  className="object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out filter brightness-90 group-hover:brightness-100"
                />
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/50 to-black/10 z-10 transition-colors duration-500" />
                {/* Additional color tint on hover */}
                <div className="absolute inset-0 bg-[#8A151B]/0 group-hover:bg-[#8A151B]/10 transition-colors duration-500 mix-blend-color z-10" />
              </div>

              {/* Card Content Overlay */}
              <div className="relative z-20 flex-1 flex flex-col p-8 h-full">
                {/* Top Info */}
                <div className="flex items-start mb-6">
                  <span className="text-xs font-bold px-3.5 py-1.5 bg-black/30 backdrop-blur-md text-white/90 rounded-full font-['Montserrat'] border border-white/10 shadow-sm">
                    {achievement.date}
                  </span>
                </div>

                {/* Bottom Text Info */}
                <div className="mt-auto transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                  <p className="text-white/80 font-semibold text-xs uppercase tracking-widest mb-3 font-['Montserrat'] flex items-center gap-2">
                    <span className="w-8 h-0.5 bg-amber-400 inline-block rounded-full"></span>
                    {achievement.category}
                  </p>
                  <h3 className="text-2xl lg:text-3xl font-bold font-['Montserrat'] mb-4 text-white group-hover:text-amber-400 transition-colors leading-tight drop-shadow-md">
                    {achievement.title}
                  </h3>
                  <p className="text-gray-300 font-light font-['Inter'] text-sm leading-relaxed transition-colors opacity-90 group-hover:opacity-100 line-clamp-3 md:line-clamp-4">
                    {achievement.desc}
                  </p>
                </div>
              </div>

              {/* Hover bottom line indicator */}
              <div className="absolute bottom-0 left-0 w-0 h-1.5 bg-amber-500 group-hover:w-full transition-all duration-700 ease-out z-30" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
