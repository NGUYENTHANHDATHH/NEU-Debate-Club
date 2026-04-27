import React from "react";
import { motion } from "motion/react";
import VisionBg from "@/../public/vision-bg.jpg";
import Image from "next/image";
import { useLanguage } from "@/provider/LanguageProvider";

export const Vision = () => {
  const bgImageUrl = VisionBg.src; // Assuming VisionBg is imported as a static asset
  const { t } = useLanguage();
  return (
    <section className="relative py-32 bg-gray-50 dark:bg-[#050505] text-black dark:text-white overflow-hidden flex flex-col items-center border-t border-b border-gray-200 dark:border-[#111] transition-colors duration-500">
      {/* Looping Background Images */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10 dark:opacity-15 flex">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 40,
          }}
          className="flex whitespace-nowrap h-full w-max"
        >
          {/* We use 10 images (2 sets of 5) to create a seamless infinite loop effect */}
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="relative h-full w-auto object-cover min-w-[300px] sm:min-w-[400px] md:min-w-[500px]"
            >
              <Image
                src={bgImageUrl}
                alt="Vision Background Loop"
                fill
                sizes="(max-width: 640px) 300px, (max-width: 768px) 400px, 500px"
                className="object-cover grayscale mix-blend-overlay"
              />
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#8A151B] opacity-5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8A151B] opacity-5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen z-0" />

      <div className="max-w-4xl mx-auto px-6 text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="uppercase tracking-[0.3em] text-[#8A151B] text-sm font-semibold mb-4 block font-['Montserrat']">
            The Cogito
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-['Montserrat'] mb-10 leading-tight">
            {t("vision.title.title1")}, <br className="hidden md:block" />{" "}
            {t("vision.title.title2")}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative inline-block"
        >
          {/* Neon Corner Brackets */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-[#8A151B] opacity-30 dark:opacity-50 dark:shadow-[0_0_10px_#8A151B]" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-[#8A151B] opacity-30 dark:opacity-50 dark:shadow-[0_0_10px_#8A151B]" />

          <p className="text-gray-700 dark:text-gray-400 text-lg md:text-xl font-light font-['Inter'] leading-relaxed max-w-3xl mx-auto py-8 px-4 transition-colors duration-500">
            {t("vision.desc")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
