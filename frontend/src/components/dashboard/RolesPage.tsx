"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, Users } from "lucide-react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { useUserContext } from "@/context/userContext";
import {
  ADMIN_MODULE_KEYS,
  AdminModuleKey,
  DASHBOARD_NAV_GROUPS,
  LEAD_DEPARTMENTS,
  MODULE_DEPARTMENTS,
} from "@/constants/dashboard-modules";
import { ROUTES } from "@/constants/routes";
import { Member, fetchMembers } from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

const ROLES = [
  { key: "BCN", label: "BCN", description: "Quản trị mọi module của câu lạc bộ." },
  { key: "TRUONG_BAN", label: "Trưởng/Phó ban", description: "Quản trị các module thuộc ban mình (xem ma trận)." },
  { key: "MEMBER", label: "Thành viên", description: "Chỉ dùng trang cá nhân: Todo-list, đọc thông báo." },
] as const;

// Tên module lấy theo mục sidebar đầu tiên dùng module đó.
const MODULE_LABELS = new Map<AdminModuleKey, string>();
for (const item of DASHBOARD_NAV_GROUPS.flatMap((group) => group.items)) {
  if (item.module && !MODULE_LABELS.has(item.module)) MODULE_LABELS.set(item.module, item.name);
}

export function RolesPage() {
  const { user } = useUserContext();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMembers(await fetchMembers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải thành viên.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isBcn = user?.role?.toUpperCase() === "BCN";
  const countFor = (role: string) => members.filter((member) => member.role?.toUpperCase() === role).length;

  return (
    <PageFrame
      title="Phân quyền"
      description="Quyền truy cập được xác định bởi vai trò và ban của mỗi thành viên. Trang này chỉ để xem; đổi vai trò hoặc ban ở trang Quản lý thành viên."
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
          subtitle="Module × vai trò/ban. Thành viên thường không quản trị module nào."
        >
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200/60">
            <table className="min-w-full divide-y divide-slate-200/60 text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold text-[#94A3B8]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left uppercase tracking-[0.18em]">Module</th>
                  <th scope="col" className="px-3 py-3 text-center">BCN</th>
                  {LEAD_DEPARTMENTS.map((department) => (
                    <th key={department} scope="col" className="px-3 py-3 text-center">
                      TB {DEPARTMENT_NAMES[department]?.replace(/^Ban /, "") ?? department}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {ADMIN_MODULE_KEYS.map((moduleKey) => (
                  <tr key={moduleKey}>
                    <th scope="row" className="px-4 py-3 text-left font-medium text-[#18181B]">
                      {MODULE_LABELS.get(moduleKey) ?? moduleKey}
                    </th>
                    <PermissionCell allowed />
                    {LEAD_DEPARTMENTS.map((department) => (
                      <PermissionCell key={department} allowed={MODULE_DEPARTMENTS[moduleKey].includes(department)} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#71717A]">TB = Trưởng/Phó ban của ban đó.</p>
        </Section>
      </div>
    </PageFrame>
  );
}

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-3 py-3 text-center">
      {allowed ? (
        <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Có quyền" />
      ) : (
        <span className="text-slate-300" aria-label="Không có quyền">—</span>
      )}
    </td>
  );
}
