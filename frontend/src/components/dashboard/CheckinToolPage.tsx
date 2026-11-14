"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { motion } from "motion/react";
import { Camera, CameraOff, CircleCheck, CircleX, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { fetchEventAttendees, fetchEvents, scanEventTicket, type ClubEvent, type EventTicket } from "@/lib/api";
import { refreshApiCache } from "@/lib/requestCache";

type Action = "check-in" | "check-out";

const ACTIONS: { value: Action; label: string }[] = [
  { value: "check-in", label: "Check-in" },
  { value: "check-out", label: "Check-out" },
];
/** Mã QR của vé là id (UUID) của lượt đăng ký. */
const TICKET_ID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
/** Mã còn nằm trước camera sau khi quét xong: không gửi lại trong khoảng này. */
const SAME_CODE_GAP_MS = 5000;

const FILTERS: { value: string; label: string; test: (attendee: EventTicket) => boolean }[] = [
  { value: "all", label: "Tất cả", test: () => true },
  { value: "present", label: "Đang có mặt", test: (attendee) => Boolean(attendee.checkedInAt && !attendee.checkedOutAt) },
  { value: "out", label: "Đã check-out", test: (attendee) => Boolean(attendee.checkedOutAt) },
  { value: "absent", label: "Chưa check-in", test: (attendee) => !attendee.checkedInAt },
];

/** `at` đổi mỗi lần quét để thông báo chạy hiệu ứng lại, kể cả khi trùng nội dung lần trước. */
type Result = { ok: boolean; title: string; name?: string; detail: string; at: number };

function time(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
    : "—";
}

/** Lượt quét gần nhất lên đầu; người chưa quét xếp theo tên. */
function lastActivity(attendee: EventTicket) {
  return Date.parse(attendee.checkedOutAt ?? attendee.checkedInAt ?? "") || 0;
}

function ResultBanner({ result }: { result: Result | null }) {
  const Icon = result?.ok ? CircleCheck : CircleX;
  return (
    // Vùng aria-live luôn có trong DOM để trình đọc màn hình đọc mỗi kết quả mới.
    <div aria-live="assertive" className="mb-4">
      {result ? (
        <motion.div
          key={result.at}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className={`flex items-center gap-4 rounded-3xl px-5 py-5 text-white shadow-lg sm:px-6 sm:py-6 ${
            result.ok ? "bg-emerald-700" : "bg-rose-700"
          }`}
        >
          <Icon className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/90">{result.title}</p>
            {result.name ? <p className="truncate text-2xl font-bold sm:text-3xl">{result.name}</p> : null}
            <p className="mt-1 text-base wrap-break-word text-white/95">{result.detail}</p>
          </div>
        </motion.div>
      ) : (
        <p className="rounded-3xl border-2 border-dashed border-slate-200 px-6 py-6 text-center text-base text-[#71717A]">
          Kết quả quét sẽ hiện ở đây.
        </p>
      )}
    </div>
  );
}

export function CheckinToolPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [action, setAction] = useState<Action>("check-in");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [attendees, setAttendees] = useState<EventTicket[]>([]);
  const [reload, setReload] = useState(0);
  /** `key` = lần tải đã xong (sự kiện + lượt bấm Tải lại); khác lần đang cần thì đang tải. */
  const [listState, setListState] = useState({ key: "", error: "" });
  const listKey = `${eventId}|${reload}`;
  const listLoading = Boolean(eventId) && listState.key !== listKey;
  const [filter, setFilter] = useState("all");
  const video = useRef<HTMLVideoElement>(null);
  // Vòng quét sống suốt phiên camera nên đọc sự kiện/chế độ mới nhất qua ref, không khởi động lại camera khi đổi.
  const target = useRef({ eventId, action });
  useEffect(() => {
    target.current = { eventId, action };
  });

  useEffect(() => {
    fetchEvents()
      .then((list) => {
        setEvents(list);
        // Danh sách xếp mới nhất trước: ưu tiên sự kiện đang diễn ra, rồi sự kiện sắp tới gần nhất.
        const current =
          list.find((event) => event.status === "ONGOING") ?? [...list].reverse().find((event) => event.status === "UPCOMING");
        setEventId((chosen) => chosen || (current ?? list[0])?.id || "");
      })
      .catch((error: Error) => setListState({ key: "", error: error.message }));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    fetchEventAttendees(eventId)
      .then((list) => {
        if (cancelled) return;
        setAttendees(list);
        setListState({ key: listKey, error: "" });
      })
      .catch((error: Error) => !cancelled && setListState({ key: listKey, error: error.message }));
    return () => {
      cancelled = true;
    };
  }, [eventId, listKey]);

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    let busy = false;
    let last = { code: "", at: 0 };
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const show = (next: Omit<Result, "at">) => setResult({ ...next, at: Date.now() });

    async function submit(code: string) {
      const { eventId: event, action: mode } = target.current;
      const label = mode === "check-in" ? "Check-in" : "Check-out";
      if (!event) return show({ ok: false, title: "Chưa chọn sự kiện", detail: "Hãy chọn sự kiện trước khi quét." });
      if (!TICKET_ID.test(code)) {
        return show({ ok: false, title: "Mã không hợp lệ", detail: "Đây không phải mã QR đăng ký sự kiện." });
      }
      try {
        const ticket = await scanEventTicket(event, code, mode);
        show({
          ok: true,
          title: `${label} thành công`,
          name: ticket.fullName,
          detail: `${ticket.email} · lúc ${time(mode === "check-in" ? ticket.checkedInAt : ticket.checkedOutAt)}`,
        });
        // Cập nhật danh sách tại chỗ, khỏi tải lại cả sự kiện sau mỗi lượt quét.
        setAttendees((list) =>
          list.some((attendee) => attendee.id === ticket.id)
            ? list.map((attendee) => (attendee.id === ticket.id ? ticket : attendee))
            : [...list, ticket],
        );
      } catch (error) {
        show({
          ok: false,
          title: `${label} không thành công`,
          detail: error instanceof Error ? error.message : "Không thể quét mã.",
        });
      }
    }

    async function scanFrame() {
      const element = video.current;
      if (busy || !context || !element || !element.videoWidth) return;
      canvas.width = element.videoWidth;
      canvas.height = element.videoHeight;
      context.drawImage(element, 0, 0);
      const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data;
      if (!code || (code === last.code && Date.now() - last.at < SAME_CODE_GAP_MS)) return;
      busy = true;
      await submit(code);
      last = { code, at: Date.now() };
      busy = false;
    }

    // mediaDevices không tồn tại khi trang không chạy trên HTTPS (trừ localhost).
    (navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } }) ?? Promise.reject(new Error("insecure")))
      .then((media) => {
        if (stopped || !video.current) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        video.current.srcObject = media;
        timer = window.setInterval(() => void scanFrame(), 250);
      })
      .catch(() => {
        setScanning(false);
        show({
          ok: false,
          title: "Không mở được camera",
          detail: "Hãy cho phép trang dùng camera và mở trang bằng HTTPS.",
        });
      });

    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning]);

  const activeFilter = FILTERS.find((option) => option.value === filter) ?? FILTERS[0];
  const shown = attendees
    .filter(activeFilter.test)
    .sort((a, b) => lastActivity(b) - lastActivity(a) || a.fullName.localeCompare(b.fullName, "vi"));

  return (
    <PageFrame
      title="Quét QR check-in"
      description="Quét mã QR người tham gia nhận qua email để check-in khi vào và check-out khi về. Mỗi mã chỉ check-in một lần và check-out một lần."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="1. Sự kiện & chế độ" subtitle="Mã của sự kiện khác sẽ bị từ chối." className="self-start">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#18181B]">Sự kiện</span>
            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]"
            >
              {events.length ? null : <option value="">Chưa có sự kiện</option>}
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {ACTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={action === option.value}
                onClick={() => setAction(option.value)}
                className={`rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${
                  action === option.value
                    ? "bg-[#E11D48] text-white"
                    : "border border-slate-200 bg-white text-[#71717A] hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="2. Camera"
          subtitle="Đưa mã QR vào giữa khung hình."
          action={
            <ActionButton
              variant={scanning ? "outline" : "primary"}
              icon={scanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              onClick={() => setScanning(!scanning)}
              disabled={!eventId}
            >
              {scanning ? "Tắt camera" : "Bật camera"}
            </ActionButton>
          }
        >
          {/* Kết quả nằm ngay trên khung camera để người quét không phải rời mắt khỏi màn hình. */}
          <ResultBanner result={result} />
          <div className={`relative ${scanning ? "" : "hidden"}`}>
            {/* playsInline: iPhone không tự bật toàn màn hình; muted: trình duyệt cho tự phát. */}
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              aria-label="Hình từ camera để quét mã QR"
              className="aspect-square w-full rounded-2xl bg-slate-900 object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-sm font-semibold text-white">
              Đang quét: {action === "check-in" ? "Check-in" : "Check-out"}
            </span>
          </div>
          {scanning ? null : <p className="text-sm text-[#71717A]">Camera đang tắt. Chọn sự kiện rồi bấm Bật camera.</p>}
        </Section>
      </div>

      <Section
        title="Người tham gia"
        subtitle="Cập nhật ngay khi quét trên máy này. Bấm Tải lại để thấy lượt quét từ máy khác."
        action={
          <ActionButton
            variant="outline"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              refreshApiCache();
              setReload((count) => count + 1);
            }}
            disabled={!eventId || listLoading}
          >
            Tải lại
          </ActionButton>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                filter === option.value
                  ? "bg-rose-50 font-medium text-[#E11D48]"
                  : "border border-slate-200 bg-white text-[#71717A] hover:bg-slate-50"
              }`}
            >
              {option.label} ({attendees.filter(option.test).length})
            </button>
          ))}
        </div>

        {listState.error ? (
          <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {listState.error}
          </p>
        ) : listLoading ? (
          <p className="text-sm text-[#71717A]">Đang tải danh sách...</p>
        ) : !shown.length ? (
          <p className="text-sm text-[#71717A]">
            {attendees.length ? "Không có ai trong mục này." : "Chưa có ai đăng ký sự kiện này."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {["Họ tên", "Email", "Check-in", "Check-out", "Trạng thái"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((attendee) => {
                  const status = attendee.checkedOutAt
                    ? { label: "Đã check-out", className: "bg-slate-100 text-slate-700" }
                    : attendee.checkedInAt
                      ? { label: "Đang có mặt", className: "bg-emerald-50 text-emerald-700" }
                      : { label: "Chưa check-in", className: "bg-amber-50 text-amber-800" };
                  return (
                    <tr key={attendee.id} className="text-[#18181B]">
                      <td className="px-3 py-3 font-medium">{attendee.fullName}</td>
                      <td className="px-3 py-3 text-slate-600">{attendee.email}</td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">{time(attendee.checkedInAt)}</td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">{time(attendee.checkedOutAt)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </PageFrame>
  );
}
