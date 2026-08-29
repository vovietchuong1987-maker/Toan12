# Math12 Hub V37 — AI Teaching Intelligence

V37 được nâng trực tiếp từ V36.3, không viết lại nền tảng. Toàn bộ Knowledge Map V36.0, Question Quality Engine V36.1, Smart Exam Matrix V36.2, Mastery & Adaptive V36.3, Exam Engine Pro V30, Analytics V31, Scale V34 và UX V35.x được giữ nguyên.

## Trọng tâm V37

V37 bổ sung `assets/js/ai-intelligence-v37.js` để biến dữ liệu lớp + Mastery thành **Teaching Intelligence** cho giáo viên. AI không được phép tự giao bài, tự sửa điểm, tự duyệt câu hỏi hay tự xuất bản nội dung.

### 1. Teaching Brief cục bộ theo lớp

Khi giáo viên bấm **Phân tích lớp**, V37 dùng dữ liệu lớp đã có để dựng:

- số học sinh;
- điểm trung bình đã xác minh;
- tỷ lệ hoàn thành bài;
- độ phủ Mastery snapshot;
- số bài/lượt nộp cần xử lý;
- các mã kiến thức cần ưu tiên;
- nhóm học tập động.

Teaching Brief cục bộ không cần Gemini API key.

### 2. Xếp ưu tiên mã kiến thức

V37 kết hợp:

- Mastery Score V36.3;
- Confidence;
- số học sinh có bằng chứng;
- tỷ lệ học sinh dưới ngưỡng cần củng cố;
- độ phủ bằng chứng trong lớp.

Mỗi mã ưu tiên có thể chuyển trực tiếp sang:

- **Soạn câu AI**: chỉ chuẩn bị yêu cầu trong AI Editor, giáo viên vẫn phải bấm tạo nháp;
- **Tạo bài**: dùng luồng bài củng cố hiện có, giáo viên vẫn phải xem lại và bấm Giao bài.

### 3. Nhóm học tập động

V37 tiếp tục dùng cơ chế phân nhóm hiện có:

- Cần hỗ trợ;
- Đang củng cố;
- Khá / tốt;
- Đang trễ bài;
- Chưa đủ dữ liệu.

Nhấn một nhóm để xem học sinh cục bộ. Không gửi danh sách tên học sinh sang AI.

### 4. Privacy Guard V37

Đây là thay đổi quan trọng của V37.

Khi giáo viên bấm **Tạo kế hoạch AI**, payload gửi sang Gemini chỉ chứa số liệu tổng hợp:

- số học sinh;
- điểm trung bình lớp;
- tỷ lệ hoàn thành;
- độ phủ Mastery;
- số lượng từng nhóm;
- các `knowledgeCode` ưu tiên và Mastery trung bình tương ứng.

Payload AI **không chứa**:

- tên học sinh;
- email;
- UID;
- tên lớp;
- classId.

Production Center có regression riêng để kiểm tra Privacy Guard.

### 5. Kế hoạch dạy học AI — luôn là bản nháp

Gemini có thể tạo JSON có cấu trúc gồm:

- tóm tắt lớp;
- ưu tiên kiến thức;
- mục tiêu và mức NB/TH/VD đề xuất;
- phân hóa hoạt động theo nhóm;
- tiến trình dạy học theo pha và thời lượng;
- minh chứng cần quan sát;
- bài về nhà;
- các mục giáo viên cần kiểm tra;
- cảnh báo của AI.

Kế hoạch được lưu tối đa 20 bản **trên thiết bị** để giáo viên xem lại. Không tạo collection Firestore mới.

### 6. Kết nối V37 với V36

Luồng dữ liệu hiện tại:

```text
Knowledge Map V36.0
        ↓
Question Quality Engine V36.1
        ↓
Smart Exam Matrix V36.2
        ↓
Mastery & Adaptive V36.3
        ↓
AI Teaching Intelligence V37
```

V37 không thay thế các engine cũ mà dùng kết quả của chúng để đưa ra gợi ý dạy học.

### 7. AI Question Authoring V32 vẫn được giữ

Adapter Gemini V32 vẫn là module tải theo nhu cầu. V37 chỉ mở rộng `v32GeminiGenerate()` để cho phép truyền system instruction riêng cho kế hoạch dạy học; toàn bộ chức năng cũ đọc ảnh/PDF/LaTeX, kiểm định câu và tạo biến thể vẫn giữ nguyên.

## Firestore và dữ liệu

V37:

- không tạo collection Firestore mới;
- không sửa `firestore.rules`;
- không sửa `firestore.indexes.json`;
- không migration dữ liệu;
- không thay ID câu hỏi;
- không thay cơ chế Secure Exam;
- không ghi kế hoạch AI lên Firestore mặc định.

## Production Center

V37 giữ tất cả regression cũ và bổ sung:

- module `37-ai-teaching-intelligence` đã nạp;
- Privacy Guard loại tên/email/UID/classId/tên lớp khỏi payload AI;
- Teaching Intelligence vẫn xác định được `knowledgeCode` ưu tiên từ dữ liệu Mastery mẫu.

## Build

- `APP_VERSION = 37`
- `app-build = 37-ai-teaching-intelligence`
- Service Worker: `sw-v37.js`
- Cache: `math12hub-v37-shell-10`
- Local assets: `?v=37`
- New module: `assets/js/ai-intelligence-v37.js`
- Mastery engine vẫn dùng build nội bộ `36.3-mastery-adaptive`
- Smart Exam vẫn dùng `36.2-smart-exam`
- Quality Engine vẫn dùng `36.1-quality-engine`
- Knowledge Map vẫn dùng `36.0-knowledge-map`

## Sau khi triển khai GitHub Pages

1. Thay toàn bộ package V36.3 bằng V37.
2. Nhấn `Ctrl + F5` một lần để bỏ cache `shell-9`.
3. Đăng nhập giáo viên và mở **AI Teaching Intelligence**.
4. Chọn lớp → **Phân tích lớp**.
5. Xem các mã ưu tiên và nhóm học tập động.
6. Nếu có Gemini API key, bấm **Tạo kế hoạch AI**; kiểm tra kỹ bản nháp trước khi dùng.
7. Admin mở **Production Center → Chạy kiểm tra** để xác nhận Privacy Guard và các regression cũ.
