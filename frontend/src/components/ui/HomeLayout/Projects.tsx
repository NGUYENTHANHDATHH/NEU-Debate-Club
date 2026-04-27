import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MOCK_PROJECTS } from "@/constants/projects";
import { routePath } from "@/constants/routes";
import { useLanguage } from "@/provider/LanguageProvider";

export const Projects = () => {
  const { t } = useLanguage();

  return (
    <section className="py-32 bg-gray-50 dark:bg-[#050505] text-black dark:text-white px-6 border-t border-gray-200 dark:border-[#111] transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="uppercase tracking-widest text-[#8A151B] text-sm font-semibold mb-2 block font-['Montserrat']">
              The Sum
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-['Montserrat']">
              {t("projects.title")}
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/projects"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors font-['Inter'] group pb-2 border-b border-transparent hover:border-[#8A151B]"
            >
              {t("projects.viewall")}{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {MOCK_PROJECTS.map((project, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: project.delay }}
              className="group cursor-pointer relative"
            >
              <Link
                href={routePath.projectDetail(project.id)}
                className="absolute inset-0 z-40"
                aria-label={`Xem chi tiết dự án ${project.title}`}
              />
              {/* Image Container with Dark Overlay */}
              <div className="overflow-hidden aspect-4/3 mb-6 relative rounded-sm">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/40 group-hover:bg-transparent dark:group-hover:bg-black/10 transition-colors duration-500 z-10" />
                <motion.img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />

                {/* Red Overlay Effect */}
                <div className="absolute inset-0 bg-[#8A151B]/10 dark:bg-[#8A151B]/20 opacity-0 group-hover:opacity-100 mix-blend-color z-20 transition-opacity duration-500" />
              </div>

              <div>
                <p className="text-[#8A151B] font-semibold text-xs uppercase tracking-widest mb-3 font-['Montserrat']">
                  {project.category}
                </p>
                <h3 className="text-2xl font-bold font-['Montserrat'] mb-4 text-black dark:text-white group-hover:text-[#8A151B] dark:group-hover:text-[#8A151B] transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-light font-['Inter'] text-sm leading-relaxed transition-colors line-clamp-2">
                  {project.desc}
                </p>
              </div>

              {/* Decorative line on hover */}
              <div className="absolute top-0 left-0 w-0 h-1 bg-[#8A151B] group-hover:w-full transition-all duration-500 z-30" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
