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
