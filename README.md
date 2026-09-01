# Math12 Hub V37.7

**Build:** `37.7-lesson-content-engine`

V37.7 nâng trực tiếp từ V37.6 Exam Pro Engine. Toàn bộ ngân hàng câu hỏi, Exam Pro, Dynamic Practice, Graph Reading, Figure Renderer, Firestore Rules/Indexes và các mô-đun cũ được giữ nguyên.

## Nâng cấp chính

- Căn thẳng Chương 1 với 5 bài chính thức của ID6:
  1. Sự đồng biến và nghịch biến của hàm số
  2. Cực trị của hàm số
  3. Giá trị lớn nhất và giá trị nhỏ nhất của hàm số
  4. Đường tiệm cận
  5. Khảo sát sự biến thiên và vẽ đồ thị hàm số
- F1-01...F1-05 giờ tương ứng trực tiếp với bài 1...5; không còn gộp Đơn điệu + Cực trị và không còn tách “Ứng dụng thực tiễn” thành bài riêng.
- Phân phối lại đủ 30 dạng ID6 Chương 1 vào đúng 5 bài.
- Trang “Học theo bài” hiển thị số chuẩn kiến thức, số dạng ID6, số câu ngân hàng và tiến độ.
- Trang chi tiết bài học có mục tiêu, tiên quyết, kiến thức cốt lõi, ghi nhớ nhanh, toàn bộ dạng ID6, số câu theo mức độ, ví dụ, luyện tập và lỗi thường gặp.
- Có nút luyện trực tiếp từng dạng ID6 khi ngân hàng có câu.
- Câu tổng hợp nhiều ý được mô tả theo quy tắc: xếp vào bài học muộn nhất cần học xong để giải trọn câu.
- Điều hướng bài trước/sau và giao diện responsive mới.

## An toàn dữ liệu

- Không đổi khóa lưu trữ ngân hàng.
- Không đổi schema Firestore.
- Không thêm collection mới.
- Không xóa hay ghi đè questionBank.
- Tổng số bài app vẫn là 19 và tổng số mã Mastery vẫn là 57 để giữ tương thích các mô-đun phân tích hiện có.

