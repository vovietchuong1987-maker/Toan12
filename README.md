# Math12 Hub V20 — Modular Architecture

V20 nâng trực tiếp từ V19 và không đổi Firestore schema.

## Cấu trúc
- `index.html`: khung giao diện, chỉ còn ~37 KB thay vì ~2.6 MB.
- `assets/css/app.css`: CSS chính.
- `assets/js/core.js`: chương trình học và render cơ bản.
- `assets/js/authoring.js`: phân quyền giao diện, phân tích năng lực, ngân hàng câu hỏi, LaTeX/TikZ, tạo đề.
- `assets/js/exam.js`: phòng thi và chấm bài luyện.
- `assets/js/firebase.js`: Firebase Auth, Secure Exam V18, Low Reads V19.
- `assets/js/bootstrap.js`: gắn sự kiện và khởi tạo.
- `assets/js/mathjax-config.js` + `assets/vendor/mathjax.js`: MathJax tách riêng để cache.
- `firestore.rules`: giữ logic V19.

## Cập nhật GitHub Pages
Phải tải lên **toàn bộ** `index.html` và thư mục `assets/`. Không chỉ thay mỗi `index.html`. Nếu Rules V19 đang chạy ổn thì không bắt buộc cập nhật Rules.

## Tương thích
Giữ nguyên các collection/index V19 (`submissionIndexV19`, `studentStatsV19`, `lowReadsV19Ready`) nên không cần migrate dữ liệu lần nữa.
