# Math12 Hub V38.2.2 — Published Practice Bank

Bản vá kế tiếp V38.2.1, sửa lỗi trang **Nội dung bài học hiển thị 0 câu** khi dùng tài khoản học sinh hoặc khi chạy ở chế độ không mở ngân hàng riêng của giáo viên.

## Nguyên nhân

Từ V37.4.3, `SEED_QUESTION_BANK` được cố ý để rỗng. Cơ chế phân quyền cũ gọi `clearTeacherPrivateLocal()` với học sinh và thay `state.questionBank` bằng seed rỗng để bảo vệ ngân hàng riêng của giáo viên. Các mô-đun Học theo bài / Dynamic Practice / Mastery trước đây lại đọc trực tiếp `state.questionBank`, vì vậy học sinh nhìn thấy 0 câu dù giáo viên có ngân hàng thật.

## Sửa trong V38.2.2

- Tách **Published Practice Bank** khỏi ngân hàng riêng của giáo viên.
- Gói sẵn 278 câu **Approved** hiện hành của Chương 1 làm ngân hàng luyện tập read-only.
- Học sinh / chế độ offline chỉ đọc Published Practice Bank, không bao giờ nhận Draft hay ngân hàng riêng của giáo viên.
- Giáo viên/Admin khi luyện tập dùng hợp nhất Published Bank + ngân hàng riêng, khử trùng theo `id`; bản riêng của giáo viên được ưu tiên.
- `lesson-content-v37.7.js`, `dynamic-practice-v37.5.1.js` và `mastery-v36.3.js` cùng dùng một nguồn luyện tập thống nhất.
- Published Bank đã được chuẩn hóa lại `lessonId` và `knowledgeCode` theo ID6 V38.2.1.

## Dữ liệu Published Bank hiện có

- Tổng: **278 Approved MCQ**.
- Bài 1: **87** câu (NB 56 / TH 30 / VD 1).
- Bài 2: **60** câu (NB 37 / TH 22 / VD 1).
- Bài 3: **38** câu (NB 19 / TH 19).
- Bài 4: **93** câu (NB 51 / TH 38 / VD 4).
- Bài 5: **0 Approved trong snapshot 278 hiện tại**.

Các bộ KSHS/DSKSHS mới đang ở trạng thái Draft sẽ không tự xuất bản cho học sinh; điều này là chủ ý an toàn. Sau khi giáo viên duyệt Approved, cần cập nhật Published Bank trong một bản phát hành/publish kế tiếp nếu muốn học sinh trên thiết bị khác dùng ngay.

## Không thay đổi

- Firestore Rules / Indexes / Firebase config.
- Nội dung, đáp án và lời giải của ngân hàng giáo viên.
- ID6, chấm điểm, Exam Pro, avatar/game hóa.
