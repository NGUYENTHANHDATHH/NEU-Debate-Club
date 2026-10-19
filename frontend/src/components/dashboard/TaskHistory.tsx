"use client";

import { useEffect, useState } from "react";
import { fetchTaskComments, TaskComment } from "@/lib/api";

export function TaskHistory({ taskId, createdAt, assignedByName }: {
  taskId: string;
  createdAt: string;
  assignedByName: string | null;
}) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchTaskComments(taskId)
      .then((data) => { if (active) setComments(data); })
      .catch((cause: Error) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId]);

  return (
    <section aria-label="Lịch sử cập nhật" className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">Lịch sử cập nhật</h3>
      {loading && <p role="status" className="text-sm text-slate-500">Đang tải lịch sử...</p>}
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      {!loading && !error && (
        <ol className="space-y-4 border-l-2 border-slate-100 pl-4">
          <li className="relative text-sm before:absolute before:-left-[23px] before:top-1 before:h-3 before:w-3 before:rounded-full before:bg-slate-300">
            <p className="font-medium text-slate-800">Task được tạo</p>
            <p className="text-xs text-slate-500">{assignedByName ?? "Người giao"} · {new Date(createdAt).toLocaleString("vi-VN")}</p>
          </li>
          {comments.map((comment) => (
            <li key={comment.id} className="relative text-sm before:absolute before:-left-[23px] before:top-1 before:h-3 before:w-3 before:rounded-full before:bg-rose-400">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="font-medium text-slate-800">{comment.userName}</p>
                {comment.progress !== null && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">{comment.progress}%</span>}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-slate-600">{comment.content}</p>
              <time dateTime={comment.createdAt} className="mt-1 block text-xs text-slate-400">
                {new Date(comment.createdAt).toLocaleString("vi-VN")}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
