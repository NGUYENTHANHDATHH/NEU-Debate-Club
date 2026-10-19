"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus, Search, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  CreateMemberInput,
  Member,
  createMember,
  fetchMembers,
  updateMember,
} from "@/lib/api";

const departments = [
  ["BCN", "Ban Chủ nhiệm"],
  ["TRUYEN_THONG", "Truyền thông"],
  ["DOI_NGOAI", "Đối ngoại"],
  ["NOI_DUNG", "Nội dung"],
  ["SU_KIEN", "Sự kiện"],
  ["KY_THUAT", "Kỹ thuật"],
  ["NHAN_SU", "Nhân sự"],
] as const;

const roles = [
  ["MEMBER", "Thành viên"],
  ["TRUONG_BAN", "Trưởng/Phó ban"],
  ["BCN", "BCN"],
] as const;

const initialForm: CreateMemberInput = {
  fullName: "",
  email: "",
  studentId: "",
  phone: "",
  department: "NOI_DUNG",
  role: "MEMBER",
  active: true,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#E11D48]";

function labelFor(
  items: readonly (readonly [string, string])[],
  value: string | null,
) {
  return items.find(([key]) => key === value)?.[1] ?? value ?? "—";
}

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateMemberInput>(initialForm);

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleMembers = members.filter((member) =>
    `${member.fullName} ${member.email} ${member.studentId ?? ""}`
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi")),
  );
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(visibleMembers.length / pageSize));
  const pageMembers = visibleMembers.slice((page - 1) * pageSize, page * pageSize);

  function update<K extends keyof CreateMemberInput>(
    key: K,
    value: CreateMemberInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setOpen(true);
  }

  function openEdit(member: Member) {
    setEditingId(member.id);
    setForm({
      fullName: member.fullName,
      email: member.email,
      studentId: member.studentId ?? "",
      phone: member.phone ?? "",
      department: member.department ?? "NOI_DUNG",
      role: member.role,
      active: member.active,
    });
    setError("");
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const member = editingId
        ? await updateMember(editingId, form)
        : await createMember(form);
      setMembers((current) =>
        (editingId
          ? current.map((item) => (item.id === editingId ? member : item))
          : [...current, member]
        ).sort((a, b) =>
          a.fullName.localeCompare(b.fullName, "vi"),
        ),
      );
      closeForm();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFrame
      eyebrow="BCN / NHÂN SỰ"
      title="Quản lý thành viên"
      description="Danh sách thành viên và trạng thái tài khoản nội bộ."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Thêm thành viên
        </ActionButton>
      }
    >
      {error && !open ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Section title="Danh sách thành viên" subtitle={`${members.length} thành viên`}>
        <label className="mb-5 flex max-w-md items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-[#71717A]">
          <Search className="h-4 w-4" />
          <span className="sr-only">Tìm thành viên</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent outline-none"
            placeholder="Tìm theo tên, email hoặc MSSV..."
          />
        </label>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Đang tải danh sách...</p>
        ) : visibleMembers.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {members.length === 0 ? "Chưa có thành viên nào." : "Không tìm thấy thành viên phù hợp."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {["Họ tên", "Email", "MSSV", "SĐT", "Ban", "Chức vụ", "Trạng thái", "Thao tác"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageMembers.map((member) => (
                  <tr key={member.id} className="text-[#18181B]">
                    <td className="px-3 py-4 font-medium">{member.fullName}</td>
                    <td className="px-3 py-4 text-slate-600">{member.email}</td>
                    <td className="px-3 py-4 font-mono text-slate-600">{member.studentId}</td>
                    <td className="px-3 py-4 text-slate-600">{member.phone}</td>
                    <td className="px-3 py-4">{labelFor(departments, member.department)}</td>
                    <td className="px-3 py-4">{labelFor(roles, member.role)}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {member.active ? "Hoạt động" : "Ngừng hoạt động"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && visibleMembers.length > 0 ? (
          <div className="relative mt-5 flex flex-col items-center gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-center">
            <p className="text-sm text-slate-500 sm:absolute sm:left-0">
              Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visibleMembers.length)} / {visibleMembers.length}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-full border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-slate-700">Trang {page} / {pageCount}</span>
              <button
                type="button"
                disabled={page === pageCount}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-full border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </Section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="member-form-title">
          <form onSubmit={handleSubmit} className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="member-form-title" className="text-xl font-semibold text-[#18181B]">
                  {editingId ? "Chỉnh sửa thành viên" : "Thêm thành viên"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId ? "Cập nhật hồ sơ và quyền tài khoản." : "Tạo hồ sơ và cấp quyền tài khoản CLB."}
                </p>
              </div>
              <button type="button" onClick={closeForm} aria-label="Đóng" className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error ? (
              <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Họ tên" value={form.fullName} onChange={(value) => update("fullName", value)} required />
              <Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} placeholder="ten@gmail.com" required />
              <Field label="MSSV" value={form.studentId} onChange={(value) => update("studentId", value)} maxLength={20} required />
              <Field label="Số điện thoại" type="tel" value={form.phone} onChange={(value) => update("phone", value)} maxLength={20} required />
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Ban</span>
                <select className={inputClass} value={form.department} onChange={(event) => update("department", event.target.value)}>
                  {departments.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Chức vụ</span>
                <select className={inputClass} value={form.role} onChange={(event) => update("role", event.target.value)}>
                  {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>

            <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} className="h-4 w-4 accent-[#E11D48]" />
              Cho phép tài khoản hoạt động
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <ActionButton variant="outline" onClick={closeForm}>Hủy</ActionButton>
              <ActionButton type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm thành viên"}
              </ActionButton>
            </div>
          </form>
        </div>
      ) : null}
    </PageFrame>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input {...props} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}
