// app/(dashboard)/dashboard/error.tsx — Bắt lỗi trong dashboard
// Có sidebar, không bị mất layout
"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <h2 className="text-xl font-bold">Có lỗi xảy ra</h2>
      <p className="text-gray-500 mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 
        bg-blue-600 text-white rounded-lg"
      >
        Thử lại
      </button>
    </div>
  );
}
