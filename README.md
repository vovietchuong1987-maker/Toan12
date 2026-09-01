# Math12 Hub V38.3 — Self-Study Full Bank

**Base:** V38.2.3 Bank Sync  
**Mục tiêu:** tập trung Math12 Hub vào tự học – ôn luyện – thi; học sinh được luyện toàn bộ câu hỏi hiện có trong ngân hàng theo bài học, đồng thời loại chức năng lớp học online khỏi luồng sử dụng.

## Thay đổi chính

### 1. Full Bank Self-Study
- Ngân hàng học sinh chứa **371/371 câu** của mốc ngân hàng hiện tại.
- Không dùng `reviewStatus` hay Figure QC làm điều kiện chặn khi học sinh tự ôn.
- Trạng thái `Approved/Draft` vẫn được giữ nguyên trong metadata để giáo viên quản trị.
- Phân bố:
  - F1-01: 91 câu
  - F1-02: 67 câu
  - F1-03: 50 câu
  - F1-04: 102 câu
  - F1-05: 61 câu
- Loại câu: 341 MCQ + 30 Đúng/Sai 4 ý.

### 2. Ôn theo bài khai thác hết ngân hàng
- `Luyện bộ nhanh`: tạo bộ cân bằng để học ngắn.
- `Tạo bộ mới`: đổi câu, ưu tiên tránh lặp.
- **Làm tất cả N câu**: mở toàn bộ câu của bài.
- Mỗi dạng ID6 có thêm nút **Tất cả N câu**.
- Ôn chương cũng đọc toàn bộ nguồn ngân hàng, không lọc Approved/QC.

### 3. Mastery / Sổ câu sai / Lộ trình
- Mastery chỉ tính và gợi ý các `knowledgeCode` thực sự có câu trong ngân hàng.
- Lịch sử cũ F2/F4/F6… không còn xuất hiện như một mục luyện nếu hiện không có câu tương ứng.
- Sổ câu sai dùng Full Bank thay vì `state.questionBank` rỗng của học sinh.
- Kế hoạch 7 ngày bỏ hoàn toàn ưu tiên bài giao/lớp online và chỉ gợi ý: câu sai → mã yếu có dữ liệu → bài có ngân hàng → đề tổng hợp.

### 4. Bỏ lớp học online
- Không còn nút `Lớp học online` / `Theo dõi lớp` ở sidebar và mobile nav.
- Teacher dashboard đổi sang: Ngân hàng câu hỏi → Tạo đề → Trợ lý AI.
- Smart Navigation không còn tìm/ghim lớp online.
- Hai section HTML `page-online` / `page-teacher` đã được loại khỏi bản phát hành; route cũ `online`/`teacher` vẫn có cầu nối chuyển về `Học theo bài` hoặc `Ngân hàng câu hỏi` để tương thích bookmark cũ.
- Khối `Quản trị lớp` được loại khỏi giao diện admin ở runtime để không còn luồng quản trị lớp trong sản phẩm tự học.
- Các module Firebase nền vẫn được giữ để đăng nhập, đồng bộ hồ sơ, avatar, tiến độ và tương thích dữ liệu cũ; không còn là tính năng lớp học trong UI.

## An toàn dữ liệu
- Không sửa `firestore.rules`.
- Không sửa `firestore.indexes.json`.
- Không sửa `firebase.json`.
- Không đổi nội dung/đáp án/ID6 của 371 câu.
- EXP, vàng, Shop, Mission, Achievement và Avatar Evolution được giữ nguyên.

## Triển khai
Sau khi thay toàn bộ thư mục bằng bản V38.3 trên GitHub Pages, nhấn **Ctrl + F5** một lần để trình duyệt nhận Service Worker `sw-v38.3.js`.
