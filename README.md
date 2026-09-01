# Math12 Hub V37.6

**Build:** `37.6-exam-pro-engine`

V37.6 nâng trực tiếp từ V37.5.4, giữ nguyên ngân hàng câu hỏi, ID6, Dynamic Practice, Graph Reading, Unified/Freeform Figure Renderer, Secure Assignment, Smart Exam Matrix, Firestore Rules/Indexes và toàn bộ nền cũ.

## Exam Pro Engine

- Trung tâm **Thi thật / Luyện đề** mới ở trang Ôn thi THPT.
- Đề THPT mới ưu tiên câu `Approved` trong ngân hàng, giảm lặp câu gần đây và giữ cấu trúc 12 MCQ + 4 Đúng/Sai 4 ý + 6 trả lời ngắn. Nếu ngân hàng chưa đủ loại câu, engine chỉ dùng bộ đề mẫu hiện có để bù phần thiếu; không tự sinh nội dung toán.
- Chế độ **Thi thật 22 câu • 90 phút**, **Luyện đề 15 câu**, **Mục tiêu 8+**.
- Autosave/resume cũ được giữ nguyên; V37.6 bổ sung trạng thái online/offline, tiến độ, nhịp làm bài, thời gian từng câu, focus mode, fullscreen và phím tắt.
- Trước khi nộp có màn hình tổng quan số câu hoàn thành/chưa hoàn tất/đã đánh dấu.
- Sau thi phân tích độ chính xác, tốc độ, mức độ và mã kiến thức; có nút **Luyện lại câu sai** và **Sinh đề THPT mới**.
- Dữ liệu timing chỉ lưu trong state/localStorage cùng bài làm; không gửi telemetry ngoài hệ thống.

## Đóng gói

Release ZIP chỉ giữ runtime hiện tại, **một** Service Worker `sw-v37.6.js`, README và VALIDATION hiện tại. Không kèm tests, preview, imports hay tài liệu/service-worker lịch sử. Các module mang tên phiên bản cũ trong `assets/` vẫn được giữ khi runtime V37.6 còn tham chiếu trực tiếp.
