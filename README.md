# Math12 Hub V34 — Performance & Scale

V34 nâng trực tiếp từ V33, giữ nguyên Secure Exam V18, Low Reads V19, Data Safety V21/V26, Teacher Ops V27, Student UX V28, Question Bank V29, Exam Engine V30, Analytics V31, AI V32 và Reports V33.

## Nâng cấp chính

- **Dashboard + chi tiết lớp phân trang 60 học sinh/lần**; lần mở đầu chỉ đọc progress/studentStats của các em đang hiển thị.
- **Analytics toàn lớp lazy-load**: heatmap/bản đồ năng lực chi tiết chỉ quét đầy đủ khi giáo viên bấm “Tải phân tích đầy đủ”; snapshot tổng quan cũ vẫn được dùng để hiển thị nhanh và V34 không ghi đè snapshot bằng dữ liệu một phần.
- **Quản lý bài giao phân trang 60 bài/lần** thay vì ép tải toàn bộ danh sách mỗi lần mở.
- **Danh sách bài của học sinh giới hạn 80 bài mới nhất mỗi truy vấn target**, dùng `opensAt DESC`.
- **Migration marker V34**: sau lần chuẩn hóa đầu tiên, V18/V27 migration không quét lặp toàn bộ assignment ở các lần mở lớp sau.
- **Cache thích ứng 60–180 giây**, vẫn bị vô hiệu ngay khi có ghi mới.
- **Admin directory 100 document/trang** với cursor pagination; dùng aggregation `count()` khi SDK hỗ trợ để lấy tổng mà không tải toàn bộ document.
- **Performance Center**: reads ước tính, số query, cache hit, query chậm, storage estimate, cảnh báo và file diagnostics không chứa UID/email/đáp án.
- **Debounce tìm kiếm ngân hàng câu hỏi** để không render lại toàn bảng ở từng phím gõ.
- CSS `content-visibility` cho các danh sách dài để giảm chi phí layout/paint.

## Firestore indexes V34

V34 giữ 2 index ASC cũ và thêm 2 index DESC cho truy vấn 80 bài mới nhất của học sinh:

1. `targetMode ASC + opensAt DESC`
2. `targetUids ARRAY_CONTAINS + opensAt DESC`

Hãy deploy `firestore.indexes.json` và chờ hai index mới ở trạng thái **Enabled/Ready** trước khi dùng V34 cho học sinh.

## Thứ tự triển khai

1. Sao lưu V33.
2. Publish `firestore.rules` V34 (quyền dữ liệu không mở rộng so với V33).
3. Deploy `firestore.indexes.json` V34 và chờ 2 index DESC mới sẵn sàng.
4. Upload `index.html` + `assets/` lên GitHub Pages.
5. Giáo viên mở từng lớp một lần; V34 sẽ ghi marker migration để các lần sau không quét lặp.
6. Admin mở **Quản trị hệ thống → Hiệu năng & quy mô** để theo dõi reads/cache/query chậm.

## Lưu ý

- Metrics V34 là **ước tính phía client**, không thay thế Firebase Usage/Billing dashboard.
- Dashboard mặc định là **preview 60 học sinh/lần**. Khi cần ma trận năng lực/heatmap chính xác cho toàn lớp, bấm **Tải phân tích đầy đủ**; thao tác này có thể đọc toàn bộ dữ liệu aggregate của lớp và được thực hiện theo yêu cầu, không chạy nền.
- Admin tìm kiếm/lọc áp dụng trên **trang 100 document đang mở**; dùng nút Trang trước/Trang sau để duyệt hệ thống lớn.
- Không có collection Firestore mới.
- `reportsV33` và các chính sách link phụ huynh giữ nguyên.
