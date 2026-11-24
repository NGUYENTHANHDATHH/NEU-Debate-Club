"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BellRing,
  ExternalLink,
  FileText,
  Handshake,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  formatIsoDate,
  localIsoDate,
  safeHttpUrl,
} from "@/components/dashboard/PublicationsPage";
import { inputClass, money } from "@/components/dashboard/TransactionForm";
import {
  addPartnerItem,
  createPartner,
  deletePartner,
  deletePartnerItem,
  fetchEvents,
  fetchPartner,
  fetchPartnerFollowUps,
  fetchPartners,
  updatePartner,
  type ClubEvent,
  type ContractStatus,
  type FollowUp,
  type OutreachResult,
  type PartnerDetail,
  type PartnerScore,
  type PartnerStatus,
  type PartnerSummary,
  type SponsorTier,
} from "@/lib/api";

const STATUS_META: Record<PartnerStatus, { label: string; badge: string }> = {
  DANG_LIEN_HE: { label: "Đang liên hệ", badge: "bg-amber-50 text-amber-700" },
  DA_HOP_TAC: { label: "Đã hợp tác", badge: "bg-emerald-50 text-emerald-700" },
  THAN_THIET: { label: "Thân thiết", badge: "bg-rose-50 text-[#E11D48]" },
  KHONG_PHAN_HOI: {
    label: "Không phản hồi",
    badge: "bg-slate-100 text-slate-600",
  },
};
const TIER_LABELS: Record<SponsorTier, string> = {
  kim_cuong: "Kim cương",
  vang: "Vàng",
  bac: "Bạc",
  dong: "Đồng",
  hien_vat: "Đồng hành / Hiện vật",
};
const CONTRACT_LABELS: Record<ContractStatus, string> = {
  dang_dam_phan: "Đang đàm phán",
  da_ky: "Đã ký",
  da_thanh_ly: "Đã thanh lý",
};
const RESULT_LABELS: Record<OutreachResult, string> = {
  CHO_PHAN_HOI: "Chờ phản hồi",
  DONG_Y: "Đồng ý",
  TU_CHOI: "Từ chối",
};
const SCORE_PARTS: {
  key: Exclude<keyof PartnerScore, "total">;
  label: string;
  max: number;
}[] = [
  { key: "recency", label: "Gần đây", max: 30 },
  { key: "scale", label: "Quy mô", max: 25 },
  { key: "acceptance", label: "Tỉ lệ đồng ý", max: 25 },
  { key: "loyalty", label: "Gắn bó", max: 20 },
];

const labelClass = "space-y-1.5 text-sm font-medium text-slate-700";
const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600";

/** Ô trống → null, để backend lưu NULL thay vì chuỗi rỗng. */
function text(data: FormData, name: string) {
  const value = String(data.get(name) ?? "").trim();
  return value || null;
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      <span>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

/** Form thêm một dòng con (lịch sử tài trợ, người liên hệ, lần liên hệ), mở bằng nút "+". */
function AddForm({
  title,
  onSubmit,
  children,
}: {
  title: string;
  onSubmit: (data: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!open) {
    return (
      <ActionButton
        variant="outline"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {title}
      </ActionButton>
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(new FormData(event.currentTarget));
      setOpen(false);
    } catch (caught) {
      toast.error(errorMessage(caught, "Không thể lưu."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
    >
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
      <div className="flex justify-end gap-3">
        <ActionButton variant="outline" onClick={() => setOpen(false)}>
          Hủy
        </ActionButton>
        <ActionButton type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </ActionButton>
      </div>
    </form>
  );
}

export function SponsorsPage() {
  const [today] = useState(() => localIsoDate(new Date()));
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"list" | "ranking">("list");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PartnerStatus | "ALL">("ALL");
  const [field, setField] = useState("ALL");
  const [selected, setSelected] = useState<PartnerDetail | null>(null);
  // null: đóng form; "new": thêm; còn lại: sửa nhà tài trợ đang chọn.
  const [editing, setEditing] = useState<"new" | PartnerDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [partnerResult, followUpResult, eventResult] =
      await Promise.allSettled([
        fetchPartners(),
        fetchPartnerFollowUps(),
        fetchEvents(),
      ]);
    if (partnerResult.status === "fulfilled") setPartners(partnerResult.value);
    else
      setError(
        errorMessage(partnerResult.reason, "Không thể tải nhà tài trợ."),
      );
    if (followUpResult.status === "fulfilled")
      setFollowUps(followUpResult.value);
    // Sự kiện chỉ để gắn tuỳ chọn cho lần tài trợ; lỗi tải không chặn trang.
    if (eventResult.status === "fulfilled") setEvents(eventResult.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function open(id: string, scroll = false) {
    try {
      setSelected(await fetchPartner(id));
      // Chi tiết nằm trên bảng: bấm một dòng ở cuối bảng thì cuộn lên cho thấy.
      if (scroll)
        requestAnimationFrame(() =>
          document
            .getElementById("partner-detail")
            ?.scrollIntoView({ behavior: "smooth" }),
        );
    } catch (caught) {
      toast.error(errorMessage(caught, "Không thể tải nhà tài trợ."));
    }
  }

  /** Sau mỗi lần ghi: tải lại chi tiết đang mở và danh sách (tổng tiền, điểm, nhắc liên hệ đều đổi theo). */
  async function refresh(id?: string) {
    await Promise.all([load(), id ? open(id) : Promise.resolve()]);
  }

  const fields = useMemo(
    () =>
      [
        ...new Set(
          partners
            .map((partner) => partner.field)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [partners],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const rows = partners.filter(
      (partner) =>
        (status === "ALL" || partner.status === status) &&
        (field === "ALL" || partner.field === field) &&
        (!keyword ||
          partner.companyName.toLowerCase().includes(keyword) ||
          (partner.field ?? "").toLowerCase().includes(keyword)),
    );
    return tab === "ranking"
      ? [...rows].sort((a, b) => b.score.total - a.score.total)
      : rows;
  }, [partners, query, status, field, tab]);

  async function savePartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const logoUrl = text(data, "logoUrl");
    if (logoUrl && !safeHttpUrl(logoUrl))
      return toast.error("Link logo phải bắt đầu bằng http:// hoặc https://.");
    const input = {
      companyName: String(data.get("companyName") ?? "").trim(),
      field: text(data, "field"),
      logoUrl,
      status: data.get("status") as PartnerStatus,
      notes: text(data, "notes"),
    };
    setSaving(true);
    try {
      if (editing === "new") {
        const id = await createPartner(input);
        toast.success("Đã thêm nhà tài trợ.");
        await refresh(id);
      } else if (editing) {
        await updatePartner(editing.id, input);
        toast.success("Đã lưu nhà tài trợ.");
        await refresh(editing.id);
      }
      setEditing(null);
    } catch (caught) {
      toast.error(errorMessage(caught, "Không thể lưu nhà tài trợ."));
    } finally {
      setSaving(false);
    }
  }

  async function removePartner(partner: PartnerDetail) {
    if (
      !window.confirm(
        `Xoá nhà tài trợ "${partner.companyName}" cùng người liên hệ và nhật ký liên hệ?`,
      )
    )
      return;
    try {
      await deletePartner(partner.id);
      toast.success("Đã xoá nhà tài trợ.");
      setSelected(null);
      await load();
    } catch (caught) {
      toast.error(errorMessage(caught, "Không thể xoá nhà tài trợ."));
    }
  }

  async function removeItem(
    kind: "contacts" | "collaborations" | "outreach",
    itemId: string,
    what: string,
  ) {
    if (!selected || !window.confirm(`Xoá ${what}?`)) return;
    try {
      await deletePartnerItem(selected.id, kind, itemId);
      await refresh(selected.id);
    } catch (caught) {
      toast.error(errorMessage(caught, "Không thể xoá."));
    }
  }

  const partnerForm = editing ? (
    <Section
      title={
        editing === "new" ? "Thêm nhà tài trợ" : `Sửa ${editing.companyName}`
      }
      action={
        <button
          type="button"
          onClick={() => setEditing(null)}
          aria-label="Đóng"
          className={iconButton}
        >
          <X className="h-5 w-5" />
        </button>
      }
    >
      <form
        key={editing === "new" ? "new" : editing.id}
        onSubmit={savePartner}
        className="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên doanh nghiệp / tổ chức" required>
            <input
              name="companyName"
              required
              maxLength={255}
              defaultValue={editing === "new" ? "" : editing.companyName}
              className={inputClass}
            />
          </Field>
          <Field label="Lĩnh vực">
            <input
              name="field"
              maxLength={100}
              list="partner-fields"
              placeholder="Giáo dục, Ngân hàng..."
              defaultValue={editing === "new" ? "" : (editing.field ?? "")}
              className={inputClass}
            />
            <datalist id="partner-fields">
              {fields.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </Field>
          <Field label="Trạng thái">
            <select
              name="status"
              defaultValue={editing === "new" ? "DANG_LIEN_HE" : editing.status}
              className={inputClass}
            >
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Link logo">
            <input
              name="logoUrl"
              type="url"
              maxLength={2000}
              placeholder="https://..."
              defaultValue={editing === "new" ? "" : (editing.logoUrl ?? "")}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Ghi chú">
          <textarea
            name="notes"
            rows={3}
            maxLength={5000}
            defaultValue={editing === "new" ? "" : (editing.notes ?? "")}
            className={inputClass}
          />
        </Field>
        <div className="flex justify-end gap-3">
          <ActionButton variant="outline" onClick={() => setEditing(null)}>
            Hủy
          </ActionButton>
          <ActionButton type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu nhà tài trợ"}
          </ActionButton>
        </div>
      </form>
    </Section>
  ) : null;

  const detail = selected ? (
    <div id="partner-detail" className="scroll-mt-6">
      <Section
        title={selected.companyName}
        subtitle={[STATUS_META[selected.status]?.label, selected.field]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setEditing(selected)}
            >
              Sửa
            </ActionButton>
            <ActionButton
              variant="outline"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => void removePartner(selected)}
            >
              Xoá
            </ActionButton>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Đóng"
              className={iconButton}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        }
      >
        {selected.notes ? (
          <p className="mb-6 whitespace-pre-line text-sm text-slate-600">
            {selected.notes}
          </p>
        ) : null}

        <h3 className="mb-3 font-semibold text-slate-900">Lịch sử tài trợ</h3>
        {selected.collaborations.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            Chưa có lần tài trợ nào.
          </p>
        ) : (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Ngày</th>
                  <th className="px-3 py-2">Nội dung / sự kiện</th>
                  <th className="px-3 py-2">Hạng</th>
                  <th className="px-3 py-2 text-right">Giá trị</th>
                  <th className="px-3 py-2">Hợp đồng</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selected.collaborations.map((row) => {
                  const href = row.mouLink ? safeHttpUrl(row.mouLink) : null;
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                        {formatIsoDate(row.collaborationDate)}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">
                          {row.description}
                        </p>
                        {row.eventTitle ? (
                          <p className="text-xs text-slate-500">
                            Sự kiện: {row.eventTitle}
                          </p>
                        ) : null}
                        {row.benefitsCommitted ? (
                          <p className="mt-1 whitespace-pre-line text-xs text-slate-500">
                            Quyền lợi: {row.benefitsCommitted}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {row.tier ? (TIER_LABELS[row.tier] ?? row.tier) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">
                        {money.format(Number(row.sponsoredAmount))}
                      </td>
                      <td className="px-3 py-3">
                        <span className="block text-xs text-slate-500">
                          {CONTRACT_LABELS[row.contractStatus] ??
                            row.contractStatus}
                        </span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#E11D48] hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" /> Mở hợp đồng{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void removeItem(
                              "collaborations",
                              row.id,
                              `lần tài trợ "${row.description}"`,
                            )
                          }
                          aria-label="Xoá lần tài trợ"
                          className={iconButton}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <AddForm
          title="Thêm lần tài trợ"
          onSubmit={async (data) => {
            const mouLink = text(data, "mouLink");
            if (mouLink && !safeHttpUrl(mouLink))
              throw new Error(
                "Link hợp đồng phải bắt đầu bằng http:// hoặc https://.",
              );
            await addPartnerItem(selected.id, "collaborations", {
              eventId: text(data, "eventId"),
              description: String(data.get("description") ?? "").trim(),
              sponsoredAmount: Number(data.get("sponsoredAmount") || 0),
              mouLink,
              collaborationDate: String(data.get("collaborationDate")),
              tier: text(data, "tier") as SponsorTier | null,
              contractStatus: data.get("contractStatus") as ContractStatus,
              benefitsCommitted: text(data, "benefitsCommitted"),
            });
            toast.success("Đã thêm lần tài trợ.");
            await refresh(selected.id);
          }}
        >
          <Field label="Nội dung" required>
            <input
              name="description"
              required
              maxLength={500}
              placeholder="Tài trợ NEU Debate Cup 2026"
              className={inputClass}
            />
          </Field>
          <Field label="Sự kiện">
            <select name="eventId" defaultValue="" className={inputClass}>
              <option value="">Không gắn sự kiện</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Giá trị (VND, quy đổi nếu là hiện vật)" required>
            <input
              name="sponsoredAmount"
              type="number"
              required
              min="0"
              step="1000"
              className={inputClass}
            />
          </Field>
          <Field label="Ngày" required>
            <input
              name="collaborationDate"
              type="date"
              required
              defaultValue={today}
              className={inputClass}
            />
          </Field>
          <Field label="Hạng tài trợ">
            <select name="tier" defaultValue="" className={inputClass}>
              <option value="">—</option>
              {Object.entries(TIER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tình trạng hợp đồng">
            <select
              name="contractStatus"
              defaultValue="dang_dam_phan"
              className={inputClass}
            >
              {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Link hợp đồng (Google Drive, Word/PDF)">
            <input
              name="mouLink"
              type="url"
              maxLength={2000}
              placeholder="https://drive.google.com/..."
              className={inputClass}
            />
          </Field>
          <Field label="Quyền lợi đã cam kết">
            <textarea
              name="benefitsCommitted"
              rows={2}
              maxLength={5000}
              className={inputClass}
            />
          </Field>
        </AddForm>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Người liên hệ</h3>
            <ul className="mb-3 divide-y divide-slate-100">
              {selected.contacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-start justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {contact.fullName}
                      {contact.primary ? (
                        <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-xs text-[#E11D48]">
                          Đầu mối chính
                        </span>
                      ) : null}
                    </p>
                    <p className="text-slate-500">
                      {[contact.position, contact.phone, contact.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void removeItem(
                        "contacts",
                        contact.id,
                        `người liên hệ "${contact.fullName}"`,
                      )
                    }
                    aria-label="Xoá người liên hệ"
                    className={iconButton}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <AddForm
              title="Thêm người liên hệ"
              onSubmit={async (data) => {
                await addPartnerItem(selected.id, "contacts", {
                  fullName: String(data.get("fullName") ?? "").trim(),
                  position: text(data, "position"),
                  phone: text(data, "phone"),
                  email: text(data, "email"),
                  primary: data.get("primary") === "on",
                });
                await refresh(selected.id);
              }}
            >
              <Field label="Họ tên" required>
                <input
                  name="fullName"
                  required
                  maxLength={255}
                  className={inputClass}
                />
              </Field>
              <Field label="Chức vụ">
                <input name="position" maxLength={100} className={inputClass} />
              </Field>
              <Field label="Số điện thoại">
                <input
                  name="phone"
                  type="tel"
                  maxLength={20}
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  maxLength={255}
                  className={inputClass}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  name="primary"
                  type="checkbox"
                  className="h-4 w-4 accent-[#E11D48]"
                />{" "}
                Đầu mối chính
              </label>
            </AddForm>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">
              Nhật ký liên hệ
            </h3>
            <ul className="mb-3 divide-y divide-slate-100">
              {selected.outreach.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-xs text-slate-500">
                      {formatIsoDate(log.contactDate)} · {log.method} ·{" "}
                      {RESULT_LABELS[log.result] ?? log.result}
                      {log.createdByName ? ` · ${log.createdByName}` : ""}
                    </p>
                    <p className="whitespace-pre-line text-slate-800">
                      {log.content}
                    </p>
                    {log.followUpDate ? (
                      <p className="text-xs text-amber-700">
                        Hẹn liên hệ lại: {formatIsoDate(log.followUpDate)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void removeItem("outreach", log.id, "lần liên hệ này")
                    }
                    aria-label="Xoá lần liên hệ"
                    className={iconButton}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <AddForm
              title="Ghi lần liên hệ"
              onSubmit={async (data) => {
                await addPartnerItem(selected.id, "outreach", {
                  contactDate: String(data.get("contactDate")),
                  method: String(data.get("method") ?? "").trim(),
                  content: String(data.get("content") ?? "").trim(),
                  result: data.get("result") as OutreachResult,
                  followUpDate: text(data, "followUpDate"),
                });
                await refresh(selected.id);
              }}
            >
              <Field label="Ngày" required>
                <input
                  name="contactDate"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClass}
                />
              </Field>
              <Field label="Cách liên hệ" required>
                <input
                  name="method"
                  required
                  maxLength={50}
                  list="outreach-methods"
                  placeholder="Email, gọi điện, gặp mặt..."
                  className={inputClass}
                />
                <datalist id="outreach-methods">
                  <option value="Email" />
                  <option value="Gọi điện" />
                  <option value="Gặp mặt" />
                  <option value="Nhắn tin" />
                </datalist>
              </Field>
              <Field label="Kết quả">
                <select
                  name="result"
                  defaultValue="CHO_PHAN_HOI"
                  className={inputClass}
                >
                  {Object.entries(RESULT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hẹn liên hệ lại">
                <input name="followUpDate" type="date" className={inputClass} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Nội dung" required>
                  <textarea
                    name="content"
                    required
                    rows={2}
                    maxLength={5000}
                    className={inputClass}
                  />
                </Field>
              </div>
            </AddForm>
          </div>
        </div>
      </Section>
    </div>
  ) : null;

  return (
    <PageFrame
      title="Nhà tài trợ"
      description="Hồ sơ nhà tài trợ, lịch sử tài trợ kèm hợp đồng, nhật ký liên hệ và xếp hạng nhà tài trợ tiềm năng."
      action={
        <ActionButton
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setEditing("new")}
        >
          Thêm nhà tài trợ
        </ActionButton>
      }
    >
      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span>{error}</span>
          <ActionButton
            variant="outline"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void load()}
          >
            Thử lại
          </ActionButton>
        </div>
      ) : null}

      {followUps.length ? (
        <Section
          title="Cần liên hệ lại"
          subtitle="Lần liên hệ gần nhất có hẹn đã đến hạn. Ghi một lần liên hệ mới để bỏ nhắc."
        >
          <ul className="divide-y divide-slate-100">
            {followUps.map((item) => (
              <li key={item.partnerId}>
                <button
                  type="button"
                  onClick={() => void open(item.partnerId, true)}
                  className="flex w-full items-start gap-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <span className="font-medium text-slate-900">
                      {item.companyName}
                    </span>
                    <span className="text-slate-500">
                      {" "}
                      · hẹn {formatIsoDate(item.followUpDate)}
                      {item.createdByName
                        ? ` · ${item.createdByName}`
                        : ""} — {item.content}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {partnerForm}
      {detail}

      <Section
        title={
          tab === "list" ? "Danh sách nhà tài trợ" : "Nhà tài trợ tiềm năng"
        }
        subtitle={
          tab === "list"
            ? "Số liệu chỉ tính hợp đồng đã ký hoặc đã thanh lý."
            : "Điểm 0–100: tài trợ gần đây (30) + quy mô so với nhà tài trợ lớn nhất (25) + tỉ lệ đồng ý khi liên hệ (25) + số lần hợp tác (20)."
        }
        action={
          <div
            role="tablist"
            className="inline-flex rounded-full bg-slate-100 p-1 text-sm"
          >
            {(["list", "ranking"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`rounded-full px-4 py-1.5 ${tab === value ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {value === "list" ? "Danh sách" : "Tiềm năng"}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, lĩnh vực..."
              aria-label="Tìm nhà tài trợ"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PartnerStatus | "ALL")}
            aria-label="Lọc theo trạng thái"
            className={`${inputClass} lg:w-48`}
          >
            <option value="ALL">Mọi trạng thái</option>
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            aria-label="Lọc theo lĩnh vực"
            className={`${inputClass} lg:w-52`}
          >
            <option value="ALL">Mọi lĩnh vực</option>
            {fields.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {loading && !partners.length ? (
          <div role="status" className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#E11D48]" />
            <p className="mt-3 text-sm text-slate-500">
              Đang tải nhà tài trợ...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <Handshake className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base font-semibold text-slate-700">
              {partners.length
                ? "Không có nhà tài trợ phù hợp bộ lọc"
                : "Chưa có nhà tài trợ nào"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  {tab === "ranking" ? <th className="px-3 py-2">#</th> : null}
                  <th className="px-3 py-2">Nhà tài trợ</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2 text-right">Đã tài trợ</th>
                  {tab === "list" ? (
                    <>
                      <th className="px-3 py-2">Tài trợ gần nhất</th>
                      <th className="px-3 py-2">Liên hệ gần nhất</th>
                    </>
                  ) : (
                    <th className="px-3 py-2">Điểm</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((partner, index) => (
                  <tr
                    key={partner.id}
                    onClick={() => void open(partner.id, true)}
                    className={`cursor-pointer hover:bg-slate-50 ${selected?.id === partner.id ? "bg-rose-50/40" : ""}`}
                  >
                    {tab === "ranking" ? (
                      <td className="px-3 py-3 font-semibold text-slate-400">
                        {index + 1}
                      </td>
                    ) : null}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-slate-900 hover:text-[#E11D48]"
                      >
                        {partner.companyName}
                      </button>
                      {partner.field ? (
                        <p className="text-xs text-slate-500">
                          {partner.field}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_META[partner.status]?.badge ?? ""}`}
                      >
                        {STATUS_META[partner.status]?.label ?? partner.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                      <span className="font-semibold">
                        {money.format(Number(partner.signedTotal))}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {partner.signedCount} lần
                      </span>
                    </td>
                    {tab === "list" ? (
                      <>
                        <td className="px-3 py-3 text-slate-600">
                          {partner.lastSignedDate
                            ? formatIsoDate(partner.lastSignedDate)
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {partner.lastContactDate
                            ? formatIsoDate(partner.lastContactDate)
                            : "—"}
                        </td>
                      </>
                    ) : (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-4">
                          <span className="w-10 text-lg font-semibold tabular-nums text-slate-900">
                            {partner.score.total}
                          </span>
                          <dl className="grid flex-1 grid-cols-4 gap-3">
                            {SCORE_PARTS.map((part) => (
                              <div
                                key={part.key}
                                title={`${part.label}: ${partner.score[part.key]}/${part.max}`}
                              >
                                <dt className="text-[11px] text-slate-500">
                                  {part.label}
                                </dt>
                                <dd className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-[#E11D48]"
                                    style={{
                                      width: `${(partner.score[part.key] / part.max) * 100}%`,
                                    }}
                                  />
                                  <span className="sr-only">
                                    {partner.score[part.key]}/{part.max}
                                  </span>
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </PageFrame>
  );
}
