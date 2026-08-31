# Math12 Hub V37.5.4

**Build:** `37.5.4-native-freeform-graph-renderer`

V37.5.4 nâng trực tiếp từ V37.5.3 và giữ nguyên toàn bộ Dynamic Practice, Graph Reading, Unified Figure Renderer, Figure QC/Production, ID6 và Firestore.

## Native Freeform Graph Renderer

Pipeline hình TikZ hiện tại:

`Stored SVG → Native Freeform SVG → Smart Native SVG → TikZJax fallback`

V37.5.4 bổ sung native SVG cho các đồ thị TikZ vẽ tự do thường gặp trong đề THPT:

- Cubic Bézier: `.. controls (...) and (...) .. (...)`.
- Trộn Bézier và đoạn thẳng `--` trong cùng một `\draw`.
- `\foreach` tạo điểm đặc và nhãn/tọa độ.
- `\fill (...) circle(...)`.
- `dashed`, `thick`, mũi tên trục, node labels.
- Tôn trọng `scale=...`, `x=...cm`, `y=...cm` để giữ tỉ lệ hình.
- Hoạt động offline; TikZJax chỉ còn là fallback khi parser không chắc chắn.

Mẫu gây lỗi trắng ở V37.5.3 (đường cong Bézier + `\foreach`) đã được dùng làm regression bắt buộc của V37.5.4. Trên ngân hàng kiểm thử 278 câu, 13/13 hình freeform/foreach dựng được native ngay cả khi cố tình bỏ qua Stored SVG; riêng F1-03 GTLN–GTNN có 12 hình freeform và toàn bộ 22 hình của bài vẫn giữ Stored SVG làm lựa chọn ưu tiên.

## Nguyên tắc an toàn dữ liệu

Renderer này chỉ thay lớp hiển thị. Không tự thay đổi nội dung toán, đáp án, ID6, lessonId, reviewStatus, graphData hoặc xác minh hình của giáo viên. Stored SVG hợp lệ vẫn luôn được ưu tiên trước native renderer.

## Gói phát hành sạch

ZIP chỉ chứa runtime hiện tại, **một** Service Worker V37.5.4, README và VALIDATION hiện tại. Không kèm tests, preview, imports hoặc tài liệu/service-worker lịch sử. Tên module phiên bản cũ trong `assets/` được giữ lại khi `index.html` hiện vẫn tham chiếu chúng.
