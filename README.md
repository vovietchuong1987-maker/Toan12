# Math12 Hub V37.5.3

## Unified Figure Renderer

V37.5.3 nâng trực tiếp từ V37.5.2, giữ nguyên Graph Reading, Dynamic Practice, Figure Production, ID6, Firestore và toàn bộ chức năng cũ.

### Điểm mới
- Thống nhất pipeline hiển thị TikZ và `tkz-tab`.
- `tkz-tab` nay ưu tiên **Stored SVG đã biên dịch từ LaTeX** nếu SVG hợp lệ và khớp `figureSourceHash`.
- Chuẩn hóa SVG có XML/comment của Inkscape trước thẻ `<svg>`; đây là lỗi khiến một số SVG LaTeX hợp lệ trước đây bị sanitizer cũ bỏ qua.
- Cơ chế Stored SVG ưu tiên áp dụng lại cho cả `tikz`/`tkz`, nên đồ thị và BBT dùng chung một pipeline.
- Khi không có Stored SVG hợp lệ, hệ thống mới dùng Native BBT làm fallback.
- Stored SVG của BBT đi qua cùng lớp Auto-crop, Responsive sizing và Vector Zoom V37.4.6 như đồ thị TikZ.
- Native BBT fallback có auto-fit theo khung, giới hạn co để giữ chữ dễ đọc, và có cửa sổ phóng to riêng.
- Figure QC API nhận biết `tkz-tab` đang dùng Stored SVG.
- Production regression bổ sung kiểm tra số BBT dùng Stored SVG, native fallback và SVG lệch source-hash.
- Không thay đổi nội dung Toán, đáp án, ID6, lessonId, reviewStatus hay dữ liệu xác minh hình của giáo viên.

### Kiểm tra riêng nhóm GTLN–GTNN
Ngân hàng kiểm thử 278 câu hiện có 38 câu thuộc nhóm minmax đã nhập gần nhất: 14 TikZ, 8 `tkz-tab`, 16 không hình. Cả 8 BBT và 14 đồ thị TikZ đều có Stored SVG trong bộ minmax; V37.5.3 đã kiểm thử 22/22 hình này qua đường Stored SVG, thay vì để comment Inkscape làm sanitizer bỏ qua.

### Gói phát hành sạch
ZIP chỉ giữ runtime hiện tại, một Service Worker V37.5.3, README và VALIDATION hiện tại. Không kèm tests, preview, imports hay tài liệu/service worker lịch sử.
