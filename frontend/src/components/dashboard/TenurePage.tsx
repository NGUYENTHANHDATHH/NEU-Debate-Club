"use client";

import { CalendarDays, Plus, Trash2, UserPlus, Users, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  Member,
  SaveSeasonInput,
  Season,
  SeasonMember,
  addSeasonMember,
  createSeason,
  deleteSeason,
  fetchMembers,
  fetchSeasonMembers,
  fetchSeasons,
  removeSeasonMember,
} from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Thành viên",
  TRUONG_BAN: "Trưởng/Phó ban",
  BCN: "BCN",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#E11D48]";

// Season dates are plain DATE values ("YYYY-MM-DD"); format in UTC so they never shift a day.
const dateOnly = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "UTC" });

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : dateOnly.format(date);
}

const emptySeasonForm: SaveSeasonInput = { name: "", startDate: "", endDate: "", active: false };

export function TenurePage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [seasonMembers, setSeasonMembers] = useState<SeasonMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SaveSeasonInput>(emptySeasonForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [clubMembers, setClubMembers] = useState<Member[] | null>(null);
  const [pickerError, setPickerError] = useState("");
  const [pick, setPick] = useState({ userId: "", role: "", department: "" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSeasons();
      const sorted = [...data].sort((a, b) => b.startDate.localeCompare(a.startDate));
      setSeasons(sorted);
      setSelectedId((current) =>
        current && sorted.some((season) => season.id === current)
          ? current
          : (sorted.find((season) => season.active) ?? sorted[0])?.id ?? null,
      );
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadSeasonMembers = useCallback(async (seasonId: string) => {
    setMembersLoading(true);
    setMembersError("");
    try {
      setSeasonMembers(await fetchSeasonMembers(seasonId));
    } catch (caught) {
      setSeasonMembers([]);
      setMembersError((caught as Error).message);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadSeasonMembers(selectedId);
  }, [selectedId, loadSeasonMembers]);

  const selected = seasons.find((season) => season.id === selectedId) ?? null;

  const grouped = Object.entries(
    seasonMembers.reduce<Record<string, SeasonMember[]>>((groups, member) => {
      const key = member.department?.toUpperCase() ?? "";
      (groups[key] ??= []).push(member);
      return groups;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  const candidates = (clubMembers ?? []).filter(
    (member) => member.active && !seasonMembers.some((item) => item.userId === member.id),
  );

  function setMemberCount(seasonId: string, delta: number) {
    setSeasons((current) =>
      current.map((season) =>
        season.id === seasonId ? { ...season, memberCount: season.memberCount + delta } : season,
      ),
    );
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!form.name.trim()) return setFormError("Vui lòng nhập tên nhiệm kỳ.");
    if (!form.startDate || !form.endDate) return setFormError("Vui lòng chọn ngày bắt đầu và kết thúc.");
    // "YYYY-MM-DD" strings compare correctly as text.
    if (form.endDate <= form.startDate) return setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
    setSaving(true);
    try {
      const created = await createSeason({ ...form, name: form.name.trim() });
      toast.success("Đã tạo nhiệm kỳ.");
      setFormOpen(false);
      setForm(emptySeasonForm);
      setSelectedId(created.id);
      // Reload so a newly active season deactivates the previous one in the list.
      await load();
    } catch (caught) {
      setFormError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSeason(season: Season) {
    if (!window.confirm(`Xóa nhiệm kỳ "${season.name}"? Danh sách thành viên của nhiệm kỳ cũng bị xóa.`)) return;
    setBusyId(season.id);
    try {
      await deleteSeason(season.id);
      toast.success("Đã xóa nhiệm kỳ.");
      if (selectedId === season.id) setSelectedId(null);
      await load();
    } catch (caught) {
      toast.error((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function openPicker() {
    setPickerOpen(true);
    setPick({ userId: "", role: "", department: "" });
    if (clubMembers) return;
    setPickerError("");
    try {
      setClubMembers(await fetchMembers());
    } catch (caught) {
      setPickerError((caught as Error).message);
    }
  }

  function choose(userId: string) {
    const member = clubMembers?.find((item) => item.id === userId);
    setPick({
      userId,
      role: member?.role?.toUpperCase() ?? "",
      department: member?.department?.toUpperCase() ?? "",
    });
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (!pick.userId || !pick.role || !pick.department) {
      setPickerError("Vui lòng chọn thành viên, vai trò và ban.");
      return;
    }
    setSaving(true);
    setPickerError("");
    try {
      const added = await addSeasonMember(selected.id, {
        userId: pick.userId,
        role: pick.role,
        department: pick.department,
      });
      setSeasonMembers((current) => [...current, added]);
      setMemberCount(selected.id, 1);
      toast.success("Đã thêm thành viên vào nhiệm kỳ.");
      setPickerOpen(false);
    } catch (caught) {
      setPickerError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(member: SeasonMember) {
    if (!selected) return;
    if (!window.confirm(`Xóa ${member.fullName ?? member.email} khỏi nhiệm kỳ này?`)) return;
    setBusyId(member.id);
    try {
      await removeSeasonMember(selected.id, member.id);
      setSeasonMembers((current) => current.filter((item) => item.id !== member.id));
      setMemberCount(selected.id, -1);
      toast.success("Đã xóa thành viên khỏi nhiệm kỳ.");
    } catch (caught) {
      toast.error((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageFrame
      eyebrow="BCN"
      title="Nhiệm kỳ"
      description="Danh sách các nhiệm kỳ của CLB và thành viên tham gia từng nhiệm kỳ."
      action={
        <ActionButton
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setForm(emptySeasonForm);
            setFormError("");
            setFormOpen(true);
          }}
        >
          Tạo nhiệm kỳ
        </ActionButton>
      }
    >
      {formOpen ? (
        <Section title="Tạo nhiệm kỳ mới">
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Tên nhiệm kỳ</span>
              <input
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Nhiệm kỳ 2026-2027"
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Ngày bắt đầu</span>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Ngày kết thúc</span>
              <input
                type="date"
                required
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Đặt làm nhiệm kỳ hiện tại
            </label>
            {formError ? (
              <p role="alert" className="text-sm text-rose-600 md:col-span-2">
                {formError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 md:col-span-2">
              <ActionButton variant="outline" onClick={() => setFormOpen(false)}>
                Hủy
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Tạo nhiệm kỳ"}
              </ActionButton>
            </div>
          </form>
        </Section>
      ) : null}

      <Section title="Các nhiệm kỳ" subtitle="Nhiệm kỳ hiện tại được đánh dấu. Chọn một nhiệm kỳ để xem chi tiết.">
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-slate-500">
            Đang tải nhiệm kỳ...
          </p>
        ) : error ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>
            <ActionButton variant="outline" onClick={() => void load()}>
              Thử lại
            </ActionButton>
          </div>
        ) : seasons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            <CalendarDays className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            Chưa có nhiệm kỳ nào. Bấm &ldquo;Tạo nhiệm kỳ&rdquo; để bắt đầu.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {seasons.map((season) => (
              <button
                key={season.id}
                type="button"
                onClick={() => {
                  setSelectedId(season.id);
                  setPickerOpen(false);
                }}
                aria-pressed={season.id === selectedId}
                className={`rounded-[1.75rem] border p-5 text-left transition ${
                  season.active ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50"
                } ${season.id === selectedId ? "ring-2 ring-[#E11D48]/40" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#18181B]">{season.name}</p>
                  {season.active ? (
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-[#E11D48]">
                      Hiện tại
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-[#71717A]">
                  {formatDate(season.startDate)} – {formatDate(season.endDate)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#71717A]">
                  <Users className="h-3.5 w-3.5" /> {season.memberCount} thành viên
                </p>
              </button>
            ))}
          </div>
        )}
      </Section>

      {selected ? (
        <Section
          title={selected.name}
          subtitle={`${formatDate(selected.startDate)} – ${formatDate(selected.endDate)} · ${selected.memberCount} thành viên${selected.active ? " · Nhiệm kỳ hiện tại" : ""}`}
          action={
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={<UserPlus className="h-4 w-4" />} onClick={() => void openPicker()}>
                Thêm thành viên
              </ActionButton>
              <ActionButton
                variant="outline"
                icon={<Trash2 className="h-4 w-4" />}
                disabled={busyId === selected.id}
                onClick={() => void handleDeleteSeason(selected)}
              >
                Xóa nhiệm kỳ
              </ActionButton>
            </div>
          }
        >
          {pickerOpen ? (
            <form
              onSubmit={handleAddMember}
              className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <select
                aria-label="Thành viên"
                value={pick.userId}
                onChange={(e) => choose(e.target.value)}
                className={inputClass}
                disabled={!clubMembers}
              >
                <option value="">
                  {clubMembers ? `Chọn thành viên (${candidates.length})` : "Đang tải thành viên..."}
                </option>
                {candidates.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName} · {member.email}
                  </option>
                ))}
              </select>
              <select
                aria-label="Vai trò"
                value={pick.role}
                onChange={(e) => setPick({ ...pick, role: e.target.value })}
                className={inputClass}
              >
                <option value="">Vai trò</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Ban"
                value={pick.department}
                onChange={(e) => setPick({ ...pick, department: e.target.value })}
                className={inputClass}
              >
                <option value="">Ban</option>
                {Object.entries(DEPARTMENT_NAMES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <ActionButton type="submit" disabled={saving}>
                  {saving ? "Đang thêm..." : "Thêm"}
                </ActionButton>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setPickerOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {pickerError ? (
                <p role="alert" className="text-sm text-rose-600 md:col-span-4">
                  {pickerError}
                </p>
              ) : null}
            </form>
          ) : null}

          {membersLoading ? (
            <p role="status" className="py-6 text-center text-sm text-slate-500">
              Đang tải thành viên nhiệm kỳ...
            </p>
          ) : membersError ? (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {membersError}
            </p>
          ) : seasonMembers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
              Nhiệm kỳ này chưa có thành viên.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {grouped.map(([department, members]) => (
                <div key={department} className="rounded-2xl border border-slate-200/70 p-4">
                  <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-[#18181B]">
                    {DEPARTMENT_NAMES[department] ?? (department || "Chưa có ban")}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {members.length}
                    </span>
                  </h3>
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {member.fullName ?? member.email}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {ROLE_LABELS[member.role?.toUpperCase()] ?? member.role} · từ {formatDate(member.joinedAt)}
                            {member.leftAt ? ` đến ${formatDate(member.leftAt)}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          title="Xóa khỏi nhiệm kỳ"
                          aria-label={`Xóa ${member.fullName ?? member.email} khỏi nhiệm kỳ`}
                          disabled={busyId === member.id}
                          onClick={() => void handleRemoveMember(member)}
                          className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Section>
      ) : null}
    </PageFrame>
  );
}
