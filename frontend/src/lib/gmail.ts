// Gửi thư bằng chính Gmail của người dùng: trình duyệt xin quyền gmail.send rồi gọi thẳng Gmail API.
// Token chỉ nằm trong bộ nhớ của trang (không lưu, không gửi về backend) và hết hạn sau khoảng 1 giờ.

const SCOPE = "https://www.googleapis.com/auth/gmail.send";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** `attachment.base64` là base64 chuẩn (không phải base64url) của nội dung tệp. */
export type MailMessage = {
  to: string;
  subject: string;
  body: string;
  attachment?: { name: string; type: string; base64: string };
};

type TokenResponse = { access_token?: string };
type GoogleOAuth2 = {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    hint?: string;
    callback: (response: TokenResponse) => void;
    error_callback?: () => void;
  }): { requestAccessToken(): void };
  hasGrantedAllScopes(response: TokenResponse, scope: string): boolean;
};

const oauth2 = () => (window as { google?: { accounts?: { oauth2?: GoogleOAuth2 } } }).google?.accounts?.oauth2;

export const gmailConfigured = Boolean(CLIENT_ID);

let script: Promise<void> | null = null;

/** Tải thư viện Google Identity Services. Gọi khi mở trang để lúc bấm gửi cửa sổ Google mở được ngay. */
export function loadGmailClient() {
  script ??= new Promise<void>((resolve, reject) => {
    const element = document.createElement("script");
    element.src = "https://accounts.google.com/gsi/client";
    element.async = true;
    element.onload = () => resolve();
    element.onerror = () => {
      script = null; // cho phép thử lại ở lần mở trang sau
      reject(new Error("Không tải được dịch vụ đăng nhập Google."));
    };
    document.head.appendChild(element);
  });
  return script;
}

/** Mở cửa sổ Google xin quyền gửi thư. Phải gọi trực tiếp trong một cú bấm, nếu không trình duyệt chặn popup. */
export function requestGmailToken(hint?: string) {
  return new Promise<string>((resolve, reject) => {
    const google = oauth2();
    if (!google || !CLIENT_ID) {
      reject(new Error("Chưa tải được dịch vụ đăng nhập Google, hãy tải lại trang."));
      return;
    }
    google
      .initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        hint,
        callback: (response) =>
          response.access_token && google.hasGrantedAllScopes(response, SCOPE)
            ? resolve(response.access_token)
            : reject(new Error("Bạn chưa cấp quyền gửi thư từ Gmail.")),
        error_callback: () => reject(new Error("Cửa sổ kết nối Gmail đã bị đóng hoặc bị trình duyệt chặn.")),
      })
      .requestAccessToken();
  });
}

function base64(text: string) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Thư RFC 2822 dạng base64url cho Gmail API. Không có From: Gmail tự điền tài khoản đã cấp quyền. */
export function buildRawMessage({ to, subject, body, attachment }: MailMessage) {
  const wrap = (encoded: string) => encoded.replace(/.{76}/g, "$&\r\n");
  const text = ['Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap(base64(body))];
  // Ranh giới có dấu "_" nên không bao giờ trùng một dòng base64 của nội dung.
  const boundary = "ndc_mail_part";
  const content = attachment
    ? [
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        ...text,
        `--${boundary}`,
        `Content-Type: ${attachment.type}; name="${attachment.name}"`,
        `Content-Disposition: attachment; filename="${attachment.name}"`,
        "Content-Transfer-Encoding: base64",
        "",
        wrap(attachment.base64),
        `--${boundary}--`,
      ]
    : text;
  // Tiêu đề tiếng Việt phải mã hoá RFC 2047; cắt 10 ký tự/đoạn để mỗi đoạn ≤ 75 ký tự và không cắt giữa một ký tự.
  const characters = Array.from(subject.replace(/[\r\n]+/g, " "));
  const words: string[] = [];
  for (let i = 0; i < characters.length; i += 10) {
    words.push(`=?UTF-8?B?${base64(characters.slice(i, i + 10).join(""))}?=`);
  }
  const mime = [
    `To: ${to.replace(/[\r\n]/g, "")}`,
    `Subject: ${words.join("\r\n ")}`,
    "MIME-Version: 1.0",
    ...content,
  ].join("\r\n");
  return base64(mime).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Gửi một thư. Lỗi mang `status` HTTP của Gmail (không có = lỗi mạng) để nơi gọi biết nên dừng hay gửi tiếp. */
export async function sendGmail(token: string, message: MailMessage) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: buildRawMessage(message) }),
  });
  if (response.ok) return;
  const detail = (await response.json().catch(() => null))?.error?.message;
  throw Object.assign(new Error(detail || `Gmail trả lỗi ${response.status}.`), { status: response.status });
}
