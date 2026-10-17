"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Search, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] dark:bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-['Inter']">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#8A151B]/10 dark:bg-[#8A151B]/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-2xl w-full text-center relative z-10 flex flex-col items-center">
        {/* Animated Error Code */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mb-8 flex justify-center items-center"
        >
          <div className="text-[150px] md:text-[200px] font-extrabold font-['Montserrat'] tracking-tighter select-none drop-shadow-sm leading-none flex justify-center">
            <span className="relative z-30 bg-clip-text bg-gradient-to-br text-[#8A151B]">
              4
            </span>
            <span className="relative z-10 bg-clip-text bg-gradient-to-br text-[#8A151B]">
              0
            </span>
            <span className="relative z-10 bg-clip-text bg-gradient-to-br text-[#8A151B] ">
              4
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {!imgError ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  type: "spring",
                }}
                src="/logo.png"
                alt="404 Illustration"
                className="w-32 h-32 md:w-50 md:h-50 object-contain drop-shadow-2xl"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex items-center justify-center bg-white dark:bg-[#111] p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-white/10 rotate-12">
                <AlertTriangle className="w-16 h-16 text-amber-500 drop-shadow-sm" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-3 mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-['Montserrat'] tracking-tight">
            Ôi không! Lạc đường mất rồi.
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời
            không thể truy cập. Hãy kiểm tra lại đường dẫn nhé!
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all shadow-sm border border-slate-200 dark:border-white/10 hover:-translate-y-0.5 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            Quay lại trang trước
          </button>
        </motion.div>

        {/* Footer hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>
            Bạn cần hỗ trợ?{" "}
            <Link
              href="/projects"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Khám phá các dự án
            </Link>{" "}
            của chúng tôi.
          </span>
        </motion.div>
      </div>
    </div>
  );
}
