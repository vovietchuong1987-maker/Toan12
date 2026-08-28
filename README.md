# Math12 Hub V35 — Hotfix 35.1 — Production Hardening & Smart Loading

V35 nâng trực tiếp từ V34 và **giữ nguyên kiến trúc/dữ liệu cũ**: Secure Exam V18, Low Reads V19, Data Safety V21/V26, Teacher Ops V27, Student UX V28, Question Bank V29, Exam Engine V30, Analytics V31, AI V32, Reports V33 và Performance & Scale V34.

## Nâng cấp chính của V35

- **Sửa đồng bộ phiên bản**: `APP_VERSION`, `meta app-version`, tiêu đề và giao diện đều là V35.
- **Smart Loading**:
  - Không tải thư viện XLSX ở lần mở trang đầu; chỉ tải khi giáo viên thực sự chọn file `.xlsx/.xls` để import.
  - Không tải `ai-teacher-v32.js` cho tới khi mở trang **Trợ lý AI**.
  - Không tải `reports-v33.js` cho tới khi mở **Báo cáo học tập** hoặc truy cập trực tiếp link báo cáo phụ huynh.
- **MathJax không còn chặn quá trình parse HTML**: config và runtime chuyển sang `defer` nhưng vẫn tự typeset khi trang tải xong.
- **PWA / Offline shell**:
  - thêm `manifest.webmanifest`, icon 192/512 và `sw-v35.js`;
  - cache các tài nguyên same-origin cốt lõi, không can thiệp request Firestore/Firebase cross-origin;
  - navigation có fallback về `index.html` khi offline.
- **Production Center V35 trong trang Admin**:
  - Regression check ngay trên trình duyệt;
  - kiểm tra version, ID trùng, cấu trúc đề THPT 12/4/6, 90 phút, thang Đ/S 0.1/0.25/0.5/1, phân quyền, Data Safety, Firebase core, Scale engine, PWA, App Check và Smart Loading;
  - ghi nhận lỗi JavaScript trong phiên với nội dung đã làm mờ email/ID dài;
  - xuất diagnostics V35 không chủ động thu thập UID/email/đáp án.
- **Accessibility**:
  - focus ring `:focus-visible`;
  - bổ sung ARIA cơ bản cho modal/nav/form theo runtime;
  - hỗ trợ `prefers-reduced-motion`.
- **Offline UX**: có thông báo nhỏ khi mất mạng, dữ liệu local vẫn dùng được và Firebase sẽ đồng bộ lại khi có kết nối.

## Firestore / dữ liệu

V35 **không tạo collection Firestore mới và không yêu cầu migration dữ liệu mới**. `firestore.rules` và `firestore.indexes.json` kế thừa V34.

Các marker `scaleV34` và tên hàm `v34*` được giữ nguyên có chủ đích để tránh phá tương thích dữ liệu/code cũ. V35 chỉ bọc thêm lớp hardening phía trên.

## App Check

Gói vẫn để:

```html
<script>window.MATH12_APP_CHECK_SITE_KEY = window.MATH12_APP_CHECK_SITE_KEY || '';</script>
```

Điều này có nghĩa **App Check chưa được bật thực sự** cho tới khi nhập reCAPTCHA v3 site key. Sau khi nhập key, nên kiểm tra request metrics trong Firebase App Check trước rồi mới bật Enforcement.

## Cách triển khai

1. Sao lưu bản V34 đang chạy.
2. Giữ `firestore.rules` và `firestore.indexes.json` hiện tại nếu V34 đã deploy thành công.
3. Upload toàn bộ V35 (`index.html`, `assets/`, `manifest.webmanifest`, `sw-v35.js`) lên cùng thư mục GitHub Pages.
4. Tải lại trang bằng `Ctrl+F5` một lần để nhận service worker/cache V35 mới.
5. Đăng nhập Admin → **Quản trị hệ thống → Production Center V35** → bấm **Chạy kiểm tra**.
6. Nếu dùng import Excel, lần đầu mở file `.xlsx` cần Internet để tải XLSX từ jsDelivr; CSV không cần thư viện này.
7. Nếu muốn bật App Check, cấu hình site key rồi kiểm tra trạng thái **Đang bảo vệ** trước khi bật Enforcement.

## Kiểm tra tối thiểu trước khi dùng thật

- Học sinh: đăng nhập, học theo bài, làm đề THPT, xem tiến độ, lớp online.
- Giáo viên: ngân hàng câu hỏi, tạo đề, giao bài, dashboard lớp, import CSV/XLSX, AI, báo cáo.
- Admin: quản lý tài khoản/lớp, Scale Center, Production Center.
- Mở lại trang khi offline để xác nhận shell PWA hiển thị; các tác vụ cloud đương nhiên cần mạng.



## Hotfix 35.1 (28/08/2026)
- Sửa Production Center báo sai **Data Safety** do kiểm tra nhầm `saveState` thay vì hàm thực tế `save`.
- Chống trộn asset V34/V35 do cache bằng cache-busting `?v=35.1`, Service Worker cache mới và network-first cho asset ứng dụng.
- Health Scan V26 tự fallback sang đọc từng nhánh khi Firestore Rules từ chối `collectionGroup`, nên Admin vẫn quét được mà không bắt buộc đổi Rules.
- Thêm nút **Xóa lỗi phiên** và bỏ qua lỗi do extension trình duyệt chèn vào trang.
