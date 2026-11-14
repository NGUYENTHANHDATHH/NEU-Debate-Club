/** Một người nhận: tên cột (chữ thường) → giá trị; luôn có `email`. */
export type Recipient = Record<string, string>;

const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g;

/**
 * Đọc danh sách dán từ Sheets/Excel (tab) hoặc CSV (dấu , hoặc ;).
 * Dòng đầu là tiêu đề nếu có cột "email"; không thì cột đầu là email, các cột sau tên là cot2, cot3...
 * Danh sách chỉ gồm địa chỉ email (mỗi dòng một hoặc nhiều địa chỉ) được tách thành từng người.
 */
// shortcut: không hiểu ô CSV có dấu ngoặc kép chứa dấu phân cách; dán thẳng từ Sheets (tab) thì không gặp.
// Cần nhập file CSV phức tạp thì thay bằng một thư viện CSV.
export function parseRecipients(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { columns: ["email"], recipients: [] as Recipient[], invalid: [] as string[], duplicates: 0 };

  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  let rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  const header = rows[0].map((cell) => cell.toLowerCase());
  const hasHeader = header.includes("email");
  let columns = hasHeader ? header : ["email", ...rows[0].slice(1).map((_, index) => `cot${index + 2}`)];
  if (hasHeader) {
    rows = rows.slice(1);
  } else if (rows.flat().every((cell) => !cell || EMAIL.test(cell))) {
    rows = rows.flat().filter(Boolean).map((cell) => [cell]);
    columns = ["email"];
  }

  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  const invalid: string[] = [];
  let duplicates = 0;
  for (const cells of rows) {
    const row: Recipient = {};
    columns.forEach((column, index) => {
      if (column) row[column] = cells[index] ?? "";
    });
    const email = (row.email ?? "").toLowerCase();
    if (!EMAIL.test(email)) invalid.push(cells.filter(Boolean).join(" | "));
    else if (seen.has(email)) duplicates++;
    else {
      seen.add(email);
      recipients.push({ ...row, email });
    }
  }
  return { columns: columns.filter(Boolean), recipients, invalid, duplicates };
}

/** Thay {{tên cột}} bằng giá trị của người nhận; biến không có cột tương ứng được giữ nguyên. */
export function renderTemplate(template: string, row: Recipient) {
  return template.replace(PLACEHOLDER, (match, key: string) => row[key.toLowerCase()] ?? match);
}

/** Các biến trong mẫu không khớp cột nào của danh sách. */
export function unknownPlaceholders(template: string, columns: string[]) {
  const keys = [...template.matchAll(PLACEHOLDER)].map((match) => match[1].toLowerCase());
  return [...new Set(keys)].filter((key) => !columns.includes(key));
}
