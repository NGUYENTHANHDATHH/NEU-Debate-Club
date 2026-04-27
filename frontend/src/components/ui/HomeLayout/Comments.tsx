import React from "react";
import { motion } from "motion/react";
import { Quote } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/provider/LanguageProvider";

const TESTIMONIALS = [
  {
    img: "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    quote:
      "NEU Debate Club không chỉ là một câu lạc bộ, mà là một 'lò rèn'. Tại đây, những ý tưởng mơ hồ nhất cũng bị bẻ gãy, mài giũa để trở thành sắc bén.",
    author: "Vũ Việt Anh",
    role: "Trưởng Ban Chuyên Môn (2024)",
    delay: 0.1,
  },
  {
    img: "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    quote:
      "Môi trường ở đây khắc nghiệt nhưng công bằng. Bạn sẽ học được cách bảo vệ luận điểm của mình, đồng thời biết cách lắng nghe để phát triển.",
    author: "Nguyễn Phương Ánh",
    role: "Thành viên Ban Đối Ngoại",
    delay: 0.3,
  },
  {
    img: "https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public/projects/ndo2024.jpg",
    quote:
      "Từ những việc điều phối sự kiện lớn, mọi thứ đều bắt đầu bằng tư duy hệ thống học được tại NEU Debate Club.",
    author: "Tạ Tấn Minh",
    role: "Thành viên Ban Sự Kiện",
    delay: 0.5,
  },
];

export const Comments = () => {
  const { t } = useLanguage();
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
            {t("comments.chapter")}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-['Montserrat']">
            {t("comments.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: testi.delay }}
              className="relative p-10 border border-gray-200 dark:border-[#222] bg-gray-50 dark:bg-[#050505] hover:border-[#8A151B] dark:hover:border-[#8A151B] transition-colors duration-500 group flex flex-col rounded-sm"
            >
              <Quote className="w-10 h-10 text-[#8A151B] opacity-10 dark:opacity-30 group-hover:opacity-100 transition-opacity duration-300 absolute top-6 right-6" />
              <div className="flex-1 mb-8 pt-8 relative z-10">
                <p className="text-gray-700 dark:text-gray-300 font-['Inter'] font-light italic text-lg leading-relaxed transition-colors">
                  "{testi.quote}"
                </p>
              </div>
              <div className="border-t border-gray-200 dark:border-[#222] pt-6 group-hover:border-[#8A151B] dark:group-hover:border-[#8A151B] transition-colors duration-500">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-200 dark:border-[#222] shrink-0">
                    <Image
                      src={testi.img}
                      alt={`Ảnh của ${testi.author}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-black dark:text-white font-bold font-['Montserrat'] mb-1 group-hover:text-[#8A151B] dark:group-hover:text-[#8A151B] transition-colors">
                      {testi.author}
                    </h4>
                    <p className="text-gray-500 text-sm font-['Inter']">
                      {testi.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
