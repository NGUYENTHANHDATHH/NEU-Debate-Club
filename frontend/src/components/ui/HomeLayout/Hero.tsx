import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import clubLogo from "@/../public/logo.png";
import Image from "next/image";
import { useLanguage } from "@/provider/LanguageProvider";

export const Hero = () => {
  const { t } = useLanguage();
  const slogan = "Cogito, ergo sum";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black overflow-hidden font-sans transition-colors duration-500 pt-20">
      {/* Grid Background Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-20 transition-opacity duration-500"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: "4rem 4rem",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-12"
        >
          <Image
            src={clubLogo}
            alt="Club Logo"
            className="w-48 h-48 md:w-64 md:h-64 object-contain filter drop-shadow-[0_0_15px_rgba(138,21,27,0.3)] dark:drop-shadow-[0_0_15px_rgba(138,21,27,0.5)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-black dark:text-white mb-6 tracking-tight transition-colors duration-500"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {slogan.split("").map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.1 }}
                className={char === "," ? "mr-2" : ""}
              >
                {char}
              </motion.span>
            ))}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-1 h-12 md:h-16 bg-[#8A151B] ml-2 align-middle"
            />
          </h1>

          <p
            className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light transition-colors duration-500"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t("history")}
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3 }}
          className="group relative flex items-center justify-center gap-3 bg-[#8A151B] hover:bg-black dark:hover:bg-white text-white dark:hover:text-black font-semibold text-lg py-4 px-10 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(138,21,27,0.4)] hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
          onClick={() => {
            document
              .getElementById("join-form")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span>Liên hệ với chúng tôi</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* Decorative vertical lines */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "8rem" }}
        transition={{ duration: 1.5, delay: 1.5, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-t from-[#8A151B] to-transparent"
      />
    </section>
  );
};
