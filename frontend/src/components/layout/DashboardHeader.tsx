"use client";
export default function MainLayout() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800"></h1>
      </div>
      <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
        <button className="hover:text-slate-900">Tìm kiếm</button>
        <button className="hover:text-slate-900 relative">
          Thông báo
          <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
