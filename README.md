# Math12 Hub V38.3.1 — Student Practice Hotfix

Bản vá trực tiếp trên nền V38.3, giữ nguyên toàn bộ kiến trúc và dữ liệu cũ.

## Sửa lỗi chính
- Tài khoản học sinh không còn lấy câu luyện từ `state.questionBank` (vùng bị làm rỗng có chủ đích để bảo vệ ngân hàng riêng của giáo viên).
- Mọi luồng luyện/kiểm tra phía học sinh dùng `getPracticeQuestionBank()` → ngân hàng công khai đóng gói.
- Exam Pro V37.6 cũng dùng nguồn luyện tập công khai/hiệu lực thay vì ngân hàng private trong state.
- Học theo bài báo rõ khi một chương chưa có câu và có nút chuyển đến chương đang có dữ liệu.
- Tăng cache key lên V38.3.1 để tránh Service Worker giữ bản JS cũ.

## Dữ liệu hiện có
- 371 câu tự học công khai.
- Tất cả 371 câu hiện thuộc Chương 1 (F1-01 → F1-05): 91 / 67 / 50 / 102 / 61 câu.
- Các chương khác chưa có câu trong gói này; đây là thiếu dữ liệu, không phải lỗi phân quyền.

## Quyền
- Học sinh: được luyện câu công khai nhưng không được mở trang Ngân hàng câu hỏi của giáo viên.
- Giáo viên/Admin: tiếp tục dùng ngân hàng private + dữ liệu công khai hợp nhất khi luyện/Exam Pro.
