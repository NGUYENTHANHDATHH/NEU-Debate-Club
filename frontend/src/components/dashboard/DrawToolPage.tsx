"use client";

import { useState } from "react";
import { Copy, Shuffle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";

const inputClass =
  "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]";

/** Fisher–Yates: mọi thứ tự có xác suất như nhau. */
function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Group = { title: string; names: string[] };

export function DrawToolPage() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(2);
  const [groups, setGroups] = useState<Group[]>([]);

  const names = [...new Set(text.split(/\r?\n/).map((name) => name.trim()).filter(Boolean))];
  const size = Math.min(Math.max(count, 1), Math.max(names.length, 1));

  function splitTeams() {
    const teams: Group[] = Array.from({ length: size }, (_, index) => ({ title: `Đội ${index + 1}`, names: [] }));
    // Chia vòng tròn nên các đội lệch nhau tối đa một người.
    shuffle(names).forEach((name, index) => teams[index % size].names.push(name));
    setGroups(teams);
  }

  function pick() {
    setGroups([{ title: `Được chọn (${size}/${names.length})`, names: shuffle(names).slice(0, size) }]);
  }

  async function copy() {
    const result = groups.map((group) => `${group.title}: ${group.names.join(", ")}`).join("\n");
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Đã sao chép kết quả.");
    } catch {
      toast.error("Trình duyệt không cho sao chép, hãy bôi đen và chép tay.");
    }
  }

  return (
    <PageFrame
      title="Bốc thăm & chia đội"
      description="Chia ngẫu nhiên danh sách thành các đội đều nhau, hoặc chọn ngẫu nhiên vài người (trọng tài, người nói trước...)."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Danh sách" subtitle="Mỗi dòng một tên; tên trùng chỉ tính một lần.">
          <label className="block">
            <span className="sr-only">Danh sách tên</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={10}
              placeholder={"Nguyễn Văn An\nTrần Thị Bình\n..."}
              className={`${inputClass} w-full`}
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#71717A]">
              Số đội / số người chọn:
              <input
                type="number"
                min={1}
                max={Math.max(names.length, 1)}
                value={count}
                onChange={(event) => setCount(Math.max(1, Math.round(Number(event.target.value)) || 1))}
                className={`${inputClass} w-20 py-2`}
              />
            </label>
            <span className="text-sm text-[#71717A]">{names.length} tên</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton icon={<Shuffle className="h-4 w-4" />} onClick={splitTeams} disabled={!names.length}>
              Chia {size} đội
            </ActionButton>
            <ActionButton variant="outline" icon={<UserCheck className="h-4 w-4" />} onClick={pick} disabled={!names.length}>
              Chọn {size} người
            </ActionButton>
          </div>
        </Section>

        <Section
          title="Kết quả"
          subtitle={groups.length ? "Bấm lại để bốc lượt mới." : "Chưa bốc thăm."}
          action={
            groups.length ? (
              <ActionButton variant="outline" icon={<Copy className="h-4 w-4" />} onClick={() => void copy()}>
                Sao chép
              </ActionButton>
            ) : undefined
          }
        >
          <div aria-live="polite" className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-[#E11D48]">{group.title}</h3>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-[#18181B]">
                  {group.names.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}
