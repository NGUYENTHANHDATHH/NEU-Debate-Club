// Chạy: node --test src/lib/gmail.test.mjs (Node >= 23.6 tự bỏ kiểu TS).
import assert from "node:assert/strict";
import test from "node:test";
import { buildRawMessage } from "./gmail.ts";

const decode = (raw) => Buffer.from(raw, "base64url").toString("utf8");

test("thư không đính kèm là text/plain", () => {
  const mime = decode(buildRawMessage({ to: "a@b.vn", subject: "Chào", body: "Nội dung" }));
  assert.match(mime, /^To: a@b\.vn\r\n/);
  assert.match(mime, /Content-Type: text\/plain; charset="UTF-8"/);
  assert.ok(!mime.includes("multipart"));
  assert.equal(Buffer.from(mime.split("\r\n\r\n")[1], "base64").toString("utf8"), "Nội dung");
});

test("thư có đính kèm là multipart với đúng nội dung tệp", () => {
  const file = Buffer.from("x".repeat(200)).toString("base64");
  const mime = decode(
    buildRawMessage({ to: "a@b.vn", subject: "Vé", body: "Xin chào", attachment: { name: "qr.png", type: "image/png", base64: file } }),
  );
  const parts = mime.split("--ndc_mail_part");
  assert.equal(parts.length, 4); // tiêu đề, phần chữ, phần tệp, dấu kết "--"
  assert.equal(parts[3], "--");
  assert.equal(Buffer.from(parts[1].split("\r\n\r\n")[1], "base64").toString("utf8"), "Xin chào");
  assert.match(parts[2], /Content-Type: image\/png; name="qr\.png"/);
  assert.match(parts[2], /Content-Disposition: attachment; filename="qr\.png"/);
  assert.equal(parts[2].split("\r\n\r\n")[1].replace(/\r\n/g, ""), file);
});
