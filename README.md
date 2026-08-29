# Math12 Hub V37.3.1 — Tools Menu UX Hotfix

V37.3.1 là bản vá giao diện trực tiếp trên V37.3. Toàn bộ Native Function Graph Engine, TikZ Figure Support, Backup V2 và các mô-đun cũ được giữ nguyên.

## Sửa lỗi bảng Công cụ trong Ngân hàng câu hỏi

- Chọn bất kỳ mục nào trong **Công cụ** sẽ tự đóng bảng menu ngay sau thao tác.
- Bấm ra ngoài bảng Công cụ sẽ tự đóng.
- Nhấn `Esc` sẽ tự đóng.
- Khi modal chung của hệ thống mở, bảng Công cụ cũng tự đóng để không đè lên cửa sổ Import/Backup/Khôi phục.
- Có CSS guard để panel không thể còn hiển thị khi `<details>` đã đóng.

Không thay đổi Firestore Rules, indexes hoặc cấu trúc dữ liệu.

---

## Nền V37.3 — Native Function Graph Engine

V37.3 nâng trực tiếp từ V37.2 và giữ nguyên TikZ Figure Support, Backup V2, AI Teaching Intelligence, Mastery, Smart Exam, Quality Engine và Knowledge Map.

## Điểm mới

V37.3 có bộ dựng SVG cục bộ cho 3 họ đồ thị thường gặp trong Toán 12:

1. `y = ax^3 + bx^2 + cx + d`
2. `y = (ax+b)/(cx+d)`
3. `y = (ax^2+bx+c)/(dx+e)`

Trong trình soạn câu hỏi, chọn **Hình vẽ kèm theo → Đồ thị chuẩn THPT V37.3**, sau đó bấm **Trình tạo đồ thị**. Có thể nhập hệ số hoặc nhập nhanh công thức để hệ thống tự nhận dạng.

Graph Engine tự tính các đặc trưng phù hợp: cực trị, giao trục, tiệm cận đứng/ngang/xiên, tâm và miền hiển thị. Giáo viên có thể bật/tắt lưới, điểm cực trị, đường chiếu trục, nhãn tọa độ và giao trục.

Với phân thức có nhân tử chung làm gián đoạn có thể khử, V37.3 vẽ **điểm khuyết** thay vì báo sai thành tiệm cận đứng.

## SVG offline + TikZ round-trip

Đồ thị V37.3 được dựng bằng SVG ngay trên trình duyệt nên không cần Internet. Khi xuất ngân hàng sang LaTeX, cấu hình Graph Engine được tự chuyển thành mã TikZ để tiếp tục dùng trong tài liệu `.tex`.

TikZ V37.2 vẫn được giữ nguyên cho các hình đã có sẵn hoặc hình phức tạp hơn.

## Kiểm tra

Vào **Ngân hàng câu hỏi → Công cụ → Kiểm tra Graph V37.3** để thống kê các câu đang dùng Graph Engine và chạy regression 3 họ hàm.

Xem `V37.3-VALIDATION.txt` để biết kết quả kiểm tra bản đóng gói.
