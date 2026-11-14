"use client";
/* eslint-disable @next/next/no-img-element -- background image is a CMS-configured URL. */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext";
import { fetchLandingSection, registerForEvent } from "@/lib/api";

// Edited in the dashboard CMS, section "announcement".
type Announcement = {
  title?: string;
  eventAt?: string;
  info?: string;
  body?: string;
  contact?: string;
  imageUrl?: string;
  hidden?: boolean;
  /** Sự kiện (bảng events) nhận đăng ký qua nút trong thông báo; trống = không mở đăng ký. */
  eventId?: string;
};

const lines = (text?: string) =>
  (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const CountdownTimer = ({ target }: { target: number }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeLeft = Math.floor((target - now) / 1000);
  if (timeLeft <= 0) return null; // event already started
  const timeBlocks = [
    { label: "NGÀY", value: Math.floor(timeLeft / 86400) },
    { label: "GIỜ", value: Math.floor((timeLeft % 86400) / 3600) },
    { label: "PHÚT", value: Math.floor((timeLeft % 3600) / 60) },
    { label: "GIÂY", value: timeLeft % 60 },
  ];

  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="flex items-center gap-2 mb-4 text-[#8A151B]">
        <Clock className="w-5 h-5 animate-pulse" />
        <span className="font-['Montserrat'] font-bold tracking-widest text-sm">
          THỜI GIAN ĐẾN SỰ KIỆN
        </span>
      </div>
      <div className="flex gap-3 sm:gap-6">
        {timeBlocks.map((block) => (
          <div key={block.label} className="flex flex-col items-center">
            <div className="w-14 h-16 sm:w-16 sm:h-20 bg-black/60 backdrop-blur-md border border-[#8A151B]/50 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(138,21,27,0.2)] mb-2">
              <span className="font-['Montserrat'] font-bold text-2xl sm:text-3xl text-white">
                {block.value.toString().padStart(2, "0")}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-400 tracking-wider">
              {block.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NotificationWidget = () => {
  // Người đăng ký là người đã đăng nhập bằng nút trên header: thành viên hoặc khách ngoài CLB.
  const { user, logout } = useUserContext();
  const [isOpen, setIsOpen] = useState(false);
  const [event, setEvent] = useState<Announcement | null>(null);
  const [registering, setRegistering] = useState(false);
  /** Email đã đăng ký xong trong lần mở trang này; mã QR không hiện ở đây mà được gửi qua email. */
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registerError, setRegisterError] = useState("");

  async function register(eventId: string) {
    if (!user) return;
    setRegistering(true);
    setRegisterError("");
    try {
      await registerForEvent(eventId);
      setRegisteredEmail(user.email);
    } catch (problem) {
      if ((problem as { status?: number }).status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.");
        logout(); // xoá phiên hết hạn để header hiện lại nút đăng nhập
      } else {
        setRegisterError(problem instanceof Error ? problem.message : "Không thể đăng ký.");
      }
    } finally {
      setRegistering(false);
    }
  }

  useEffect(() => {
    // 404 = never published: keep the button hidden.
    fetchLandingSection<Announcement>("announcement")
      .then(setEvent)
      .catch(() => setEvent(null));
  }, []);

  if (!event || event.hidden || !event.title?.trim()) return null;

  const eventTime = event.eventAt ? new Date(event.eventAt).getTime() : NaN;
  const info = lines(event.info);
  const body = lines(event.body);
  const contact = lines(event.contact);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        aria-label="Xem thông báo sự kiện"
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
              {event.imageUrl ? (
                <div className="absolute inset-0 z-0">
                  <img
                    src={event.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
                </div>
              ) : null}

              {/* Header */}
              <div className="relative z-20 flex justify-between items-center p-6 border-b border-white/10 shrink-0 bg-black/40">
                <h3 className="font-['Montserrat'] font-bold text-xl text-white flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#8A151B] animate-pulse" />
                  Thông báo mới
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Đóng"
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div
                className="relative z-10 p-6 sm:p-8 overflow-y-auto text-gray-200 font-['Inter'] leading-relaxed"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#8A151B transparent",
                }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Montserrat'] mb-4 leading-tight">
                    {event.title}
                  </h2>
                </div>

                {Number.isFinite(eventTime) ? (
                  <CountdownTimer target={eventTime} />
                ) : null}

                {event.eventId ? (
                  <div className="mb-8 text-center">
                    {registeredEmail && registeredEmail === user?.email ? (
                      <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                        Đăng ký thành công. Mã QR check-in sẽ được gửi tới email {registeredEmail}.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void register(event.eventId!)}
                        disabled={!user || registering}
                        className="rounded-full bg-[#8A151B] px-8 py-3 font-['Montserrat'] text-sm font-bold tracking-wider text-white transition-colors hover:bg-[#a51a21] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {registering ? "Đang đăng ký..." : user ? "Đăng ký tham gia" : "Đăng nhập ở góc trên để đăng ký"}
                      </button>
                    )}
                    {registerError ? (
                      <p role="alert" className="mt-3 text-sm text-red-300">
                        {registerError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-6">
                  {info.length ? (
                    <div>
                      <h4 className="text-[#8A151B] font-bold font-['Montserrat'] text-lg mb-3 tracking-wider">
                        TỔNG QUAN SỰ KIỆN:
                      </h4>
                      <ul className="space-y-1 mt-3 text-gray-300">
                        {info.map((line, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-[#8A151B]">📍</span> {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {body.length ? (
                    <>
                      <div className="h-px w-full bg-white/10 my-6" />
                      <div className="space-y-4 text-justify">
                        {body.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {contact.length ? (
                    <>
                      <div className="h-px w-full bg-white/10 my-6" />
                      <div>
                        <h4 className="text-white font-bold font-['Montserrat'] text-lg mb-3 tracking-wider">
                          THÔNG TIN LIÊN HỆ:
                        </h4>
                        <ul className="space-y-2 text-gray-300">
                          {contact.map((line, index) => (
                            <li key={index}>► {line}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
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
