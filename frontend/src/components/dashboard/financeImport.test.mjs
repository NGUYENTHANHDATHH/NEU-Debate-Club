// Chạy: node --test src/components/dashboard/financeImport.test.mjs (Node >= 23.6 tự bỏ kiểu TS).
import assert from "node:assert/strict";
import test from "node:test";
import { parseTransactionsCsv } from "./financeImport.ts";

const events = [{ id: "ev1", title: "Debate Night" }];
const members = [{ id: "u1", email: "an.nguyen@gmail.com" }];

test("đọc file mẫu: BOM, dấu ; , ô có ngoặc kép, ngày dd/mm/yyyy, số tiền có dấu chấm, email, trạng thái", () => {
  const csv =
    "﻿Ngày;Loại;Số tiền;Mô tả;Danh mục;Sự kiện;Thành viên;Trạng thái\r\n" +
    '02/11/2026;Thu;5.000.000;"Tài trợ; đợt 1";Tài trợ;;;\r\n' +
    "2026-11-10;chi;1,200,000 đ;Thuê hội trường;Địa điểm;debate night;;Đã chi\r\n" +
    "15/11/2026;Thu;200000;Quỹ CLB năm 2026;Quỹ thành viên;;An.Nguyen@gmail.com;Chưa thu\r\n\r\n";
  const { transactions, errors } = parseTransactionsCsv(csv, events, members);
  assert.deepEqual(errors, []);
  assert.deepEqual(transactions, [
    { type: "INCOME", amount: 5_000_000, description: "Tài trợ; đợt 1", category: "Tài trợ", eventId: null, memberId: null, paid: true, transactionDate: "2026-11-02" },
    { type: "EXPENSE", amount: 1_200_000, description: "Thuê hội trường", category: "Địa điểm", eventId: "ev1", memberId: null, paid: true, transactionDate: "2026-11-10" },
    { type: "INCOME", amount: 200_000, description: "Quỹ CLB năm 2026", category: "Quỹ thành viên", eventId: null, memberId: "u1", paid: false, transactionDate: "2026-11-15" },
  ]);
});

test("file cũ không có cột Thành viên, Trạng thái vẫn nhập được", () => {
  const { transactions, errors } = parseTransactionsCsv("Ngày,Loại,Số tiền,Mô tả\n01/11/2026,Thu,100,Quỹ\n", events);
  assert.deepEqual(errors, []);
  assert.equal(transactions[0].memberId, null);
  assert.equal(transactions[0].paid, true);
});

test("khoản Chưa thu phải là khoản thu có thành viên, không sự kiện", () => {
  const header = "Ngày,Loại,Số tiền,Mô tả,Sự kiện,Thành viên,Trạng thái\n";
  const { errors } = parseTransactionsCsv(
    header +
      "01/11/2026,Chi,100,Hoàn ứng,,an.nguyen@gmail.com,Chưa thu\n" +
      "01/11/2026,Thu,100,Quỹ,,,Chưa thu\n" +
      "01/11/2026,Thu,100,Quỹ,Debate Night,an.nguyen@gmail.com,Chưa thu\n" +
      "01/11/2026,Thu,100,Quỹ,,,Nợ\n",
    events,
    members,
  );
  assert.equal(errors.length, 4);
  assert.match(errors[0], /^Dòng 2: khoản Chưa thu phải là/);
  assert.match(errors[3], /^Dòng 5: trạng thái "Nợ"/);
});

test("báo lỗi theo số dòng và thiếu cột", () => {
  const { transactions, errors } = parseTransactionsCsv(
    "Ngày,Loại,Số tiền,Mô tả,Danh mục,Sự kiện,Thành viên\n31/02/2026,Chuyển,0,,,Không có,ai@x.com\n",
    events,
    members,
  );
  assert.equal(transactions.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^Dòng 2: ngày .*loại .*số tiền .*thiếu mô tả.*không tìm thấy sự kiện.*không tìm thấy thành viên có email "ai@x.com"/);
  assert.match(parseTransactionsCsv("Ngày,Mô tả\n", events).errors[0], /Thiếu cột: loại, số tiền/);
});
