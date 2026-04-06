import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Clock } from 'lucide-react';

const CountdownTimer = () => {
  // Initialize fake countdown time: 10 days, 5 hours, 30 minutes, 0 seconds
  const [timeLeft, setTimeLeft] = useState(10 * 24 * 60 * 60 + 5 * 60 * 60 + 30 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(timeLeft / (24 * 60 * 60));
  const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
  const seconds = timeLeft % 60;

  const timeBlocks = [
    { label: 'NGÀY', value: days },
    { label: 'GIỜ', value: hours },
    { label: 'PHÚT', value: minutes },
    { label: 'GIÂY', value: seconds }
  ];

  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="flex items-center gap-2 mb-4 text-[#8A151B]">
        <Clock className="w-5 h-5 animate-pulse" />
        <span className="font-['Montserrat'] font-bold tracking-widest text-sm">THỜI GIAN ĐẾN SỰ KIỆN</span>
      </div>
      <div className="flex gap-3 sm:gap-6">
        {timeBlocks.map((block, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-14 h-16 sm:w-16 sm:h-20 bg-black/60 backdrop-blur-md border border-[#8A151B]/50 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(138,21,27,0.2)] mb-2">
              <span className="font-['Montserrat'] font-bold text-2xl sm:text-3xl text-white">
                {block.value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-['Montserrat'] font-medium text-gray-400">
              {block.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NotificationWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-[#8A151B] text-white rounded-full shadow-[0_0_20px_rgba(138,21,27,0.5)] flex items-center justify-center group"
      >
        <div className="absolute inset-0 rounded-full border border-[#8A151B] animate-ping opacity-75" />
        <Bell className="w-6 h-6 animate-pulse group-hover:animate-none" />
      </motion.button>

      {/* Notification Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-[#0A0A0A] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[#222]"
            >
              {/* Blurred Background Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://scontent.fhan14-2.fna.fbcdn.net/v/t39.30808-6/642785336_1596027342522860_4708825084758353573_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeFw0CfUmhwBnn8514W22ALsXm11dodk5VdebXV2h2TlV_p8uO3V3nVBfjvUJVv3PtX8glSl2AAAdZXz7L2lSF3H&_nc_ohc=eepcIwluwz0Q7kNvwEkYhcC&_nc_oc=Adpdy5LpVktsoygIGd6V1904s5gx5t97JktmIISLPDLjpAkrjytFUP2LzBMk-0OQX4UOnwTko1OWt2u4lUYkC560&_nc_zt=23&_nc_ht=scontent.fhan14-2.fna&_nc_gid=w2YDqxKCTxCjnx4HF-e0_w&_nc_ss=7a32e&oh=00_AfywDL4pS_cUPwwA5vbsrHcfjF0TWXxrYpbRB5iISqmi1g&oe=69CD5B3B" 
                  alt="Background" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
              </div>

              {/* Header */}
              <div className="relative z-20 flex justify-between items-center p-6 border-b border-white/10 shrink-0 bg-black/40">
                <h3 className="font-['Montserrat'] font-bold text-xl text-white flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#8A151B] animate-pulse" />
                  Thông báo mới
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 overflow-y-auto text-gray-200 font-['Inter'] leading-relaxed" style={{ scrollbarWidth: 'thin', scrollbarColor: '#8A151B transparent' }}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Montserrat'] mb-4 leading-tight">
                    WORKSHOP “THẾ GIÓNG NGỰ SÓNG” <br className="hidden sm:block" /> VƯƠN VAI THỦ THẾ, NHẬP SÓNG TOÀN CẦU 🏆
                  </h2>
                </div>

                <CountdownTimer />

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[#8A151B] font-bold font-['Montserrat'] text-lg mb-3 tracking-wider">TỔNG QUAN SỰ KIỆN:</h4>
                    <p className="mb-2"><strong>𝐓𝐡𝐞̂́ 𝐆𝐢𝐨́𝐧𝐠 𝐍𝐠𝐮̛̣ 𝐒𝐨́𝐧𝐠</strong> - Workshop bàn về “Tầm quan trọng của việc chọn lọc, tiếp nhận và xử lý thông tin với sinh viên trong bối cảnh hội nhập toàn cầu” do Câu lạc bộ Tranh biện Đại học Kinh tế Quốc dân tổ chức</p>
                    <ul className="space-y-1 mt-3 text-gray-300">
                      <li className="flex items-start gap-2"><span className="text-[#8A151B]">📍</span> Thời gian tổ chức: 18h30 - 21h00, ngày 18/03/2026</li>
                      <li className="flex items-start gap-2"><span className="text-[#8A151B]">📍</span> Đối tượng tham gia: Học sinh, sinh viên</li>
                    </ul>
                  </div>

                  <div className="h-px w-full bg-white/10 my-6" />

                  <div className="space-y-4 text-justify">
                    <p>🌐 Trong kỷ nguyên bùng nổ thông tin và hội nhập toàn cầu sâu rộng, cơ hội học tập và nghề nghiệp đã và đang ngày càng rộng mở cho sinh viên. Tuy nhiên, không phải nguồn thông tin nào cũng chính xác, phù hợp hay đem lại giá trị tích cực như vẻ ngoài. Để chọn lọc thông tin và nắm bắt được những cơ hội ấy, sinh viên không chỉ cần kiến thức chuyên môn cao mà còn phải có năng lực chọn lọc, tiếp nhận và xử lý thông tin.</p>
                    <p>🍃 Hiểu được áp lực và thách thức mà sinh viên đang đối mặt giữa “biển” thông tin đa chiều trong thời đại hội nhập, workshop “Thế Gióng Ngự Sóng” được xây dựng như một không gian định hướng và trang bị kỹ năng thiết thực nơi tập trung vào việc rèn luyện khả năng chọn lọc nguồn tin đáng tin cậy đối với người tham gia.</p>
                    <p>🥇 Workshop sử dụng hình ảnh “Gióng” như một phép ẩn dụ cho thế hệ trẻ thời 4.0 - những người biết đứng lên, chủ động và đầy bản lĩnh trước thách thức. Trong bối cảnh nhiều biến động, họ không né tránh mà rèn luyện tư duy, ý chí, năng lực để hoàn thiện và khẳng định bản thân mình. Song song cùng với đó, hình ảnh “Sóng” là đại diện những ma trận thông tin trong thời đại toàn cầu hóa, nơi thông tin vừa là nguồn lực quan trọng vừa dễ gây quá tải trong không gian số. Nếu thiếu khả năng chọn lọc, người trẻ rất dễ bị cuốn theo hoặc ngộp thở trước những “cơn sóng” dữ dội ấy.</p>
                    <p>📢 Workshop hứa hẹn sẽ là nơi giải đáp những băn khoăn và tìm ra những phương pháp đúng đắn cho sinh viên để nâng cao kiến thức và kĩ năng trong thời đại số hóa.</p>
                    <p className="text-[#8A151B] font-semibold">🔔 Nhấn theo dõi Fanpage NEU Debate Club để không bỏ lỡ bất kì thông tin quan trọng nào đang chờ đón bạn phía trước nhé!!</p>
                  </div>

                  <div className="h-px w-full bg-white/10 my-6" />

                  <div>
                    <h4 className="text-white font-bold font-['Montserrat'] text-lg mb-3 tracking-wider">THÔNG TIN LIÊN HỆ:</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>► <strong>Trưởng Ban Tổ chức:</strong> Ms. Phạm Thủy Tiên (0369316440)</li>
                      <li>► <strong>Phó Trưởng Ban Tổ chức:</strong>
                        <ul className="ml-6 mt-1 space-y-1 text-gray-400">
                          <li>- Mr. Lưu Thế Mạnh (0398336679)</li>
                          <li>- Ms. Trần Phương Uyên (0869342687)</li>
                        </ul>
                      </li>
                      <li className="mt-3">► <strong>Facebook:</strong> NEU Debate Club</li>
                      <li>► <strong>Tik Tok:</strong> NEU Debate Club - NDC</li>
                      <li>► <strong>Gmail:</strong> debate.neu@gmail.com</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Bottom gradient fade for scroll indicator */}
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none z-20" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};