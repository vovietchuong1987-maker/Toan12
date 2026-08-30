# Math12 Hub V37.4.3 — Clean Question Bank Reset

Nâng trực tiếp từ **V37.4.2 Pure ID6 Taxonomy UI**. Bản này tạo một điểm khởi đầu sạch để xây lại ngân hàng câu hỏi theo chuẩn ID6.

## Thay đổi chính

- Ngân hàng mẫu/seed được **vô hiệu hóa**: cài mới bắt đầu với 0 câu.
- Thêm **Công cụ → Làm sạch ngân hàng** với quy trình 3 bước.
- Bắt buộc tải JSON sao lưu trước khi nút xóa được mở khóa.
- Trước khi xóa, hệ thống cố tạo Recovery Snapshot trong Data Safety/IndexedDB.
- Xóa:
  - toàn bộ câu hỏi đang hoạt động;
  - toàn bộ `_versions` gắn trong các câu cũ;
  - toàn bộ **câu hỏi** trong Thùng rác V26;
  - dấu hoàn tác khôi phục ngân hàng cũ trên localStorage.
- Giữ nguyên:
  - đề kiểm tra đã lưu (`customExams`);
  - thùng rác của đề;
  - lớp, học sinh, assignments/submissions;
  - lịch sử học tập, Mastery/Adaptive;
  - cấu trúc **6 chương – 17 bài – 91 dạng ID6**.
- Nếu giáo viên đang đăng nhập Firebase, reset sẽ force-sync `questionBank=[]`, giữ recycle của đề và kiểm tra lại cloud sau khi ghi.
- Nếu chưa đăng nhập Firebase, giao diện cảnh báo reset chỉ có hiệu lực trên máy hiện tại.
- Khi ngân hàng trống, empty state hướng thẳng tới **Import LaTeX/.tex** hoặc **Thêm câu hỏi**.

## Xác nhận xóa

1. Mở **Ngân hàng câu hỏi → Công cụ → Làm sạch ngân hàng**.
2. Bấm **Tải bản sao lưu bắt buộc**.
3. Đánh dấu xác nhận.
4. Nhập `XOA-SACH`.
5. Bấm **Xóa sạch & tạo ngân hàng mới**.

## Tương thích

- Không đổi `firestore.rules`.
- Không đổi `firestore.indexes.json`.
- Không tạo collection mới.
- Backup JSON trước reset có trường `questionBank`, vì vậy **Khôi phục V2** có thể đọc lại phần ngân hàng hoạt động.
- Các câu Word sau khi chuyển LaTeX có thể import lại theo Chương → Bài → Dạng → Mức độ → ID6.
