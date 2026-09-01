# Math12 Hub V37.7.1

**Build:** `37.7.1-tikz-scope-plot-hotfix`

V37.7.1 nâng trực tiếp từ V37.7 Lesson Content Engine và giữ nguyên toàn bộ dữ liệu/ngân hàng, ID6, Exam Pro, Firestore Rules/Indexes.

## Hotfix hiển thị TikZ

- Hỗ trợ cú pháp nhập Word/LaTeX dạng gọn `\node[...]at(...)`.
- Hỗ trợ `\begin{scope}...\end{scope}` dạng thuần dùng để bọc đồ thị.
- Hỗ trợ `\clip(x_1,y_1) rectangle (x_2,y_2);` với tọa độ số trong pipeline Smart SVG.
- Câu cũ có `figureRenderEngine: tikzjax-pending` được thử Smart SVG lại trước khi fallback.
- Mã TikZ gốc vẫn được giữ nguyên; không sửa nội dung toán học, đáp án hay ID6.
- Hình nâng cao thật sự chưa hỗ trợ vẫn dùng TikZJax/Stored SVG như trước.

## Trường hợp đã sửa

Đồ thị bậc ba dạng `plot (\x,{\x^3-3*\x-2})` nằm trong `scope + clip`, kèm các `node[...]at(...)` viết liền, trước đây bị báo “Có 7 lệnh cần TeX đầy đủ”. V37.7.1 nhận đủ các phần tử và dựng native Smart SVG.
