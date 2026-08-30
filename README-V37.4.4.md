# Math12 Hub V37.4.4 – Derivative Sign Table Hotfix

## Nâng cấp chính
- Bộ nhận dạng bảng biến thiên/tkz-tab giờ tự nhận biết trường hợp **chỉ có 2 dòng**: `x` và `f'(x)` (bảng xét dấu đạo hàm).
- Với trường hợp này, giao diện **không hiển thị thêm dòng `f(x)`** giả.
- Áp dụng cho cả:
  - xem trước trong **Ngân hàng câu hỏi / soạn câu hỏi**
  - hiển thị trong **bài kiểm tra / luyện tập**
  - khung xem trước `srcdoc` của TikZ/tkz-tab

## Phạm vi sửa
- `assets/js/authoring.js`
- `assets/js/variation-exam-v37.3.6.js`
- cập nhật meta/version nhẹ sang `37.4.4` để tránh cache cũ.
