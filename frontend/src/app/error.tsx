// app/error.tsx — Bắt mọi lỗi runtime toàn app
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="py-32 px-6 text-center">
      <h2 className="text-2xl font-bold">Có lỗi xảy ra</h2>
      <p className="mt-2 text-gray-500">{error.message}</p>
      <button
        onClick={reset} // thử lại mà không reload
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Thử lại
      </button>
    </main>
  );
}
