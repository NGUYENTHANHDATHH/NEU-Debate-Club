import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, ExternalLink } from "lucide-react";
import clubLogo from "@/../public/logo.png";
import Image from "next/image";

export const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    department: "",
    reason: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted to Google Sheets:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: "", studentId: "", department: "", reason: "" });
  };

  return (
    <section
      id="join-form"
      className="py-32 bg-gray-50 dark:bg-[#050505] text-black dark:text-white px-6 border-t border-gray-200 dark:border-[#111] relative overflow-hidden transition-colors duration-500"
    >
      {/* Background Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-[#8A151B] opacity-[0.02] dark:opacity-[0.03] blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 relative z-10">
        {/* Left Side: Copy */}
        <motion.div
          className="lg:w-1/2 pr-0 lg:pr-12"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <Image
            src={clubLogo}
            alt="Cogito Logo"
            className="w-24 h-24 mb-10 filter drop-shadow-[0_0_10px_rgba(138,21,27,0.1)] dark:drop-shadow-[0_0_10px_rgba(138,21,27,0.3)]"
          />
          <h2 className="text-4xl md:text-5xl font-bold font-['Montserrat'] mb-6 leading-tight text-black dark:text-white transition-colors">
            Sẵn Sàng Để <br />
            <span className="text-[#8A151B]">Tồn Tại?</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-['Inter'] text-lg font-light leading-relaxed mb-10 transition-colors">
            Bạn đang có thắc mắc hay câu hỏi cho NEU Debate Club? Hãy liên hệ
            qua các kênh thông tin sau.
          </p>

          <div className="flex flex-col gap-4 text-gray-600 dark:text-gray-400 font-['Inter'] text-sm mb-12 transition-colors">
            <a
              href="#"
              className="flex items-center gap-2 hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> debate.neu@gmail.com
            </a>
            <a
              href="https://www.facebook.com/NEUDebateClub"
              className="flex items-center gap-2 hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> facebook.com/NEU Debate Club
            </a>
            <a
              href="https://www.tiktok.com/@neudebate.ndc"
              className="flex items-center gap-2 hover:text-[#8A151B] dark:hover:text-[#8A151B] transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> tiktok.com/NEU Debate Club
            </a>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
          className="lg:w-1/2"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white dark:bg-[#0A0A0A] p-10 border border-gray-200 dark:border-[#222] shadow-[0_0_40px_rgba(0,0,0,0.05)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative rounded-sm transition-colors duration-500">
            {/* Top red line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8A151B] to-transparent" />

            <h3 className="text-2xl font-bold font-['Montserrat'] mb-8 text-black dark:text-white transition-colors">
              Đơn Đăng Ký Gia Nhập
            </h3>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-full border-2 border-[#8A151B] flex items-center justify-center mx-auto mb-6 text-[#8A151B]">
                  ✓
                </div>
                <h4 className="text-xl font-bold font-['Montserrat'] mb-2 text-black dark:text-white">
                  Đã Nhận Thông Tin
                </h4>
                <p className="text-gray-600 dark:text-gray-400 font-['Inter']">
                  Chúng tôi sẽ liên hệ với bạn qua email sớm nhất.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 font-['Inter'] font-light"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-500 mb-2 font-['Montserrat'] font-semibold">
                      Họ và Tên
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-gray-50 dark:bg-[#111] border-b border-gray-300 dark:border-[#333] px-0 py-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-700 focus:outline-none focus:border-[#8A151B] transition-colors"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs uppercase text-gray-500 mb-2 font-['Montserrat'] font-semibold">
                      Mã Sinh Viên
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.studentId}
                      onChange={(e) =>
                        setFormData({ ...formData, studentId: e.target.value })
                      }
                      className="w-full bg-gray-50 dark:bg-[#111] border-b border-gray-300 dark:border-[#333] px-0 py-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-700 focus:outline-none focus:border-[#8A151B] transition-colors"
                      placeholder="SV123456"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-2 font-['Montserrat'] font-semibold">
                    Ban Ứng Tuyển
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-[#111] border-b border-gray-300 dark:border-[#333] px-0 py-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#8A151B] transition-colors appearance-none"
                  >
                    <option value="" disabled>
                      -- Chọn Ban --
                    </option>
                    <option value="Truyền Thông">Truyền Thông</option>
                    <option value="Đối Ngoại">Đối Ngoại</option>
                    <option value="Sự Kiện">Sự Kiện</option>
                    <option value="Chuyên Môn">Chuyên Môn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-2 font-['Montserrat'] font-semibold">
                    Lý Do Chọn Cogito?
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-[#111] border-b border-gray-300 dark:border-[#333] px-0 py-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-700 focus:outline-none focus:border-[#8A151B] transition-colors resize-none"
                    placeholder="Ngắn gọn trong 1-2 câu..."
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 flex items-center justify-between w-full bg-black dark:bg-white text-white dark:text-black py-4 px-6 font-bold font-['Montserrat'] uppercase tracking-wider hover:bg-[#8A151B] dark:hover:bg-[#8A151B] hover:text-white dark:hover:text-white transition-all duration-300 group"
                >
                  <span>Gửi Đăng Ký</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto mt-32 pt-8 border-t border-gray-200 dark:border-[#222] text-center text-gray-500 dark:text-gray-600 text-sm font-['Inter'] transition-colors">
        <p>© 2013 NEU Debate Club.</p>
      </div>
    </section>
  );
};
