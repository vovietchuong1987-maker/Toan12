# Math12 Hub V36.0 — Knowledge Map & Question Bank Engine

V36.0 được nâng trực tiếp từ V35.4. Toàn bộ nền V34 Scale, V35 Production Hardening, Role-aware UI, UX Polish và Smart Navigation được giữ nguyên.

## Trọng tâm V36.0

V36.0 tạo một taxonomy thống nhất cho Toán 12 GDPT 2018:

**Chương → Bài → Đơn vị kiến thức → Dạng toán chuẩn → Câu hỏi**

- 6 chương.
- 19 bài.
- 57 đơn vị kiến thức (`F1-01.K1`...).
- 57 dạng toán chuẩn (`F1-01.D1`...).
- Dạng toán được ánh xạ về đúng bài, chuẩn kiến thức và mức độ NB/TH/VD.
- Câu hỏi mới/sửa bằng trình soạn được bổ sung metadata V36 tự động.
- Câu hỏi cũ vẫn đọc/chấm/sync bình thường; giáo viên có nút **Chuẩn hóa metadata V36** để bổ sung metadata theo yêu cầu.
- Trước khi chuẩn hóa hàng loạt, V36 cố gắng tạo Recovery Snapshot trong Data Safety Vault nếu chức năng này khả dụng.

## Metadata bổ sung cho câu hỏi

V36.0 không thay trường `schemaVersion: 29` của Question Bank Pro V29 để tránh xung đột với bộ chuẩn hóa cũ. Các trường mới là additive:

- `questionBankSchema: 36`
- `curriculumId: MATH12-GDPT2018-2026`
- `knowledgeMapVersion: 36`
- `grade: 12`
- `knowledgeTitle`
- `formId`
- `formTitle`
- `blueprintKey`
- `taxonomyPath`
- `metadataStatusV36`

Không tạo Firestore collection mới. `firestore.rules` không cần migration cho V36.0.

## Giao diện mới trong Ngân hàng câu hỏi

- Knowledge Map dạng cây theo 6 chương.
- Mỗi bài hiển thị 3 chuẩn kiến thức và dạng toán tương ứng.
- Màu độ phủ dạng toán: chưa có / 1–2 câu / từ 3 câu.
- Nhấn chuẩn/dạng để lọc ngân hàng ngay.
- Bộ lọc mới **Dạng toán**.
- Trình soạn câu hỏi có select **Dạng toán chuẩn V36** nhưng vẫn cho phép nhập dạng riêng.
- CSV xuất từ ngân hàng bổ sung `formId`, `formTitle`, `knowledgeTitle`, `blueprintKey`, `questionBankSchema`.
- Có thể xuất toàn bộ Knowledge Map + coverage thành JSON.

## Smart Navigation

Tìm nhanh V35.4 được giữ nguyên dữ liệu ghim/gần đây trên máy và nâng để tìm thêm:

- mã dạng toán như `F1-01.D2`;
- tên dạng toán;
- `formId` / `formTitle` của câu hỏi.

Tìm kiếm vẫn dùng dữ liệu đã có trong phiên, không tự tạo Firestore Reads mới.

## Version / cache

- `APP_VERSION = 36.0`
- `app-build = 36.0-knowledge-map`
- Service Worker cache: `math12hub-v36-shell-6`
- Local assets dùng query `?v=36.0`

Sau khi upload lên GitHub Pages nên Ctrl+F5 một lần để bỏ cache V35.4.

## Các lớp tương thích được giữ nguyên

- V18 Secure Exam / scoring.
- V21 Data Safety Vault / sync.
- V26 Integrity / Trash / recovery.
- V27 Teacher Operations.
- V28 Student UX.
- V29 Question Bank Pro.
- V30 Exam Pro.
- V31 Analytics Pro.
- V32 AI Teacher.
- V33 Reports.
- V34 Scale.
- V35 Production Hardening / role UI / UX / Smart Navigation.

## Hướng tiếp theo

V36.1 nên xây **Question Quality Engine** trên taxonomy V36.0: kiểm tra cấu trúc, đáp án, LaTeX, phương án trùng, thiếu dữ kiện và tính liên kết của câu Đúng/Sai 4 ý.
