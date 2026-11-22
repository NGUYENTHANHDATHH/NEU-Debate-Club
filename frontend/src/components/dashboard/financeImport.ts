import type { SaveTransactionInput } from "@/lib/api";

/** Cột của file mẫu public/mau-thu-chi.csv; thứ tự cột trong file tự do, chỉ cần đúng tiêu đề. */
export const IMPORT_COLUMNS = ["ngày", "loại", "số tiền", "mô tả", "danh mục", "sự kiện", "thành viên", "trạng thái"] as const;

/** Tách CSV (dấu , hoặc ;), hiểu ô trong ngoặc kép như Excel xuất ra. */
function parseCsv(text: string) {
  const firstLine = text.split("\n", 1)[0];
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) endCell();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endCell();
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  endCell();
  rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
}

function parseDate(value: string) {
  const vn = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const iso = vn ? `${vn[3]}-${vn[2].padStart(2, "0")}-${vn[1].padStart(2, "0")}` : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso) ? iso : null;
}

/**
 * Đọc file thu chi theo mẫu. Trả về các giao dịch hợp lệ và lỗi theo số dòng (đánh số như Excel, tiêu đề là dòng 1).
 * shortcut: số tiền chỉ lấy phần nguyên (VND không có số lẻ); cần số lẻ thì đổi cách đọc dấu thập phân.
 */
export function parseTransactionsCsv(
  text: string,
  events: { id: string; title: string }[],
  members: { id: string; email: string }[] = [],
) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const header = (rows.shift() ?? []).map((c) => c.toLowerCase().normalize("NFC"));
  const col = Object.fromEntries(IMPORT_COLUMNS.map((name) => [name, header.indexOf(name)]));
  const missing = IMPORT_COLUMNS.slice(0, 4).filter((name) => col[name] < 0);
  if (missing.length) return { transactions: [], errors: [`Thiếu cột: ${missing.join(", ")}. Hãy dùng file mẫu.`] };

  const eventByTitle = new Map(events.map((ev) => [ev.title.trim().toLowerCase(), ev.id]));
  // Theo email chứ không theo tên: tên có thể trùng, email thì không.
  const memberByEmail = new Map(members.map((m) => [m.email.trim().toLowerCase(), m.id]));
  const transactions: SaveTransactionInput[] = [];
  const errors: string[] = [];
  rows.forEach((cells, index) => {
    const get = (name: (typeof IMPORT_COLUMNS)[number]) => (col[name] < 0 ? "" : cells[col[name]] ?? "");
    const rowErrors: string[] = [];
    const transactionDate = parseDate(get("ngày"));
    if (!transactionDate) rowErrors.push(`ngày "${get("ngày")}" không hợp lệ (dùng dd/mm/yyyy)`);
    const typeText = get("loại").toLowerCase();
    const type = typeText === "thu" || typeText === "income" ? "INCOME" : typeText === "chi" || typeText === "expense" ? "EXPENSE" : null;
    if (!type) rowErrors.push(`loại "${get("loại")}" phải là Thu hoặc Chi`);
    const digits = get("số tiền").replace(/[.,\s]|đ|vnd/gi, "");
    const amount = /^\d+$/.test(digits) ? Number(digits) : 0;
    if (!amount) rowErrors.push(`số tiền "${get("số tiền")}" không hợp lệ`);
    const description = get("mô tả");
    if (!description) rowErrors.push("thiếu mô tả");
    else if (description.length > 500) rowErrors.push("mô tả dài quá 500 ký tự");
    const category = get("danh mục");
    if (category.length > 100) rowErrors.push("danh mục dài quá 100 ký tự");
    const eventTitle = get("sự kiện");
    const eventId = eventTitle ? eventByTitle.get(eventTitle.toLowerCase()) : null;
    if (eventTitle && !eventId) rowErrors.push(`không tìm thấy sự kiện "${eventTitle}"`);
    const memberEmail = get("thành viên");
    const memberId = memberEmail ? memberByEmail.get(memberEmail.toLowerCase()) : null;
    if (memberEmail && !memberId) rowErrors.push(`không tìm thấy thành viên có email "${memberEmail}"`);
    // Trống / "Đã thu" / "Đã chi" = đã xong; "Chưa thu" = thành viên cần đóng (khoản thu, có thành viên, không sự kiện).
    const status = get("trạng thái").toLowerCase();
    const paid = status !== "chưa thu";
    if (status && paid && status !== "đã thu" && status !== "đã chi") {
      rowErrors.push(`trạng thái "${get("trạng thái")}" phải là Chưa thu, Đã thu hoặc để trống`);
    }
    if (!paid && (type !== "INCOME" || !memberEmail || eventTitle)) {
      rowErrors.push("khoản Chưa thu phải là khoản Thu, có email thành viên và không gắn sự kiện");
    }

    if (rowErrors.length) errors.push(`Dòng ${index + 2}: ${rowErrors.join("; ")}.`);
    else
      transactions.push({
        type: type!,
        amount,
        description,
        category: category || null,
        eventId: eventId ?? null,
        memberId: memberId ?? null,
        paid,
        transactionDate: transactionDate!,
      });
  });
  if (!rows.length) errors.push("File không có dòng dữ liệu nào.");
  return { transactions, errors };
}
