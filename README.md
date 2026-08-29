# Math12 Hub V37.1.1 — Compact Question Bank UI

Bản vá giao diện nâng trực tiếp từ V37.1. Không thay đổi Firestore, Knowledge Map, Quality Engine, Smart Exam Matrix, Mastery, AI Teaching Intelligence hay Backup V2.

## Thay đổi giao diện Ngân hàng câu hỏi

- Chỉ giữ 6 thao tác chính ở đầu trang: Thêm câu hỏi, Tạo đề, Quality, Knowledge Map, Quét trùng và Công cụ.
- Gom Import/AI/Chuẩn hóa, Backup/Khôi phục, Export và Bảo trì vào menu Công cụ.
- 4 chỉ số chính hiển thị dạng thẻ gọn; 4 chỉ số phụ nằm trong “Xem thêm thống kê”.
- Knowledge Map Overview được thu chiều cao và Knowledge Map chi tiết mặc định đóng.
- Quality strip được thu gọn.
- Mobile chuyển công cụ phụ thành panel nổi phía dưới, tránh kéo ngang dãy nút.

## Tương thích

Dữ liệu và Backup V2 vẫn dùng schema/build V37.1; đây chỉ là patch UI.
# Math12 Hub V37.1 — Question Bank Backup V2

V37.1 được nâng trực tiếp từ V37. Toàn bộ AI Teaching Intelligence V37, Mastery & Adaptive V36.3, Smart Exam Matrix V36.2, Question Quality Engine V36.1, Knowledge Map V36.0, Firestore, phân quyền và UX V35.x được giữ nguyên.

## Mục tiêu V37.1

Khi ngân hàng tăng lên hàng nghìn hoặc hàng chục nghìn câu, một file JSON duy nhất trở nên khó kiểm tra và rủi ro khi khôi phục. V37.1 **không tách collection Firestore**; dữ liệu online vẫn là một ngân hàng thống nhất. Chỉ lớp sao lưu/khôi phục được tổ chức theo:

```text
TOÀN BỘ
  → CHƯƠNG
     → CHUNK 250 / 500 / 1000 CÂU
```

## 1. Backup V2 theo chương

Trong **Ngân hàng câu hỏi → Backup V2**, giáo viên có thể:

- xuất **ZIP toàn bộ ngân hàng**;
- xuất **ZIP riêng từng chương**;
- xuất **JSON riêng từng chương**;
- xuất **JSON tương thích V37** khi cần dùng với bản cũ.

Mặc định mỗi chunk chứa 500 câu; có thể chọn 250 hoặc 1000 câu/chunk.

## 2. Cấu trúc ZIP

Ví dụ:

```text
math12-question-bank-v37.1-YYYYMMDD-HHMM.zip
├── manifest.json
└── questions/
    ├── F1/
    │   ├── F1-001.json
    │   ├── F1-002.json
    │   └── F1-003.json
    ├── F2/
    │   └── F2-001.json
    └── ...
```

`manifest.json` chứa:

- phiên bản ứng dụng;
- thời điểm sao lưu;
- curriculum/Knowledge Map version;
- tổng số câu;
- số câu theo chương;
- kích thước chunk;
- danh sách file chunk;
- số byte;
- SHA-256;
- CRC32;
- global checksum.

ZIP được tạo hoàn toàn trên trình duyệt bằng chuẩn ZIP **STORE**, không phụ thuộc CDN và không gửi nội dung câu hỏi sang dịch vụ nén bên ngoài.

## 3. Kiểm tra toàn vẹn

Khi khôi phục ZIP V37.1, hệ thống kiểm tra:

1. CRC32 của từng entry ZIP;
2. CRC32 trong manifest;
3. SHA-256 từng chunk;
4. global checksum;
5. cấu trúc từng câu hỏi trước khi ghi.

Nếu thiếu chunk hoặc checksum sai, quá trình khôi phục bị dừng trước khi thay đổi ngân hàng.

## 4. Khôi phục theo phạm vi

Giáo viên có thể chọn:

- **Toàn bộ phạm vi trong file**;
- **một chương cụ thể** như F1, F2, ...

Ba chế độ:

### Chỉ thêm câu chưa có

An toàn nhất. ID đã tồn tại được giữ nguyên.

### Gộp — câu file cập nhật nếu trùng ID

Câu cùng ID trong file thay câu hiện có; câu mới được thêm.

### Ghi đè phạm vi đã chọn

Chỉ xóa câu hiện tại trong phạm vi đang chọn, rồi nạp câu của phạm vi đó từ backup. Ví dụ chọn F1 thì F2–F6 không bị chạm tới.

Chế độ ghi đè yêu cầu nhập `THAYTHE` để xác nhận.

## 5. Recovery Snapshot trước thao tác nguy hiểm

Trước khi ghi dữ liệu, V37.1 gọi Data Safety V26/V21 để tạo **Recovery Snapshot trong IndexedDB**. ID snapshot được ghi vào metadata của lần khôi phục.

Nút **Hoàn tác** của V37.1 ưu tiên phục hồi snapshot trước lần khôi phục gần nhất. Nếu không có snapshot V37.1 thì vẫn giữ fallback hoàn tác kiểu JSON cũ.

## 6. Tương thích ngược

V37.1 đọc được:

- ZIP Backup V2 của V37.1;
- JSON Backup V2 theo chương;
- file `{ questionBank: [...] }` của V37/V36/V35;
- mảng JSON câu hỏi kiểu legacy.

Do đó không bắt buộc chuyển đổi các file backup cũ ngay.

## 7. Firestore giữ nguyên

V37.1:

- không tạo collection mới;
- không tách `questionBanks` thành `questionsF1`, `questionsF2`, ...;
- không sửa `firestore.rules`;
- không sửa `firestore.indexes.json`;
- không migration dữ liệu cloud;
- không thay ID câu hỏi;
- không thay Knowledge Map/Quality/Mastery/AI engine.

## 8. Production Center

Regression V37.1 bổ sung kiểm tra:

- module Backup V2 đã nạp;
- ZIP writer/reader round-trip hoạt động;
- hỗ trợ JSON cũ;
- build đúng `37.1-question-bank-backup-v2`.

## Build

- `APP_VERSION = 37.1`
- `app-build = 37.1-question-bank-backup-v2`
- Service Worker: `sw-v37.1.1.js`
- Cache: `math12hub-v37-1-shell-11`
- Local assets: `?v=37.1`
- New module: `assets/js/bank-backup-v37.1.js`
- AI Teaching Intelligence engine vẫn dùng build nội bộ `37-ai-teaching-intelligence`
- Mastery engine vẫn dùng `36.3-mastery-adaptive`
- Smart Exam vẫn dùng `36.2-smart-exam`
- Quality Engine vẫn dùng `36.1-quality-engine`
- Knowledge Map vẫn dùng `36.0-knowledge-map`

## Sau khi triển khai GitHub Pages

1. Thay toàn bộ package V37 bằng V37.1.
2. Nhấn `Ctrl + F5` một lần để bỏ cache `shell-10`.
3. Đăng nhập tài khoản giáo viên → **Ngân hàng câu hỏi**.
4. Bấm **Backup V2**.
5. Thử **ZIP toàn bộ** và giữ file ở nơi an toàn.
6. Admin mở **Production Center → Chạy kiểm tra**.
7. Khi cần khôi phục, ưu tiên thử **Chỉ thêm** hoặc **Cập nhật ID** trước; chỉ dùng **Ghi đè** khi thật sự cần.
