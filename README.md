# Math12 Hub V21 — Data Safety Vault

V21 nâng trực tiếp từ V20, giữ nguyên Secure Exam V18, Low Reads V19 và kiến trúc module V20.

## Nâng cấp chính
- Dữ liệu cục bộ có `schemaVersion: 21`, `revision`, `deviceId`, `updatedAt`.
- Mỗi lần lưu vẫn dùng `localStorage` để khởi động nhanh và đồng thời mirror sang IndexedDB.
- Nếu `localStorage` đầy, V21 chuyển dữ liệu lớn sang IndexedDB fallback thay vì lỗi im lặng.
- Có điểm khôi phục tự động xoay vòng và điểm khôi phục thủ công.
- Có sao lưu/khôi phục **toàn bộ dữ liệu**: tiến độ, lịch sử, ngân hàng câu hỏi và đề đã lưu.
- Trước khi khóa dữ liệu giáo viên khi đăng xuất/chuyển quyền, V21 tạo bản cứu hộ rồi mới đưa `state` về ngân hàng mẫu.
- `Conflict Guard`: nếu nội dung giáo viên thay đổi đồng thời ở local và cloud, V21 tạm dừng tự ghi đè và cho chọn bản local, bản cloud hoặc gộp an toàn.
- Firestore thêm `users/{uid}/syncMeta/v21` chỉ để lưu manifest đồng bộ; các collection Secure Exam/Low Reads cũ giữ nguyên.

## Cấu trúc
- `index.html`: khung giao diện.
- `assets/css/app.css`: CSS chính.
- `assets/js/core.js`: chương trình học, state và version dữ liệu V21.
- `assets/js/authoring.js`: phân quyền, ngân hàng câu hỏi, LaTeX/TikZ, tạo đề, phân tích.
- `assets/js/data-vault.js`: IndexedDB, backup/restore, rescue và Data Safety Center.
- `assets/js/exam.js`: phòng thi.
- `assets/js/firebase.js`: Firebase Auth, Secure Exam, Low Reads và Conflict Guard.
- `assets/js/bootstrap.js`: khởi tạo bất đồng bộ sau khi kiểm tra Data Safety Vault.
- `firestore.rules`: Rules V21, bổ sung quyền cho `syncMeta`.

## Cập nhật GitHub Pages
1. Sao lưu bản V20 hiện tại.
2. Upload **toàn bộ** `index.html` và thư mục `assets/` của V21.
3. Cập nhật `firestore.rules` V21 vì V21 dùng thêm `users/{uid}/syncMeta/v21`.
4. Mở website, đăng nhập giáo viên và bấm **Dữ liệu & sao lưu** để kiểm tra trạng thái.

## Lưu ý
IndexedDB là kho cứu hộ trên chính trình duyệt/thiết bị, không thay thế bản backup tải ra file. Với dữ liệu quan trọng, nên định kỳ dùng nút **Xuất bản sao lưu** trong Data Safety Center.
