# Math12 Hub V37.4.2 — Pure ID6 Taxonomy UI

## Mục tiêu
Giao diện Ngân hàng câu hỏi chỉ dùng một trục phân loại chính thức:

**Chương → Bài → Dạng → Mức độ → ID6**

Ví dụ `2D1H2-2` = Lớp 12 → D → Chương 1 → Thông hiểu → Bài 2 → Dạng 2.

## Thay đổi
- Ẩn mã F/K khỏi giao diện ngân hàng và trình biên tập.
- Bộ lọc chính còn: Tìm kiếm, Chương, Bài, Dạng, Mức độ.
- Loại câu / Trạng thái / QC ở hàng phụ.
- Độ khó / Nguồn / Thẻ / Trùng / Sắp xếp / Số câu-trang nằm trong “Bộ lọc nâng cao”.
- Danh sách câu hỏi hiển thị ID6 thay cho mã bản ghi nội bộ.
- Cột phân loại hiển thị mẫu dạng ID6, không hiển thị knowledgeCode cũ.
- Độ phủ 91 dạng ID6 theo accordion chương; mở một chương thì chương khác thu gọn.
- Knowledge Map/Mastery nội bộ được ẩn khỏi màn hình chính nhưng vẫn giữ dữ liệu và có thể mở từ Công cụ → Bảo trì.
- Không thay Firestore Rules/Indexes, không migration collection.

## Tương thích
`lessonId`, `knowledgeCode`, 19 bài nội bộ và 57 chuẩn Mastery vẫn được giữ trong dữ liệu để không phá tiến độ/adaptive learning cũ.
