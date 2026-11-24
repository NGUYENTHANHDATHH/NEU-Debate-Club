"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { inputClass } from "@/components/dashboard/TransactionForm";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { Section } from "@/components/ui/Dashboard/Section";
import { fetchPayosAccount, updatePayosAccount, type PayosAccount } from "@/lib/api";

const EMPTY = { clientId: "", apiKey: "", checksumKey: "" };
const FIELDS = [
  { key: "clientId", label: "Client ID" },
  { key: "apiKey", label: "API Key" },
  { key: "checksumKey", label: "Checksum Key" },
] as const;

/** BCN đổi tài khoản PayOS nhận tiền QR. Khoá lấy ở my.payos.vn → Kênh thanh toán; không hiển thị lại sau khi lưu. */
export function PayosAccountSection() {
  const [account, setAccount] = useState<PayosAccount | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPayosAccount().then(setAccount, (error: Error) => toast.error(error.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!window.confirm("Đổi tài khoản nhận tiền? Các mã QR đang mở của tài khoản cũ sẽ bị huỷ.")) return;
    setSaving(true);
    try {
      setAccount(await updatePayosAccount(form));
      setForm(EMPTY);
      toast.success("Đã đổi tài khoản PayOS nhận tiền.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Tài khoản nhận tiền QR (PayOS)"
      subtitle={
        account
          ? account.enabled
            ? `Đang nhận vào kênh PayOS có Client ID ${account.clientId}.`
            : "Chưa cấu hình: thành viên chưa trả được bằng QR."
          : "Đang tải..."
      }
    >
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="space-y-1 text-sm font-medium text-[#18181B]">
            <span>{label}</span>
            <input
              required
              autoComplete="off"
              type={key === "clientId" ? "text" : "password"}
              value={form[key]}
              onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
              className={inputClass}
            />
          </label>
        ))}
        <div className="sm:col-span-3">
          <ActionButton type="submit" icon={<Save className="h-4 w-4" />} disabled={saving}>
            {saving ? "Đang lưu..." : "Đổi tài khoản"}
          </ActionButton>
        </div>
      </form>
    </Section>
  );
}
