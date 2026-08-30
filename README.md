# Math12 Hub V37.4 — Official ID6 Taxonomy

Nâng trực tiếp từ V37.3.6, giữ nguyên toàn bộ nền tảng học tập, Mastery, Quality, Smart Exam, TikZ/Graph và Firestore hiện có.

## Trọng tâm V37.4

- Chuẩn hóa **91 dạng toán Toán 12** theo tài liệu `ID6-MONTOAN-KHOI10-11-12-CHINHTHUC.pdf` do giáo viên cung cấp.
- ID6 dùng mẫu 6 tham số như `2D1N1-1`, `2H5V2-7`.
- Quy ước mức độ: `N` = Nhận biết, `H` = Thông hiểu, `V` = Vận dụng, `C` = Vận dụng cao.
- **Không dùng ID6 làm khóa Firestore** vì nhiều câu có thể cùng một dạng. `q.id` vẫn là mã bản ghi nội bộ duy nhất; `q.id6` là mã phân loại chính thức.
- Giữ nguyên 19 bài học nội bộ + 57 chuẩn Knowledge/Mastery để không làm hỏng tiến độ học sinh; 91 dạng ID6 được ánh xạ vào các bài hiện có.
- Trình soạn câu hỏi hiển thị ID6 tự động theo Dạng toán + Mức độ.
- Import/Export LaTeX hỗ trợ metadata `% id6:`. CSV có cột `id6` và `id6Pattern`.
- Có danh mục 91 dạng và chức năng `Chuẩn hóa ID6` an toàn cho ngân hàng cũ.
- Vận dụng cao (`VDC`) được hỗ trợ trong editor/QC; Smart Exam hiện gom VDC vào cột Vận dụng để giữ tương thích ma trận 3 mức cũ.

## Tương thích

- Không đổi `firestore.rules` hoặc `firestore.indexes.json`.
- Không tạo collection mới.
- Backup V37.1 và các file JSON cũ vẫn đọc được.
- Mã bản ghi nội bộ cũ không bị đổi khi chuẩn hóa ID6.

## Sau khi deploy

1. Ctrl + F5 một lần.
2. Vào **Ngân hàng câu hỏi → Dạng toán & ID câu hỏi V37.4**.
3. Mở **Danh mục 91 dạng** để kiểm tra.
4. Nếu cần, bấm **Chuẩn hóa ID6**; hệ thống cố gắng tạo Recovery Snapshot trước khi ghi.
