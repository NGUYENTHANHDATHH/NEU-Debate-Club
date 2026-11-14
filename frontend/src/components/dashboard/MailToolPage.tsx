"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FlaskConical, Send } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { useUserContext } from "@/context/userContext";
import { fetchEventAttendees, fetchEvents, type ClubEvent } from "@/lib/api";
import { gmailConfigured, loadGmailClient, requestGmailToken, sendGmail } from "@/lib/gmail";
import { parseRecipients, renderTemplate, unknownPlaceholders } from "@/lib/mailMerge";

/** Gmail cá nhân giới hạn khoảng 500 người nhận/ngày; chia lượt nhỏ để một lần bấm nhầm không dùng hết. */
const MAX_PER_SEND = 100;
/** Gmail API cho mỗi người 6.000 đơn vị/phút, mỗi thư tốn 100: giãn 1 giây/thư để không quá 60 thư/phút. */
const SEND_GAP_MS = 1000;

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]";

const LIST_PLACEHOLDER = "email\tten\nan.nguyen@gmail.com\tAn\nbinh.tran@gmail.com\tBình";

// Mẫu chỉ dùng biến {{ten}} để chạy được với danh sách tối thiểu "email, ten".
const TEMPLATES = [
  {
    name: "Thư mời sự kiện",
    subject: "[NEU Debate Club] Thư mời tham dự [tên sự kiện]",
    body: "Chào {{ten}},\n\nNEU Debate Club trân trọng mời bạn tham dự [tên sự kiện].\n\n- Thời gian: [giờ, ngày]\n- Địa điểm: [địa điểm]\n- Đăng ký: [link]\n\nRất mong được gặp bạn tại sự kiện.\n\nTrân trọng,\nNEU Debate Club",
  },
  {
    name: "Thư cảm ơn",
    subject: "[NEU Debate Club] Cảm ơn bạn đã tham gia [tên sự kiện]",
    body: "Chào {{ten}},\n\nCảm ơn bạn đã dành thời gian tham gia [tên sự kiện]. Sự có mặt của bạn đã góp phần làm nên thành công của chương trình.\n\nNếu có góp ý, bạn chỉ cần trả lời thư này.\n\nTrân trọng,\nNEU Debate Club",
  },
  {
    name: "Thư ngỏ hợp tác",
    subject: "[NEU Debate Club] Thư ngỏ hợp tác cùng {{ten}}",
    body: "Kính gửi {{ten}},\n\nNEU Debate Club là câu lạc bộ tranh biện của Đại học Kinh tế Quốc dân. Chúng tôi đang tổ chức [tên sự kiện] và mong muốn được hợp tác cùng Quý đơn vị.\n\nChi tiết đề xuất: [link hồ sơ]\n\nRất mong nhận được phản hồi của Quý đơn vị.\n\nTrân trọng,\nNEU Debate Club",
  },
];

/** Ảnh PNG mã QR check-in để đính kèm thư; người nhận không có cột `qr` thì không đính kèm gì. */
async function qrAttachment(code: string) {
  if (!code) return undefined;
  const dataUrl = await QRCode.toDataURL(code, { width: 480, margin: 2 });
  return { name: "ma-qr-check-in.png", type: "image/png", base64: dataUrl.split(",")[1] };
}

export function MailToolPage() {
  const { user } = useUserContext();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [list, setList] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewIndex, setPreviewIndex] = useState(0);
  // Token Gmail chỉ giữ trong bộ nhớ trang: tải lại trang là phải kết nối lại.
  const [token, setToken] = useState<string | null>(null);
  const [clientError, setClientError] = useState("");
  /** Thứ tự thư đang gửi; null = không gửi. */
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const sending = progress !== null;

  useEffect(() => {
    if (gmailConfigured) loadGmailClient().catch((error: Error) => setClientError(error.message));
    // Không tải được sự kiện thì chỉ thiếu ô chọn sự kiện; vẫn dán danh sách và gửi thư bình thường.
    fetchEvents().then(setEvents).catch(() => undefined);
  }, []);

  async function loadAttendees(eventId: string) {
    if (!eventId || (list.trim() && !window.confirm("Thay danh sách đang có bằng người đã đăng ký sự kiện này?"))) return;
    try {
      const attendees = await fetchEventAttendees(eventId);
      if (!attendees.length) {
        toast.info("Sự kiện này chưa có ai đăng ký.");
        return;
      }
      // Cột qr = mã vé; thư của người nhận có cột này được đính kèm ảnh mã QR check-in.
      const rows = attendees.map((attendee) => `${attendee.email}\t${attendee.fullName.replace(/\s+/g, " ")}\t${attendee.id}`);
      setList(["email\tten\tqr", ...rows].join("\n"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải người đăng ký.");
    }
  }

  const parsed = useMemo(() => parseRecipients(list), [list]);
  const unknown = useMemo(() => unknownPlaceholders(`${subject}\n${body}`, parsed.columns), [subject, body, parsed.columns]);
  const messages = useMemo(
    () =>
      parsed.recipients.map((recipient) => ({
        to: recipient.email,
        subject: renderTemplate(subject, recipient).trim(),
        body: renderTemplate(body, recipient).trim(),
        qr: recipient.qr ?? "",
      })),
    [parsed.recipients, subject, body],
  );
  const shownIndex = Math.min(previewIndex, Math.max(messages.length - 1, 0));
  const preview = messages[shownIndex];

  const templateProblem = !gmailConfigured
    ? "Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID nên chưa kết nối được Gmail. Hãy báo BCN."
    : clientError || (!subject.trim() || !body.trim() ? "Nhập tiêu đề và nội dung thư." : "");
  const sendProblem =
    templateProblem ||
    (!messages.length
      ? "Dán danh sách có ít nhất một email hợp lệ."
      : unknown.length
        ? `Mẫu dùng biến không có trong danh sách: ${unknown.map((key) => `{{${key}}}`).join(", ")}.`
        : "");
  // Danh sách dài (vd. cả sự kiện) gửi theo từng lượt: người đã gửi tự rời danh sách, bấm lần nữa để gửi lượt kế.
  const batchSize = Math.min(messages.length, MAX_PER_SEND);

  async function send(test: boolean) {
    // Thư thử dùng dữ liệu của người nhận đầu tiên; chưa có danh sách thì gửi nguyên mẫu.
    const first = messages.at(0);
    const batch = test
      ? [{ to: user?.email ?? "", subject: first?.subject ?? subject.trim(), body: first?.body ?? body.trim(), qr: first?.qr ?? "" }]
      : messages.slice(0, MAX_PER_SEND);
    setFailed([]);
    try {
      // Xin quyền trước mọi await/confirm khác để cửa sổ Google mở ngay trong cú bấm (không bị chặn popup).
      const accessToken = token ?? (await requestGmailToken(user?.email));
      setToken(accessToken);
      if (!test && !window.confirm(`Gửi ${batch.length} email từ Gmail của bạn?\nThư đã gửi không thể thu hồi.`)) return;

      const sentTo = new Set<string>();
      const notSent: string[] = [];
      for (const [index, message] of batch.entries()) {
        setProgress(index + 1);
        if (index) await new Promise((resolve) => setTimeout(resolve, SEND_GAP_MS));
        try {
          await sendGmail(accessToken, {
            to: message.to,
            subject: message.subject,
            body: message.body,
            attachment: await qrAttachment(message.qr),
          });
          sentTo.add(message.to);
        } catch (sendError) {
          const status = (sendError as { status?: number }).status;
          notSent.push(message.to);
          // 400 = Gmail từ chối riêng thư này nên gửi tiếp; lỗi khác (hết phiên, hết hạn mức, mất mạng) sẽ lặp lại nên dừng.
          if (status === 400) continue;
          if (status === 401) setToken(null);
          notSent.push(...batch.slice(index + 1).map((rest) => rest.to));
          toast.error(
            status === 401
              ? "Phiên kết nối Gmail đã hết hạn. Bấm gửi lại để kết nối và gửi tiếp."
              : `Đã dừng gửi: ${sendError instanceof Error ? sendError.message : "lỗi không xác định"}`,
          );
          break;
        }
      }
      setFailed(notSent);
      if (sentTo.size) toast.success(test ? `Đã gửi thư thử tới ${user?.email}.` : `Đã gửi ${sentTo.size} email.`);
      if (!test) {
        // Xoá các dòng đã gửi khỏi danh sách để bấm gửi lần nữa không ai nhận hai thư.
        setList((current) =>
          current
            .split(/\r?\n/)
            .filter((line) => !line.split(/[\t,;]/).some((cell) => sentTo.has(cell.trim().toLowerCase())))
            .join("\n"),
        );
      }
    } catch (connectError) {
      toast.error(connectError instanceof Error ? connectError.message : "Không thể kết nối Gmail.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <PageFrame
      title="Gửi mail hàng loạt"
      description="Soạn một mẫu thư, dán danh sách người nhận, mỗi người nhận một thư riêng đã điền tên. Thư gửi từ chính Gmail của bạn và nằm trong hộp Đã gửi của bạn."
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <Section
            title="1. Người nhận"
            subtitle="Dán từ Google Sheets/Excel. Dòng đầu là tên cột, bắt buộc có cột email; hoặc chỉ dán danh sách email."
          >
            {events.length ? (
              <label className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#71717A]">
                Hoặc lấy người đã đăng ký sự kiện (thư tự đính kèm mã QR check-in của từng người):
                <select
                  value=""
                  onChange={(event) => void loadAttendees(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#18181B] outline-none focus:border-[#E11D48]"
                >
                  <option value="">Chọn sự kiện…</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block">
              <span className="sr-only">Danh sách người nhận</span>
              <textarea
                value={list}
                onChange={(event) => setList(event.target.value)}
                rows={7}
                spellCheck={false}
                placeholder={LIST_PLACEHOLDER}
                className={`${inputClass} font-mono`}
              />
            </label>
            <p role="status" className="mt-2 text-sm text-[#71717A]">
              <span className="font-medium text-[#18181B]">{parsed.recipients.length} người nhận hợp lệ</span>
              {parsed.duplicates ? ` · bỏ ${parsed.duplicates} email trùng` : ""}
              {messages.length > MAX_PER_SEND
                ? ` · mỗi lần bấm gửi ${MAX_PER_SEND} người đầu, bấm tiếp để gửi phần còn lại`
                : ` · tối đa ${MAX_PER_SEND} người/lượt`}
            </p>
            {parsed.invalid.length ? (
              <p role="alert" className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Bỏ qua {parsed.invalid.length} dòng không có email hợp lệ: {parsed.invalid.slice(0, 5).join("; ")}
                {parsed.invalid.length > 5 ? "…" : ""}
              </p>
            ) : null}
          </Section>

          <Section title="2. Mẫu thư" subtitle="Viết {{tên cột}} ở chỗ cần thay bằng thông tin của từng người.">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[#71717A]">Mẫu có sẵn:</span>
                {TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => {
                      if ((subject || body) && !window.confirm("Thay tiêu đề và nội dung đang soạn bằng mẫu này?")) return;
                      setSubject(template.subject);
                      setBody(template.body);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[#18181B] transition-colors hover:bg-slate-50"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#18181B]">Tiêu đề</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={200}
                  className={inputClass}
                  placeholder="[NEU Debate Club] ..."
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#18181B]">Nội dung</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={12}
                  maxLength={20000}
                  className={inputClass}
                  placeholder={"Chào {{ten}},\n\n..."}
                />
              </label>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[#71717A]">Chèn biến vào nội dung:</span>
                {parsed.columns.map((column) => (
                  <button
                    key={column}
                    type="button"
                    onClick={() => setBody((current) => `${current}{{${column}}}`)}
                    className="rounded-full bg-rose-50 px-3 py-1 font-mono text-xs text-[#E11D48] hover:bg-rose-100"
                  >
                    {`{{${column}}}`}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        </div>

        <Section
          title="3. Xem trước & gửi"
          subtitle={preview ? `Thư gửi tới ${preview.to}` : "Thư sẽ hiện ở đây khi có người nhận."}
          action={
            messages.length > 1 ? (
              <div className="flex items-center gap-1 text-sm text-[#71717A]">
                <button
                  type="button"
                  aria-label="Người nhận trước"
                  disabled={shownIndex === 0}
                  onClick={() => setPreviewIndex(shownIndex - 1)}
                  className="rounded-full p-1.5 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {shownIndex + 1}/{messages.length}
                <button
                  type="button"
                  aria-label="Người nhận sau"
                  disabled={shownIndex === messages.length - 1}
                  onClick={() => setPreviewIndex(shownIndex + 1)}
                  className="rounded-full p-1.5 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : undefined
          }
          className="self-start"
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="font-semibold text-[#18181B]">{preview?.subject || subject || "(Chưa có tiêu đề)"}</p>
            <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-[#3F3F46]">
              {preview?.body || body || "(Chưa có nội dung)"}
            </p>
            {preview?.qr ? (
              <p className="mt-3 border-t border-slate-200 pt-3 text-sm text-[#71717A]">
                Đính kèm: ma-qr-check-in.png (mã QR check-in của người nhận này)
              </p>
            ) : null}
          </div>

          {sendProblem ? (
            <p role="status" className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {sendProblem}
            </p>
          ) : null}
          {failed.length ? (
            <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Chưa gửi được tới: {failed.join(", ")}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-[#71717A]">
            {token
              ? "Đã kết nối Gmail cho tới khi bạn tải lại trang."
              : "Lần gửi đầu sẽ mở cửa sổ Google để bạn cấp quyền gửi thư từ Gmail của mình."}{" "}
            Giữ tab này mở cho tới khi gửi xong.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton
              icon={<Send className="h-4 w-4" />}
              disabled={sending || Boolean(sendProblem)}
              onClick={() => void send(false)}
            >
              {sending ? `Đang gửi thư ${progress}...` : `Gửi ${batchSize} email`}
            </ActionButton>
            <ActionButton
              variant="outline"
              icon={<FlaskConical className="h-4 w-4" />}
              disabled={sending || Boolean(templateProblem) || !user?.email}
              onClick={() => void send(true)}
            >
              Gửi thử cho tôi
            </ActionButton>
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}
