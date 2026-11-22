"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import QRCode from "qrcode";
import { CircleCheck, ExternalLink, X } from "lucide-react";
import { money } from "@/components/dashboard/TransactionForm";
import { createPayosLink, refreshPayosPayment, type FinanceTransaction, type PayosLink } from "@/lib/api";

const POLL_MS = 3000;

/**
 * Mã VietQR (PayOS) cho một khoản còn thiếu. Trong lúc mở, hỏi lại mỗi 3 giây: tiền vào là
 * backend ghi nhận và dialog chuyển sang "Đã thanh toán" — không phụ thuộc webhook.
 * Nơi dùng đặt `key={item?.id}` để mỗi khoản mở với trạng thái mới.
 */
export function PayosDialog({
  item,
  onClose,
  onPaid,
}: {
  item: FinanceTransaction | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [link, setLink] = useState<PayosLink | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);
  const itemId = item?.id;

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    createPayosLink(itemId)
      .then(async (created) => {
        if (cancelled) return;
        setLink(created);
        if (created.paid) setPaid(true);
        else if (created.qrCode) setQrImage(await QRCode.toDataURL(created.qrCode, { width: 320, margin: 1 }));
      })
      .catch((caught) => !cancelled && setError(caught instanceof Error ? caught.message : "Không tạo được mã QR."));
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  useEffect(() => {
    if (!itemId || !link || link.paid || paid) return;
    const timer = window.setInterval(() => {
      refreshPayosPayment(itemId)
        .then((done) => done && setPaid(true))
        .catch(() => undefined); // lỗi mạng tạm thời: lần hỏi sau thử lại
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [itemId, link, paid]);

  useEffect(() => {
    if (paid) onPaid();
  }, [paid, onPaid]);

  return (
    <Dialog.Root open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />
        <Dialog.Content className="fixed inset-x-4 top-[5vh] z-50 mx-auto max-h-[90vh] max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.35)] outline-none">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-[#18181B]">Thanh toán bằng QR</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-slate-500">{item?.description}</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Đóng" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <p className="mt-4 text-center text-2xl font-semibold tabular-nums text-[#18181B]">
            {item ? money.format(Number(item.amount)) : ""}
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : paid ? (
            <div role="status" className="mt-6 flex flex-col items-center gap-2 py-6 text-center text-emerald-700">
              <CircleCheck className="h-12 w-12" aria-hidden />
              <p className="text-base font-semibold">Đã thanh toán</p>
              <p className="text-sm text-slate-500">CLB đã nhận tiền; biên nhận được gửi vào thông báo của bạn.</p>
            </div>
          ) : qrImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh data URL tạo tại chỗ */}
              <img src={qrImage} alt="Mã VietQR thanh toán" width={320} height={320} className="mx-auto mt-4 h-64 w-64" />
              <p role="status" className="mt-3 text-center text-sm text-slate-500">
                Mở app ngân hàng, quét mã và giữ nguyên số tiền, nội dung. Trang tự cập nhật khi tiền vào.
              </p>
              {link?.checkoutUrl ? (
                <a
                  href={link.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-[#BE123C] hover:underline"
                >
                  Mở trang thanh toán PayOS
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
            </>
          ) : (
            <p role="status" className="mt-6 py-10 text-center text-sm text-slate-500">Đang tạo mã QR…</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
