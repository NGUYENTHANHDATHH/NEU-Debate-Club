"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, Save, Users } from "lucide-react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { useUserContext } from "@/context/userContext";
import {
  ADMIN_MODULE_KEYS,
  AdminModuleKey,
  DASHBOARD_NAV_GROUPS,
  LEAD_DEPARTMENTS,
} from "@/constants/dashboard-modules";
import { ROUTES } from "@/constants/routes";
import {
  Member,
  ModulePermissionMatrix,
  fetchMembers,
  fetchModulePermissions,
  saveModulePermissions,
} from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

const ROLES = [
  { key: "BCN", label: "BCN", description: "Luôn có mọi chức năng; là người duy nhất được sửa ma trận quyền." },
  { key: "TRUONG_BAN", label: "Trưởng/Phó ban", description: "Các chức năng ban mình được tick trong ma trận." },
  { key: "MEMBER", label: "Thành viên", description: "Chỉ dùng trang cá nhân: Todo-list, đọc thông báo, công cụ." },
] as const;

// Tên module lấy theo mục sidebar đầu tiên dùng module đó.
const MODULE_LABELS = new Map<AdminModuleKey, string>();
for (const item of DASHBOARD_NAV_GROUPS.flatMap((group) => group.items)) {
  if (item.module && !MODULE_LABELS.has(item.module)) MODULE_LABELS.set(item.module, item.name);
}

const departmentLabel = (department: string) => DEPARTMENT_NAMES[department]?.replace(/^Ban /, "") ?? department;

export function RolesPage() {
  const { user } = useUserContext();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [matrix, setMatrix] = useState<ModulePermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedMembers, loadedMatrix] = await Promise.all([fetchMembers(), fetchModulePermissions()]);
      setMembers(loadedMembers);
      setMatrix(loadedMatrix);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải phân quyền.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isBcn = user?.role?.toUpperCase() === "BCN";
  const countFor = (role: string) => members.filter((member) => member.role?.toUpperCase() === role).length;

  function toggle(moduleKey: AdminModuleKey, department: string) {
    setSaveMessage("");
    setMatrix((current) => {
      if (!current) return current;
      const departments = current[moduleKey] ?? [];
      return {
        ...current,
        [moduleKey]: departments.includes(department)
          ? departments.filter((item) => item !== department)
          : [...departments, department],
      };
    });
  }

  async function save() {
    if (!matrix) return;
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      setMatrix(await saveModulePermissions(matrix));
      setSaveMessage("Đã lưu. Trưởng ban sẽ thấy thay đổi khi tải lại trang.");
    } catch (saveFailure) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : "Không thể lưu phân quyền.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFrame
      title="Phân quyền"
      description="Tick chức năng cho từng ban: Trưởng/Phó ban của ban được tick sẽ dùng được chức năng đó; thành viên thường không, trừ Nhà tài trợ (cả ban được dùng). Chỉ BCN được sửa; đổi vai trò hoặc ban ở trang Quản lý thành viên."
      action={
        <ActionButton icon={<Users className="h-4 w-4" />} onClick={() => router.push(ROUTES.members)}>
          Đổi vai trò thành viên
        </ActionButton>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Section
          title="Vai trò"
          subtitle={isBcn ? "Số thành viên toàn câu lạc bộ." : "Số thành viên trong ban của bạn."}
        >
          {loading && <p role="status" className="mb-3 text-sm text-[#71717A]">Đang tải thành viên...</p>}
          {error && (
            <div role="alert" className="mb-3 space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{error}</p>
              <ActionButton variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
                Thử lại
              </ActionButton>
            </div>
          )}
          <ul className="space-y-3">
            {ROLES.map((role) => (
              <li key={role.key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[#18181B]">{role.label}</span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-[#E11D48]">
                    {loading || error ? "—" : countFor(role.key)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#71717A]">{role.description}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Ma trận quyền"
          subtitle={isBcn ? "Tick ô để cấp chức năng cho Trưởng/Phó ban, rồi bấm Lưu." : "Chỉ BCN được sửa ma trận này."}
          action={
            isBcn && (
              <ActionButton icon={<Save className="h-4 w-4" />} onClick={() => void save()} disabled={!matrix || saving}>
                {saving ? "Đang lưu..." : "Lưu phân quyền"}
              </ActionButton>
            )
          }
        >
          {saveError && (
            <p role="alert" className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {saveError}
            </p>
          )}
          {saveMessage && (
            <p role="status" className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {saveMessage}
            </p>
          )}
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200/60">
            <table className="min-w-full divide-y divide-slate-200/60 text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold text-[#94A3B8]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left uppercase tracking-[0.18em]">Module</th>
                  <th scope="col" className="px-3 py-3 text-center">BCN</th>
                  {LEAD_DEPARTMENTS.map((department) => (
                    <th key={department} scope="col" className="px-3 py-3 text-center">
                      {departmentLabel(department)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {ADMIN_MODULE_KEYS.map((moduleKey) => {
                  const moduleLabel = MODULE_LABELS.get(moduleKey) ?? moduleKey;
                  return (
                    <tr key={moduleKey}>
                      <th scope="row" className="px-4 py-3 text-left font-medium text-[#18181B]">
                        {moduleLabel}
                      </th>
                      <td className="px-3 py-3 text-center">
                        <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="BCN luôn có quyền" />
                      </td>
                      {LEAD_DEPARTMENTS.map((department) => (
                        <td key={department} className="px-3 py-3 text-center">
                          {matrix ? (
                            <input
                              type="checkbox"
                              checked={matrix[moduleKey]?.includes(department) ?? false}
                              onChange={() => toggle(moduleKey, department)}
                              disabled={!isBcn || saving}
                              aria-label={`${departmentLabel(department)}: ${moduleLabel}`}
                              className="h-4 w-4 rounded border-slate-300 text-[#E11D48] focus:ring-[#E11D48] disabled:cursor-not-allowed"
                            />
                          ) : (
                            <span className="text-slate-300" aria-hidden="true">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#71717A]">
            Ô được tick = Trưởng/Phó ban của ban đó dùng được chức năng; thành viên thường không, trừ "Nhà tài trợ" (cả ban được dùng). BCN luôn có tất cả.
          </p>
        </Section>
      </div>
    </PageFrame>
  );
}
