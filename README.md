# Math12 Hub V32 – AI Teacher Assistant

V32 được nâng trực tiếp từ V31. Toàn bộ Secure Exam V18, Low Reads V19, Data Safety V21, Dashboard V22, Account/Admin V24–V25, Data Integrity V26, Teacher Operations V27, Student Learning UX V28, Question Bank Pro V29, Exam Engine Pro V30 và Analytics & Competency Pro V31 được giữ nguyên.

## Mục tiêu V32

V32 thêm một lớp **AI hỗ trợ biên tập cho giáo viên** nhưng không cho AI tự xuất bản nội dung. Quy trình bắt buộc là:

`Nguồn giáo viên → AI tạo/kiểm tra bản nháp → Hàng chờ AI → Giáo viên xem/chỉnh/duyệt → Question Bank Pro → Tạo đề/Giao bài`

AI không tự ghi câu vào ngân hàng, không tự thay đáp án câu đang dùng, không tự đánh dấu câu là đã duyệt chuyên môn và không tự giao bài cho học sinh.

## 1. Trợ lý AI riêng cho giáo viên

Menu mới: **Trợ lý AI**.

Trang này chỉ mở cho vai trò `teacher` và `admin`, dùng cùng cơ chế `ROLE_ACCESS` hiện có.

Các nhóm chức năng:

- cấu hình Gemini;
- ảnh/PDF/LaTeX → bản nháp câu hỏi;
- kiểm định câu hiện có;
- tạo biến thể;
- hàng chờ AI;
- provenance/nguồn AI.

## 2. Gemini adapter V32

Mặc định:

`gemini-3.7-flash`

Model là trường cấu hình nên có thể đổi mà không sửa code. V32 cũng gợi ý một số model khác trong `datalist`, nhưng giáo viên có thể nhập model ID hợp lệ khác.

V32 gọi Gemini qua REST `models.generateContent` để phù hợp website tĩnh GitHub Pages và hỗ trợ input ảnh/PDF trực tiếp. Adapter dùng structured JSON output và có fallback cho dạng cấu hình JSON cũ nếu endpoint trả lỗi tương thích.

### API key

API key **không** được lưu trong:

- `state`;
- Firestore;
- full backup;
- audit log;
- source code của package.

Giáo viên chọn một trong hai cách:

- **Chỉ phiên này** → `sessionStorage`;
- **Trên thiết bị này** → `localStorage`.

V32 có nút xóa key khỏi trình duyệt.

> Đây vẫn là frontend tĩnh. Client-side API key không có mức bảo vệ như backend. Khi triển khai quy mô lớn, lộ trình V35 nên chuyển gọi AI sang Cloud Functions/backend để quản lý quota và bí mật tốt hơn.

## 3. Ảnh/PDF/LaTeX → câu hỏi

Nguồn hỗ trợ:

- văn bản;
- LaTeX;
- PNG;
- JPEG/JPG;
- WEBP;
- PDF.

Giới hạn chủ động của V32:

- ảnh: 8 MB;
- PDF: 12 MB.

Tệp chỉ được đọc và gửi Gemini khi giáo viên bấm **Tạo bản nháp AI**. Nội dung file không được lưu vào Firestore.

Giáo viên có thể chọn:

- AI tự phân loại bài;
- khóa về một bài cụ thể;
- MCQ;
- Đúng/Sai 4 ý;
- trả lời ngắn;
- phối hợp tự động;
- tối đa 1/3/5/8/10 câu mỗi lần.

AI nhận danh mục 57 mã kiến thức đang có trong chương trình Math12 Hub để phân loại.

## 4. Quy tắc câu hỏi AI

Prompt hệ thống V32 yêu cầu:

- công thức dùng LaTeX;
- MCQ có đúng 4 phương án A–D và duy nhất một đáp án đúng;
- TF4 đúng 4 ý liên quan logic;
- ưu tiên ý sau dựa trên dữ kiện/kết quả ý trước khi hợp lý;
- Short Answer có đáp án ngắn chấm được;
- nếu ảnh/PDF không đọc rõ phải ghi `warnings`, không được tự bịa;
- tự kiểm tra phép tính và đáp án trước khi trả JSON;
- không được tự đánh dấu “đã duyệt chuyên môn”.

## 5. Hàng chờ AI

AI không ghi thẳng vào `state.questionBank`.

Bản nháp được lưu cục bộ trong:

`math12hub.ai.v32.drafts`

Giới hạn:

- tối đa 40 bản nháp;
- tự giảm số lượng nếu tổng JSON quá lớn;
- không lưu ảnh/PDF nguồn.

Mỗi bản nháp hiển thị:

- mã tạm;
- mã kiến thức;
- loại câu;
- confidence AI;
- Quality Score V29;
- cảnh báo local;
- nghi trùng với ngân hàng hiện có;
- model đã sinh câu.

Giáo viên có bốn lựa chọn:

1. **Xem**;
2. **Mở trình soạn**;
3. **Đưa vào kho (nháp)**;
4. **Đã kiểm tra & duyệt**.

Chỉ hai thao tác 3–4 mới đưa câu vào Question Bank Pro.

## 6. Provenance AI

Câu được duyệt trực tiếp từ hàng chờ giữ metadata:

```js
aiV32: {
  schemaVersion: 32,
  model,
  task,
  sourceKind,
  generatedAt,
  confidence,
  warnings,
  sourceNote,
  teacherReviewed,
  teacherDecision,
  approvedAt
}
```

Question Bank Pro V29 vẫn là nơi quản lý chính. Field `aiV32` chỉ là provenance bổ sung và được đồng bộ cùng document câu hỏi hiện có.

## 7. Local QC + AI QC

Trước khi duyệt, V32 chạy kiểm tra local độc lập:

- câu quá ngắn;
- mã kiến thức không hợp lệ;
- MCQ thiếu 4 phương án;
- phương án trùng;
- đáp án MCQ sai cấu trúc;
- TF4 thiếu 4 ý;
- short thiếu đáp án;
- thiếu lời giải;
- near-duplicate theo thuật toán V29.

Local QC không dùng API và không phát sinh Firestore Reads.

## 8. AI phản biện câu đang có

Giáo viên nhập/chọn mã câu trong ngân hàng rồi bấm:

**Kiểm tra đáp án & metadata**

AI trả về:

- trạng thái `ok / needs_review / critical`;
- confidence;
- summary;
- danh sách vấn đề;
- đánh giá đáp án;
- metadata đề xuất;
- tags đề xuất.

V32 chỉ cho **áp dụng metadata** tự động. Đáp án và lời giải đang dùng không bị AI tự sửa.

Khi áp dụng metadata, V32 dùng version history V29 nên bản cũ vẫn được giữ lại.

## 9. Tạo biến thể

Từ một câu đang có, giáo viên có thể tạo 1/3/5 biến thể.

Prompt V32 yêu cầu:

- cùng mã kiến thức;
- cùng loại câu;
- gần cùng độ khó;
- thay dữ kiện/ngữ cảnh thật sự;
- không chỉ đổi tên biến;
- ưu tiên nghiệm/đáp án đẹp;
- tự giải lại từng biến thể;
- có đáp án duy nhất.

Biến thể cũng chỉ vào **Hàng chờ AI**, không tự đi vào ngân hàng.

## 10. Không thêm Firestore collection

V32 không thêm collection/subcollection AI.

AI draft + settings + usage counter nằm cục bộ. Câu đã duyệt tiếp tục dùng:

`users/{uid}/questionBank/{questionId}`

Do đó:

- không cần Firestore composite index mới;
- không tăng Reads nền;
- Data Safety/Conflict Guard cũ vẫn hoạt động;
- Secure Exam không đổi.

## 11. Firestore Rules V32

Rules V32 không mở thêm quyền cho AI hoặc học sinh.

Question Bank vẫn chỉ cho chính tài khoản giáo viên đang active đọc/ghi. API key không đi qua Firestore nên Rules không cần collection mới.

## 12. Schema/app version

- `APP_VERSION = 32`
- local state `_meta.schemaVersion = 32`
- full backup schema = 32
- learning/profile/syncMeta writes mới = 32
- Question Bank schema vẫn là V29 vì đó là schema riêng của module Question Bank;
- Verified Competency vẫn là schema V31 vì đó là schema riêng của module Analytics.

## 13. Nâng từ V31

1. Sao lưu V31.
2. Có thể publish `firestore-v32.rules` để đồng bộ version comment/config; V32 không thêm quyền mới.
3. Hai composite index cũ vẫn giữ nguyên; nếu đã Enabled thì không cần tạo lại.
4. Upload toàn bộ package V32 lên GitHub Pages.
5. Đăng nhập giáo viên.
6. Mở **Trợ lý AI**.
7. Nhập Gemini API key, ưu tiên **Chỉ phiên này** khi dùng máy dùng chung.
8. Bấm **Kiểm tra kết nối**.
9. Thử một ảnh/đoạn LaTeX → tạo 1–3 câu.
10. Xem bản nháp → kiểm tra đáp án → chỉ sau đó đưa vào ngân hàng.

## 14. Kiểm thử nên làm sau deploy

- API key session không xuất hiện trong Firestore;
- refresh trang vẫn giữ key nếu cùng session;
- chọn “Trên thiết bị này” rồi mở lại trình duyệt vẫn đọc key;
- xóa key hoạt động;
- ảnh/PDF lớn bị chặn trước request;
- AI draft không tự xuất hiện trong Question Bank;
- duyệt draft mới tạo câu trong Question Bank;
- provenance `aiV32` được giữ sau sync;
- audit AI không tự đổi answer;
- apply metadata tạo version history;
- tạo biến thể chỉ sinh draft;
- học sinh không thấy menu AI.

