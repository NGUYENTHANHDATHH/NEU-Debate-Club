import React from "react";
import { motion } from "motion/react";
import { Trophy, Target, Users, Star } from "lucide-react";

export const Achievements = () => {
  const stats = [
    {
      id: 1,
      icon: <Trophy className="w-8 h-8" />,
      value: "50+",
      label: "Giải Thưởng",
    },
    {
      id: 2,
      icon: <Target className="w-8 h-8" />,
      value: "100+",
      label: "Dự Án",
    },
    {
      id: 3,
      icon: <Users className="w-8 h-8" />,
      value: "500+",
      label: "Thành Viên",
    },
    {
      id: 4,
      icon: <Star className="w-8 h-8" />,
      value: "10+",
      label: "Năm Hoạt Động",
    },
  ];

  return (
    <section
      id="achievements"
      className="py-24 bg-white dark:bg-black text-black dark:text-white border-t border-gray-200 dark:border-[#111] transition-colors duration-500 relative overflow-hidden"
    >
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#8A151B] opacity-5 dark:opacity-10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="uppercase tracking-[0.3em] text-[#8A151B] text-sm font-semibold mb-4 block font-['Montserrat']">
            Cột Mốc Tự Hào
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-['Montserrat'] mb-6">
            Thành Tựu Nổi Bật
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-['Inter'] max-w-2xl mx-auto">
            Hành trình không ngừng nỗ lực và phát triển, những con số biết nói
            minh chứng cho sự cống hiến và nhiệt huyết của cộng đồng.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#222] hover:border-[#8A151B]/50 dark:hover:border-[#8A151B]/50 transition-colors group relative overflow-hidden shadow-sm hover:shadow-lg dark:shadow-none"
            >
              {/* Hover highlight line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8A151B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
      </div>
    </section>
  );
};
