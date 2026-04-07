import React from "react";
import { useParams, Navigate, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { ALL_PROJECTS } from "@/app/(public)/projects/page";
import Image from "next/image";

export const ProjectDetail = () => {
  const { id } = useParams();

  const project = ALL_PROJECTS.find((p) => p.id === parseInt(id || "0", 10));

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <article className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-32 transition-colors duration-500">
      {/* Hero Banner */}
      <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-10" />
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-white/80 text-xs font-semibold uppercase tracking-widest mb-6 font-['Montserrat'] backdrop-blur-md">
              {project.category}
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-['Montserrat'] text-white mb-6 drop-shadow-lg leading-tight">
              {project.title}
            </h1>
          </motion.div>
        </div>

        {/* Decorative fade bottom */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white dark:from-black to-transparent z-20" />
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 -mt-10 relative z-30">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold font-['Montserrat'] text-gray-500 hover:text-[#8A151B] dark:hover:text-[#8A151B] mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> TRỞ VỀ DANH SÁCH
        </Link>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-6 mb-12 py-6 border-y border-gray-200 dark:border-[#222]">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-['Inter'] text-sm">
            <Calendar className="w-4 h-4 text-[#8A151B]" />
            <span>Tháng 10, 2025</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-['Inter'] text-sm">
            <User className="w-4 h-4 text-[#8A151B]" />
            <span>Ban Tổ Chức NDC</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-['Inter'] text-sm">
            <Tag className="w-4 h-4 text-[#8A151B]" />
            <span>{project.category}</span>
          </div>
        </div>

        {/* Blog content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-none font-['Inter'] text-lg text-gray-700 dark:text-gray-300 space-y-6"
        >
          <p className="text-xl md:text-2xl font-light text-black dark:text-white leading-relaxed mb-10 border-l-4 border-[#8A151B] pl-6 italic">
            {project.desc}
          </p>

          <h2 className="text-3xl font-bold font-['Montserrat'] text-black dark:text-white mt-12 mb-6">
            Bối Cảnh & Tầm Nhìn
          </h2>
          <p className="leading-relaxed">
            Dự án{" "}
            <strong className="text-black dark:text-white font-semibold">
              {project.title}
            </strong>{" "}
            được ra đời từ khát khao tạo ra một sân chơi trí tuệ đẳng cấp, nơi
            các cá nhân không chỉ tranh luận mà còn cùng nhau kiến tạo những giá
            trị mới. Chúng tôi tin rằng tư duy phản biện là vũ khí sắc bén nhất
            để đương đầu với những thách thức của kỷ nguyên hiện đại.
          </p>
          <p className="leading-relaxed">
            Trải qua nhiều vòng tuyển chọn và chuẩn bị gắt gao, chuỗi hoạt động
            của dự án đã vượt xa mong đợi ban đầu, thu hút hàng ngàn người theo
            dõi và tham gia trực tiếp.
          </p>

          <div className="my-12 p-8 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#222] rounded-sm">
            <h3 className="text-xl font-bold font-['Montserrat'] text-black dark:text-white mb-4">
              Điểm Nhấn Nổi Bật
            </h3>
            <ul className="space-y-4 font-['Inter'] text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#8A151B] font-bold">01.</span> Thu hút
                hơn 1,000 sinh viên tham gia trải nghiệm và thi đấu.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#8A151B] font-bold">02.</span> Hợp tác
                với 15+ đơn vị báo chí, truyền thông và nhà tài trợ.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#8A151B] font-bold">03.</span> Nhận được
                đánh giá chuyên môn cực kỳ cao từ hội đồng chuyên gia.
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold font-['Montserrat'] text-black dark:text-white mt-12 mb-6">
            Giá Trị Cốt Lõi
          </h2>
          <p className="leading-relaxed">
            Không chỉ dừng lại ở một sự kiện mang tính phong trào, dự án hướng
            tới việc thiết lập một chuẩn mực mới trong cách thức tổ chức chuyên
            nghiệp. Từ thiết kế hình ảnh, truyền thông đến vận hành thực tế, mỗi
            khâu đều được đảm bảo sự chỉn chu tuyệt đối bởi đội ngũ{" "}
            <strong className="text-black dark:text-white font-semibold">
              NEU Debate Club
            </strong>
            .
          </p>
          <p className="leading-relaxed">
            Sự thành công của {project.title} là minh chứng rõ ràng nhất cho
            triết lý <b>Tư Duy Sắc Bén, Hành Động Chuyên Nghiệp</b> của chúng
            tôi.
          </p>

          {/* Image Gallery Mock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-16">
            <Image
              src={project.image}
              alt="Gallery 1"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-64 object-cover rounded-sm filter grayscale hover:grayscale-0 transition-all duration-700 shadow-md"
            />
            <Image
              src={project.image}
              alt="Gallery 2"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-64 object-cover rounded-sm filter grayscale hover:grayscale-0 transition-all duration-700 scale-x-[-1] shadow-md"
            />
          </div>
        </motion.div>
      </div>
    </article>
  );
};
