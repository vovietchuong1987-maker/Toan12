# Math12 Hub V36.3 — Mastery Score & Adaptive Learning

V36.3 được nâng trực tiếp từ V36.2. Toàn bộ Knowledge Map V36.0, Question Quality Engine V36.1, Smart Exam Matrix V36.2, Exam Engine Pro V30, Analytics V31, Scale V34 và UX V35.x được giữ nguyên.

## Trọng tâm V36.3

V36.3 bổ sung `assets/js/mastery-v36.3.js` để biến dữ liệu câu hỏi đã có thành một chỉ báo học tập theo từng `knowledgeCode`, sau đó dùng chỉ báo này để chọn câu luyện phù hợp hơn.

### 1. Mastery Score theo 57 mã kiến thức

Mỗi mã kiến thức có các trường suy ra tại runtime:

- Mastery Score 0–100%.
- Confidence (độ tin cậy của bằng chứng).
- Số lượt có dữ liệu.
- Trọng số Secure Exam đã xác minh và tự luyện.
- Xu hướng gần đây.
- Mức độ câu mục tiêu tiếp theo.
- Trạng thái:
  - Đang thu thập dữ liệu.
  - Cần học lại.
  - Cần củng cố.
  - Sẵn sàng nâng mức.
  - Đã làm chủ.

Mastery Score có tính trọng số theo nguồn dữ liệu, độ mới của kết quả, mức NB/TH/VD và độ khó câu nếu metadata có sẵn. Secure Exam đã chấm được ưu tiên trọng số hơn tự luyện.

> Mastery Score là chỉ báo cá nhân hóa, không thay thế điểm kiểm tra hoặc năng lực xác minh V31.

### 2. Luyện tập thích ứng V36.3

`startAdaptivePractice()` được nâng cấp nhưng vẫn giữ API cũ để các nút V28/V31 tiếp tục hoạt động.

Bộ chọn mới:

- Ưu tiên mã có Mastery thấp và đủ bằng chứng.
- Nếu chưa có dữ liệu, có thể bắt đầu từ chuẩn đầu tiên của bài chưa hoàn thành.
- Chọn độ khó gần mức Mastery hiện tại.
- Ưu tiên câu chưa làm hoặc từng làm sai.
- Giảm ưu tiên câu vừa làm đúng gần đây.
- Loại câu có lỗi nghiêm trọng theo Question Quality Engine V36.1.
- Khi một mã thiếu câu, có thể bổ sung từ các mã cùng bài để vẫn tạo được phiên luyện.
- Không phát sinh Firestore Reads khi chọn câu; dùng ngân hàng đã tải trên thiết bị.

### 3. Sổ lỗi và lịch ôn

V36.3 dựng `mistakeBank()` từ lịch sử hiện có để biết:

- Câu từng sai bao nhiêu lần.
- Lần gần nhất còn sai hay đã sửa được.
- Chuỗi trả lời đúng sau lỗi.
- Câu nào đang đến hạn nên ôn lại.

Dashboard Mastery hiển thị số câu sai/ôn lại đang đến hạn. Dữ liệu gốc vẫn là `questionHistory`; không tạo kho Firestore riêng.

### 4. Dashboard học sinh

Trang chủ được bổ sung thẻ **Mastery Score V36.3** gồm:

- Mastery trung bình của các mã có bằng chứng.
- Số mã đã làm chủ.
- Số mã sẵn sàng nâng mức.
- Số mã cần học lại/củng cố.
- Số câu sai đến hạn ôn.
- 5 mã yếu nhất với nút luyện trực tiếp.

Trang **Phân tích năng lực** có bảng Mastery chi tiết cho từng mã, Confidence, xu hướng và độ khó mục tiêu.

### 5. Góc nhìn giáo viên

Dashboard lớp có thêm **Mastery Class View V36.3**.

Dữ liệu đọc từ snapshot `progress.masteryV363` vốn nằm trong document progress hiện có, vì vậy:

- Không tạo collection mới.
- Không tải toàn bộ submission nền.
- Không làm thay đổi cơ chế năng lực xác minh V31.
- Có thể nhìn nhanh mã nào nhiều học sinh cần củng cố và chuyển sang luồng tạo bài củng cố.

Snapshot cá nhân hóa không được coi là điểm chính thức; Secure Exam V31 vẫn là nguồn xác minh của giáo viên.

### 6. Đồng bộ Firestore tương thích cũ

V36.3 chỉ mở rộng payload đã có:

- `users/{uid}/learning/progress` có thêm `masteryV363`.
- `classes/{classId}/progress/{studentUid}` có thêm `masteryV363`.

Firestore Rules hiện tại đã cho học sinh cập nhật document progress của chính mình nên không cần rule mới. Không có migration bắt buộc.

## Production Center

Regression V36.3 kiểm tra thêm:

- Module `36.3-mastery-adaptive` đã nạp.
- Mastery tính được từ một bộ bằng chứng mẫu.
- Secure Exam có trọng số lớn hơn practice trong regression.
- Mastery Score nằm trong miền hợp lệ và có Confidence.

Các regression cũ vẫn giữ nguyên:

- cấu trúc đề THPT 12–4–6;
- thang điểm Đúng/Sai;
- phân quyền;
- Knowledge Map V36.0;
- Question Quality Engine V36.1;
- Smart Exam Matrix V36.2.

## Tương thích dữ liệu

- Không tạo Firestore collection mới.
- Không đổi `firestore.rules`.
- Không đổi `firestore.indexes.json`.
- Không đổi ID câu hỏi.
- Không xóa lịch sử V35/V36.0–36.2.
- Dữ liệu Mastery có thể tái tạo từ `questionHistory` hiện có.

## Build

- `APP_VERSION = 36.3`
- `app-build = 36.3-mastery-adaptive`
- Service Worker cache: `math12hub-v36-shell-9`
- Local assets: `?v=36.3`
- New module: `assets/js/mastery-v36.3.js`
- Smart Exam vẫn dùng build nội bộ: `36.2-smart-exam`
- Quality Engine vẫn dùng build nội bộ: `36.1-quality-engine`
- Knowledge Map vẫn dùng build nội bộ: `36.0-knowledge-map`

## Sau khi triển khai GitHub Pages

1. Thay toàn bộ package V36.2 bằng V36.3.
2. Nhấn `Ctrl + F5` một lần để bỏ cache `shell-8`.
3. Đăng nhập học sinh và làm ít nhất một bài có `knowledgeCode` để Mastery bắt đầu có bằng chứng.
4. Mở **Trang chủ** hoặc **Phân tích năng lực** để xem Mastery Score.
5. Bấm **Luyện theo Mastery / Luyện điểm yếu** để thử bộ chọn thích ứng V36.3.
6. Với giáo viên, mở **Theo dõi lớp** sau khi học sinh đã đồng bộ progress để xem Mastery Class View.
7. Admin vào **Production Center → Chạy kiểm tra**.
