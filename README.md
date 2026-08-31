# Math12 Hub V37.5.2

## Graph Reading Engine

V37.5.2 nâng trực tiếp từ V37.5.1, giữ nguyên Dynamic Practice, Figure Production, ID6, Firestore và toàn bộ nền tảng cũ.

### Điểm mới
- Thêm lớp `graphData` để website không chỉ hiển thị mà còn hiểu ngữ nghĩa đồ thị.
- Tự đọc TikZ tổng quát dùng đoạn thẳng `--`, cubic Bezier `.. controls ..`, điểm `\fill`, trục tọa độ và đường gióng.
- Đọc `graph2d` theo biểu thức bằng lấy mẫu số; đọc Graph THPT V37.3.3 qua native analyzer.
- Suy ra miền đọc, điểm đặc biệt, khoảng tăng/giảm, cực trị, GTLN/GTNN và giao trục khi đủ dữ liệu.
- Graph Reading QC kiểm tra source-hash; sửa mã hình làm `graphData` cũ bị báo stale.
- Trình soạn câu hỏi có nút **🧠 Đọc đồ thị**, preview ngữ nghĩa và JSON `graphData` có thể chỉnh tay.
- Graph Reading Center thống kê đồ thị đã bật, QC đạt, thiếu dữ liệu, stale hoặc độ tin cậy thấp.
- Dữ liệu ngữ nghĩa không hiển thị cho học sinh, không tự thay đổi câu hỏi, đáp án, ID6 hay reviewStatus.

### Mẫu regression chính
Mẫu TikZ gồm các điểm `(-2,7)`, `(1,-2)`, `(3,2)`, `(4,-4)` được đọc thành:
- giảm trên `[-2,1]`;
- tăng trên `[1,3]`;
- giảm trên `[3,4]`;
- cực tiểu `(1,-2)`; cực đại `(3,2)`;
- GTLN `7`, GTNN `-4`.

### Gói phát hành sạch
Gói ZIP chỉ giữ các file runtime đang được `index.html`/Service Worker sử dụng cùng README và VALIDATION của V37.5.2. Không kèm preview, tests hay README/VALIDATION/service worker lịch sử.
