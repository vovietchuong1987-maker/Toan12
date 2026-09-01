# Math12 Hub V38.2.1 — Taxonomy Sync

Hotfix đồng bộ toàn bộ Chương 1 theo hệ ID6 chính thức, phát triển trực tiếp từ V38.2 Mastery + Avatar Evolution.

## Cấu trúc Chương 1 thống nhất

- F1-01 — Bài 1: Sự đồng biến và nghịch biến của hàm số — `2D1?1-*`
- F1-02 — Bài 2: Cực trị của hàm số — `2D1?2-*`
- F1-03 — Bài 3: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số — `2D1?3-*`
- F1-04 — Bài 4: Đường tiệm cận — `2D1?4-*`
- F1-05 — Bài 5: Khảo sát sự biến thiên và vẽ đồ thị hàm số — `2D1?5-*`

## Những gì V38.2.1 sửa

1. `core.js` không còn dùng sơ đồ cũ của Chương 1 ở lớp dữ liệu nền.
2. Thêm `taxonomy-sync-v38.2.1.js`: lấy ID6 của từng câu làm nguồn chuẩn để tự đồng bộ `lessonId`, `knowledgeCode`, `formId`, `id6Pattern`, `blueprintKey`, `taxonomyPath` và metadata liên quan.
3. Đồng bộ cả câu hỏi tải từ Firebase, lịch sử câu hỏi và questionResults khi có thể đối chiếu theo `questionId`.
4. Mọi lần `save()` đều chuẩn hóa taxonomy trước khi ghi local state; import/editor ID6 cũng nhận metadata mới.
5. Trang Nội dung bài học không còn tin tuyệt đối vào `lessonId` cũ; với Chương 1, ID6 quyết định bài đang thuộc.
6. Mastery/Adaptive Practice chuẩn hóa ngân hàng trước khi chọn câu, vì vậy không còn cảnh báo sai kiểu `F1-02.K1 (0 câu khả dụng)` chỉ do metadata cũ lệch bài.
7. Các vùng giao diện chính thay mã nội bộ `F1-xx.Kx` bằng tên bài + stem ID6 chính thức; mã K vẫn được giữ nội bộ để tương thích dữ liệu Mastery.
8. Không thay nội dung câu hỏi, đáp án, Firestore Rules, indexes hay cấu hình Firebase.

## Quy tắc câu tổng hợp

Một câu nhiều ý được xếp vào **bài học muộn nhất mà học sinh cần học xong để giải trọn câu**. Ví dụ: đơn điệu + cực trị + GTLN/GTNN + tiệm cận → Bài 4; nếu cần thêm tương giao/khảo sát đồ thị → Bài 5.

## Sau khi triển khai

Do V38.2.1 đổi Service Worker từ `sw-v38.2.js` sang `sw-v38.2.1.js`, nên sau khi tải bản mới lên GitHub Pages hãy mở trang và nhấn **Ctrl + F5** một lần.
