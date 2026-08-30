# Math12 Hub V37.4.8 — Bulk Figure Manager & Re-render Center

Nâng trực tiếp từ **V37.4.7**, giữ nguyên Approved Gate, Figure QC, Hybrid Figure Engine, Auto Crop/Responsive/Zoom và toàn bộ module cũ.

## Điểm mới V37.4.8

- Thêm **Công cụ → Trung tâm Hình V37.4.8** để quản lý hình theo lô.
- Dashboard thống kê: đã xác minh, Approved cũ, cần xem, QC lỗi, Stored SVG, Native/Smart và Fallback.
- Lọc theo trạng thái QC, `figureMode`, engine, ID/ID6/nguồn/nội dung.
- Chọn hàng loạt và chạy **QC lại** mà không tự xác minh hình thay giáo viên.
- **Tạo Smart SVG theo lô** cho TikZ/tkz mà native parser hỗ trợ; lưu `figureSvg` + hash nguồn để lần sau ưu tiên Stored SVG.
- **Chuẩn hóa layout theo lô** (`figureKind`, `figureDisplay`) nhưng không sửa mã TikZ/LaTeX.
- Có thể **đánh dấu cần xem lại** để thu hồi dấu xác minh hình mà vẫn giữ trạng thái Approved của câu.
- Có công cụ **xóa cache SVG** khi cần render lại; mã nguồn hình luôn được giữ.
- Mọi thao tác theo lô có **Hoàn tác lô gần nhất** trong phiên làm việc.
- Xuất **Figure QC CSV** cho các hình đang lọc.
- Xử lý theo batch có progress/yield để ngân hàng lớn ít gây treo giao diện.
- Không đổi `firestore.rules`, `firestore.indexes.json`, không tạo collection mới và không tự thay nội dung toán học.

## Nguyên tắc an toàn

V37.4.8 **không có nút xác minh hàng loạt “Hình đúng”**. Xác minh trực quan vẫn phải thực hiện trong editor V37.4.7 để tránh một batch render kỹ thuật vô tình được coi là đã kiểm tra bằng mắt.

---

# Math12 Hub V37.4.7 — Figure QC + Preview trước Approved

Nâng trực tiếp từ **V37.4.6**, giữ nguyên Hybrid Figure Engine V37.4.5, Auto Crop/Responsive/Zoom V37.4.6 và toàn bộ nền tảng cũ.

## Điểm mới V37.4.7

- Thêm **Figure QC** cho TikZ, tkz, tkz-tab, graph2d và Oxyz.
- Khi câu mới/chuyển trạng thái sang **Approved** và có hình, bắt buộc **Kiểm tra & xem hình → ✓ Hình đúng** trước khi lưu Approved.
- Xác minh gắn với `sourceHash`; thay mã hình sẽ tự hủy dấu xác minh cũ.
- Lưu metadata `figureQC` và `figureStatus` ngay trong document câu hỏi, **không tạo collection Firestore mới**.
- Câu **Approved từ trước V37.4.7 được giữ nguyên**, không tự hạ trạng thái; nếu sửa hình rồi lưu Approved thì phải xác minh lại.
- Khi sửa câu mà nguồn hình không đổi, hệ thống bảo toàn `figureSvg`/render metadata cũ thay vì làm mất SVG đã biên dịch.
- Nếu nguồn hình thay đổi, SVG cũ bị loại để tránh hiển thị hình stale; renderer được chọn lại theo V37.4.5.
- Thêm **Công cụ → Figure QC V37.4.7** để thống kê toàn ngân hàng: đã xác minh, Approved cũ, cần xem hình, QC lỗi.
- Question Bank Pro nhận chính thức trạng thái `approved` bên cạnh `draft` và `reviewed`; file 240 câu Approved đi kèm vẫn giữ 240/240 Approved.

## Quy trình duyệt hình mới

1. Mở câu hỏi trong editor.
2. Chọn trạng thái **Approved**.
3. Bấm **Kiểm tra & xem hình**.
4. Quan sát hình thực tế giống hình LaTeX mong muốn.
5. Bấm **✓ Hình đúng**.
6. Lưu câu hỏi.

Câu không có hình không cần bước xác minh trực quan.

---

# Math12 Hub V37.4.5 — Hybrid LaTeX Figure Engine

Nâng tiếp trên nền Math12 Hub V37.4.x, giữ nguyên toàn bộ kiến trúc cũ và bổ sung một lớp hiển thị hình chuyên biệt.

## V37.4.5 thay đổi gì?

- **Ưu tiên `figureSvg` đã biên dịch từ LaTeX**: nếu JSON có `figureSvg` hợp lệ và hash khớp `figureLatex`, website dùng SVG đó trước.
- **Smart Native SVG** cho TikZ đồ thị THPT thông dụng: vùng nhìn lấy theo chính các trục `Ox`, `Oy`, không lấy cực trị y của các mẫu gần tiệm cận. Vì vậy các đồ thị phân thức không còn bị kéo dẹt/rộng bất thường.
- Plot được **clip theo vùng trục**, giữ đúng dạng nhánh khi tiến gần tiệm cận.
- Kích thước native SVG tôn trọng `scale=...` của `tikzpicture`, giữ tỉ lệ x:y và căn giữa.
- **TikZJax chỉ là fallback** khi TikZ chứa lệnh mà native renderer không hỗ trợ.
- SVG đã lưu được chuẩn hóa `viewBox`, `preserveAspectRatio`, responsive và tight-crop an toàn sau khi gắn vào DOM.
- Thêm renderer riêng cho **BBT 2 dòng `x, f(x)`**, không ép giả hàng `f'(x)`. BBT 3 dòng tiếp tục dùng renderer V37.3.6.
- Thêm **Công cụ → Kiểm tra hình V37.4.5** để thống kê LaTeX SVG / Smart SVG / TikZJax / BBT 2 dòng.
- Production regression có thêm kiểm tra đồ thị phân thức với tiệm cận để phát hiện lỗi kéo dẹt canvas.
- Không đổi Firestore rules/indexes, không tạo collection mới, không xóa chức năng cũ.

## Thứ tự renderer

`Stored LaTeX SVG → Smart Native SVG → TikZJax fallback`

## Kiểm thử V37.4.5

- Mẫu đồ thị $y=-x/(x+1)$ với hai tiệm cận đã qua regression: `smart-native-svg`, `axisBounds=true`, `plotClipping=true`, canvas `338×302`.
- File kiểm chứng hình nằm trong `tests/v37.4.5-asymptote-regression.svg` và `.png`.
- Có thể chạy trong Console: `V3745FigureEngine.regression()`.

## Dữ liệu kèm theo

Thư mục `imports/` có bản ngân hàng `F1 CLEAN/APPROVED-ready` 240 câu để khôi phục thủ công. Gói website không tự nạp file này, do đó không ghi đè ngân hàng hiện có khi triển khai.

## Ghi chú nền V37.4.3


Nâng trực tiếp từ **V37.4.2 Pure ID6 Taxonomy UI**. Bản này tạo một điểm khởi đầu sạch để xây lại ngân hàng câu hỏi theo chuẩn ID6.

## Thay đổi chính

- Ngân hàng mẫu/seed được **vô hiệu hóa**: cài mới bắt đầu với 0 câu.
- Thêm **Công cụ → Làm sạch ngân hàng** với quy trình 3 bước.
- Bắt buộc tải JSON sao lưu trước khi nút xóa được mở khóa.
- Trước khi xóa, hệ thống cố tạo Recovery Snapshot trong Data Safety/IndexedDB.
- Xóa:
  - toàn bộ câu hỏi đang hoạt động;
  - toàn bộ `_versions` gắn trong các câu cũ;
  - toàn bộ **câu hỏi** trong Thùng rác V26;
  - dấu hoàn tác khôi phục ngân hàng cũ trên localStorage.
- Giữ nguyên:
  - đề kiểm tra đã lưu (`customExams`);
  - thùng rác của đề;
  - lớp, học sinh, assignments/submissions;
  - lịch sử học tập, Mastery/Adaptive;
  - cấu trúc **6 chương – 17 bài – 91 dạng ID6**.
- Nếu giáo viên đang đăng nhập Firebase, reset sẽ force-sync `questionBank=[]`, giữ recycle của đề và kiểm tra lại cloud sau khi ghi.
- Nếu chưa đăng nhập Firebase, giao diện cảnh báo reset chỉ có hiệu lực trên máy hiện tại.
- Khi ngân hàng trống, empty state hướng thẳng tới **Import LaTeX/.tex** hoặc **Thêm câu hỏi**.

## Xác nhận xóa

1. Mở **Ngân hàng câu hỏi → Công cụ → Làm sạch ngân hàng**.
2. Bấm **Tải bản sao lưu bắt buộc**.
3. Đánh dấu xác nhận.
4. Nhập `XOA-SACH`.
5. Bấm **Xóa sạch & tạo ngân hàng mới**.

## Tương thích

- Không đổi `firestore.rules`.
- Không đổi `firestore.indexes.json`.
- Không tạo collection mới.
- Backup JSON trước reset có trường `questionBank`, vì vậy **Khôi phục V2** có thể đọc lại phần ngân hàng hoạt động.
- Các câu Word sau khi chuyển LaTeX có thể import lại theo Chương → Bài → Dạng → Mức độ → ID6.

## V37.5 — Figure Production Engine
- Release Gate cho hình Approved.
- Safe Repair cache/metadata renderer, không sửa nội dung Toán.
- Production snapshot có chữ ký và tự báo stale khi ngân hàng thay đổi.
- Xuất Production Manifest để đối soát trước phát hành.
