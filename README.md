# Math12 Hub V36.1 — Question Quality Engine

V36.1 được nâng trực tiếp từ V36.0. Knowledge Map 6 chương / 19 bài / 57 đơn vị kiến thức / 57 dạng toán được giữ nguyên; toàn bộ nền V34 Scale, V35 Production Hardening, Role-aware UI, UX Polish và Smart Navigation tiếp tục tương thích.

## Trọng tâm V36.1

V36.1 bổ sung `assets/js/quality-engine-v36.1.js`, chạy cục bộ trên ngân hàng câu hỏi đã tải trong phiên. Module không tự tạo Firestore query mới.

Question Quality Engine kiểm tra:

- Cấu trúc câu hỏi và loại câu `mcq / tf / tf4 / short`.
- MCQ theo cấu trúc 4 phương án A–D; phát hiện phương án trống hoặc trùng sau chuẩn hóa.
- Kiểm tra chỉ số đáp án MCQ và các dấu `\\True` còn sót/mâu thuẫn.
- Câu Đúng/Sai 4 ý: đúng 4 mệnh đề, đáp án boolean, ý trùng, thiếu lời giải từng ý và dấu hiệu các ý ít liên kết với dữ kiện chung.
- Câu trả lời ngắn thiếu đáp án.
- LaTeX: cặp `$...$`, `\\(...\\)`, `\\[...\\]`, ngoặc nhọn, `\\begin/\\end`, `\\left/\\right`.
- Dữ kiện: cảnh báo khi đề nhắc hình, đồ thị, bảng biến thiên… nhưng chưa có hình kèm theo; nhận diện placeholder như `...`, `___`, `[?]`, TODO.
- Metadata Knowledge Map V36 đã lưu: `questionBankSchema`, `knowledgeMapVersion`, `formId`, `blueprintKey`.
- Nguồn, trạng thái bản nháp và lời giải.
- Near-duplicate: dùng lại bộ quét gần trùng V29 khi giáo viên chủ động chạy quét toàn bộ.

## Quality Center

Trong **Ngân hàng câu hỏi** có khối **Question Quality Engine V36.1** với:

- Điểm kỹ thuật trung bình.
- Số câu có lỗi nghiêm trọng.
- Số câu cần rà soát.
- Số câu đạt sạch.
- Nút `Quét toàn bộ` và `Mở Quality Center`.
- Bộ lọc `QC V36.1: tất cả / Có lỗi kỹ thuật / Cần rà soát / Không lỗi-cảnh báo`.
- Nhấn trực tiếp điểm QC của từng câu để xem chi tiết và mở trình sửa.
- Xuất báo cáo audit JSON.

## Kiểm tra trực tiếp khi soạn câu

Khi mở **Thêm/Sửa câu hỏi**, V36.1 thêm bảng QC trực tiếp ngay trước phần xem trước. Kiểm tra cập nhật sau khi giáo viên nhập dữ liệu.

Nếu câu đang được đặt `Đã duyệt` nhưng phát hiện lỗi kỹ thuật nghiêm trọng, khi lưu V36.1 tự chuyển câu về `Bản nháp`. Nội dung Toán, đáp án và lời giải không bị tự động sửa.

## Sửa an toàn

Nút **Sửa an toàn** trong Quality Center chỉ:

1. Chuẩn hóa metadata Knowledge Map V36 nếu có thể.
2. Chuyển câu có lỗi nghiêm trọng từ `Đã duyệt` về `Bản nháp`.

Không thay nội dung câu hỏi, phương án, đáp án hoặc lời giải. Nếu Data Safety sẵn sàng, hệ thống tạo recovery snapshot trước khi ghi.

## Giới hạn chuyên môn

Quality Engine là lớp kiểm tra kỹ thuật và heuristic. V36.1 **không dùng CAS để chứng minh rằng mọi đáp án toán học là đúng/sai**, vì vậy không thay thế khâu duyệt chuyên môn của giáo viên. Cảnh báo liên kết giữa các ý Đúng/Sai hoặc thiếu dữ kiện là tín hiệu để rà soát, không phải kết luận tuyệt đối.

## Tương thích dữ liệu

- Không tạo Firestore collection mới.
- Không bắt buộc migration Firestore Rules.
- Không đổi ID câu hỏi.
- Không xóa dữ liệu V36.0/V35.x.
- Knowledge Map V36.0 vẫn dùng build nội bộ `36.0-knowledge-map` để giữ tương thích metadata.

## Build

- `APP_VERSION = 36.1`
- `app-build = 36.1-quality-engine`
- Service Worker cache: `math12hub-v36-shell-7`
- Local assets: `?v=36.1`
- New module: `assets/js/quality-engine-v36.1.js`

## Sau khi triển khai GitHub Pages

Thực hiện `Ctrl + F5` một lần để trình duyệt bỏ shell V36.0. Sau đó:

1. Đăng nhập Teacher/Admin.
2. Mở **Ngân hàng câu hỏi**.
3. Bấm **Quét toàn bộ** hoặc **Quality V36.1**.
4. Rà các câu đỏ trước, sau đó các câu vàng.
5. Vào **Production Center** và chạy regression check.
