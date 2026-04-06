import React, { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MOCK_PROJECTS } from "@/components/ui/HomeLayout/Projects";

// Sinh thêm dữ liệu giả để biểu diễn phân trang
export const ALL_PROJECTS = [
  ...MOCK_PROJECTS,
  {
    id: 4,
    title: "Kim Cổ Âm Vang",
    category: "Workshop",
    image:
      "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/491916478_1323882503070680_1543966491360129493_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeHOC8S4UPIUIINl2qWJB_XybWOs4VEmrMRtY6zhUSasxJZPSd5bLAhq8UCO36Upoz2IlpDp-a_sSPPpFmQcE9vV&_nc_ohc=irxuBAA3p_MQ7kNvwG4BBRq&_nc_oc=Adpgb9TCzyK0u-HHgnCjOKuBfs6whCxIo1C9mdgHPQe0t0TKSQorUHXuqZw-EX-bnQ8&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=EwXXyc3pS5EBYHov-GCVyg&_nc_ss=7a32e&oh=00_Afy0YeK_03RiyYnTda5JIFEfiDBeyUZqPMhZMZ-iM5_FIQ&oe=69C8D10F",
    desc: "BẢN SẮC VIỆT TRONG DÒNG CHẢY HỘI NHẬP.",
    delay: 0.1,
  },
  {
    id: 5,
    title: "Vinci's Arcane",
    category: "Recruitment",
    image:
      "https://scontent.fhan14-1.fna.fbcdn.net/v/t39.30808-6/490472323_1316370543821876_4164050641545407235_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeFsAdLsWQSpjgE_gGQKxva9JQaW00p4UJYlBpbTSnhQljrs1fBvWaOr9eBkkyn1UnCH2r-HFTDn7yV1PD8YMe70&_nc_ohc=kWel978GyS8Q7kNvwHfFFQS&_nc_oc=AdpgHcUZ7xm5oR7o7XwEw9erlEGS9yz_FetcBjR3yQIYGkVV2D0Vr12X6uF9tJIgVFY&_nc_zt=23&_nc_ht=scontent.fhan14-1.fna&_nc_gid=piXlufpv5SgMCtevgn991A&_nc_ss=7a32e&oh=00_Afx9vK4es6kbsjde61V1TbUu-JEF3titYTTuYHy7jPsqig&oe=69C8D4CD",
    desc: "Lấy cảm hứng từ kiệt tác 𝐓𝐡𝐞 𝐃𝐚 𝐕𝐢𝐧𝐜𝐢 𝐂𝐨𝐝𝐞 của Dan Brown",
    delay: 0.2,
  },
  {
    id: 6,
    title: "NEU Debate Open 2024",
    category: "Competition",
    image:
      "https://scontent.fhan14-2.fna.fbcdn.net/v/t39.30808-6/489789372_1309554121170185_1865980503138275570_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeGeN24OOOtBdPBp5j5G3chfPzCTVa4mORo_MJNVriY5GhPRTEazmRmvEvwKJoggVGCZzT5Xl3Kgl6fsCkqyqUlE&_nc_ohc=NNFN5FuNT34Q7kNvwEgjRWt&_nc_oc=AdpIwfPRlFppDfxyWEtCm0c6-ScCn76mnOmasO4xfS7b-9XaTO8_HRelkCGYKoIqnns&_nc_zt=23&_nc_ht=scontent.fhan14-2.fna&_nc_gid=e2VdQ55bGQ8BVCqmQ1Ec_g&_nc_ss=7a32e&oh=00_Afz6Q1gaw1JGcyiWtWQWT7hfQVOvMxm8TukCt1yqDJRX2A&oe=69C8B991",
    desc: "Lấy ý tưởng từ bộ truyện kinh điển “Alice's adventures in wonderland” ",
    delay: 0.3,
  },
  {
    id: 7,
    title: "NEU Debate Open 2023",
    category: "Competition",
    image:
      "https://scontent.fhan14-1.fna.fbcdn.net/v/t39.30808-6/484122109_1286186426840288_9048927764862949485_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeG-4ch20UOmM5ipj9wP4I2Hx7TppBPwIJnHtOmkE_AgmboYRj1InROlfxaMp4ziCYfJoh9Lq0wj26JGBRTYThe2&_nc_ohc=m4sFlkL1KD8Q7kNvwHzYRKD&_nc_oc=Adpsu9__8MHxKLe7jtDP6NcqrxdMRbdyn4AYJhWDSPb8lHZfbRrDLUJC7utsLhJo3PY&_nc_zt=23&_nc_ht=scontent.fhan14-1.fna&_nc_gid=w-CqKncDQDO8cegKYuK4cw&_nc_ss=7a32e&oh=00_AfwYxaanMkm268iY-6KtX4SwG5jvEyY8kH1GFitKBDFkrQ&oe=69C8EE85",
    desc: "NDO 2023 lấy cảm hứng từ bộ phim điện ảnh “The Greatest Showman” hay còn được biết tới với tên tiếng việt là “Bậc thầy của những ước mơ”.",
    delay: 0.4,
  },
  {
    id: 8,
    title: "NEU Debate Open 2022",
    category: "Competition",
    image:
      "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/470707401_7043941619062986_596274383412301029_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeHxiHRKOqhVieczDH0AJ6TgwMXrCVxQLv7AxesJXFAu_if95p4KRZSxXmxdjSWnuaL26qFdEMbJa4k45nt0lY_V&_nc_ohc=Rqpa9ScHO_UQ7kNvwH1ykSt&_nc_oc=AdoqLF8T009AOpBbvbMtqx3O4kLYnKCKLZaMVKTeNoIDLoQwSqZs4Dj7WfewEaoCOoA&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=sxjs9XdHCgepzGSCvNR4NA&_nc_ss=7a32e&oh=00_AfzGN0KVJ4Ds-h8MvK6fCyWAnpwrRHtwpD8q_uWrFJqOoA&oe=69C8FB65",
    desc: "Giống như những cơn mưa sao băng hiếm khi xuất hiện, hiếm khi có người được chiêm ngưỡng.",
    delay: 0.5,
  },
];

export const AllProjects = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(ALL_PROJECTS.length / itemsPerPage);

  const currentProjects = ALL_PROJECTS.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto min-h-screen">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold font-['Montserrat'] mb-4 text-black dark:text-white">
          Tất Cả Dự Án
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-['Inter']">
          Khám phá những dấu ấn nổi bật của NEU Debate Club qua từng năm tháng.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {currentProjects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group cursor-pointer relative"
          >
            <Link
              to={`/project/${project.id}`}
              className="absolute inset-0 z-40"
              aria-label={`Xem chi tiết dự án ${project.title}`}
            />
            <div className="overflow-hidden aspect-[4/3] mb-6 relative rounded-sm">
              <div className="absolute inset-0 bg-black/10 dark:bg-black/40 group-hover:bg-transparent dark:group-hover:bg-black/10 transition-colors duration-500 z-10" />
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 filter grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-[#8A151B]/10 dark:bg-[#8A151B]/20 opacity-0 group-hover:opacity-100 mix-blend-color z-20 transition-opacity duration-500" />
            </div>

            <div>
              <p className="text-[#8A151B] font-semibold text-xs uppercase tracking-widest mb-3 font-['Montserrat']">
                {project.category}
              </p>
              <h3 className="text-xl font-bold font-['Montserrat'] mb-4 text-black dark:text-white group-hover:text-[#8A151B] dark:group-hover:text-[#8A151B] transition-colors">
                {project.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-light font-['Inter'] text-sm leading-relaxed">
                {project.desc}
              </p>
            </div>
            <div className="absolute top-0 left-0 w-0 h-1 bg-[#8A151B] group-hover:w-full transition-all duration-500 z-30" />
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-20 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 dark:border-[#333] text-black dark:text-white rounded-full disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-['Montserrat'] font-semibold text-black dark:text-white">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 dark:border-[#333] text-black dark:text-white rounded-full disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
