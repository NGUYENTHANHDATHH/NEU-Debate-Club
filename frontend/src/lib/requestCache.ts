// Cache GET dùng chung cho lib/api.ts: gộp các request trùng đang chạy (vd. chuông thông báo và trang
// Tổng quan cùng gọi /notifications) và giữ kết quả giữa các lần chuyển trang.

// Ngắn hơn chu kỳ poll 60s của chuông thông báo để mỗi lần poll luôn lấy dữ liệu mới.
const FRESH_MS = 30_000;

// shortcut: không giới hạn số khóa (mỗi URL GET một khóa, xóa sạch sau mỗi thao tác ghi); thêm giới hạn nếu URL có tham số tự do.
const cache = new Map<string, { at: number; promise: Promise<unknown> }>();

export function cachedGet<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined") return load(); // server: không chia sẻ dữ liệu giữa các request
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.promise as Promise<T>;
  const entry = { at: Date.now(), promise: load() };
  cache.set(key, entry);
  // Lỗi không được giữ lại: lần gọi sau thử lại ngay.
  entry.promise.catch(() => cache.get(key) === entry && cache.delete(key));
  return entry.promise;
}

/** Gọi sau mọi thao tác ghi và khi người dùng bấm "Tải lại": lần đọc kế tiếp lấy dữ liệu mới. */
export function refreshApiCache() {
  cache.clear();
}
