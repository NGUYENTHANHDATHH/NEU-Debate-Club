import React from "react";
import { motion } from "motion/react";
import { Triangle, Hexagon, Circle, Square, ArrowRight } from "lucide-react";
import Link from "next/link";

export const DEPARTMENTS = [
  {
    id: "truyen-thong",
    title: "Truyền Thông",
    desc: "Khuếch đại tiếng nói của tổ chức qua lăng kính sáng tạo. Quản lý hình ảnh và lan tỏa thông điệp mạnh mẽ.",
    icon: Triangle,
    delay: 0.1,
  },
  {
    id: "doi-ngoai",
    title: "Đối Ngoại",
    desc: "Cầu nối chiến lược. Xây dựng và duy trì mạng lưới đối tác, tài trợ, kiến tạo các cơ hội hợp tác giá trị.",
    icon: Hexagon,
    delay: 0.2,
  },
  {
    id: "su-kien",
    title: "Sự Kiện",
    desc: "Biến ý tưởng thành hiện thực. Đạo diễn và tổ chức chuyên nghiệp mọi chương trình quy mô từ nhỏ đến lớn.",
    icon: Circle,
    delay: 0.3,
  },
  {
    id: "chuyen-mon",
    title: "Chuyên Môn",
    desc: "Cốt lõi trí tuệ. Nghiên cứu, đào tạo và định hướng phát triển kiến thức chuyên sâu cho toàn bộ thành viên.",
    icon: Square,
    delay: 0.4,
  },
];

export const Departments = () => {
  return (
    <section className="py-32 bg-white dark:bg-black text-black dark:text-white px-6 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <span className="uppercase tracking-widest text-[#8A151B] text-sm font-semibold mb-2 block font-['Montserrat']">
            Cơ Cấu Hoạt Động
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-['Montserrat']">
            Nền Tảng Của Hành Động
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {DEPARTMENTS.map((dept, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: dept.delay }}
              className="group relative border border-gray-200 dark:border-[#222] p-8 hover:border-[#8A151B] dark:hover:border-[#8A151B] transition-colors duration-500 bg-gray-50 dark:bg-[#080808] hover:bg-red-50 dark:hover:bg-[#110505] overflow-hidden rounded-sm"
            >
              <Link
                href={`/departments/${dept.id}`}
                className="absolute inset-0 z-20"
                aria-label={`Xem chi tiết ban ${dept.title}`}
              />

              {/* Background Geometric Hover Effect */}
              <div className="absolute -inset-10 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 bg-[linear-gradient(45deg,transparent_25%,rgba(138,21,27,1)_50%,transparent_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,1)_50%,transparent_75%)] bg-size-[10px_10px]" />

              <div className="relative z-10 pointer-events-none">
                <div className="w-16 h-16 rounded-full border border-gray-300 dark:border-[#333] group-hover:border-[#8A151B] dark:group-hover:border-[#8A151B] flex items-center justify-center mb-8 transition-colors duration-300 bg-white dark:bg-transparent">
                  <dept.icon className="w-8 h-8 text-gray-700 dark:text-white group-hover:text-[#8A151B] dark:group-hover:text-[#8A151B] transition-colors" />
                </div>
                <h3 className="text-2xl font-bold font-['Montserrat'] mb-4 text-black dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                  {dept.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-['Inter'] font-light leading-relaxed transition-colors">
                  {dept.desc}
                </p>
                <div className="mt-6 flex items-center gap-2 text-[#8A151B] text-sm font-semibold opacity-0 group-hover:opacity-100 transform -translate-x-2.5 group-hover:translate-x-0 transition-all duration-300">
                  Khám phá <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
