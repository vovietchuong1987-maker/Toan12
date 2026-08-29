# Math12 Hub V36.2 — Smart Exam Matrix & Multiple Test Codes

V36.2 được nâng trực tiếp từ V36.1. Knowledge Map V36.0 và Question Quality Engine V36.1 được giữ nguyên; toàn bộ nền V34 Scale, V35 Production Hardening, Role-aware UI, UX Polish, Smart Navigation và Exam Engine Pro V30 tiếp tục tương thích.

## Trọng tâm V36.2

V36.2 bổ sung `assets/js/smart-exam-v36.2.js`, chạy cục bộ trên ngân hàng câu hỏi đã tải trong phiên. Module không tự tạo Firestore query mới và không tạo collection mới.

### 1. Smart Exam Matrix

Trang **Tạo đề kiểm tra** có thêm lớp chọn câu thông minh trước khi sinh đề:

- Lọc theo QC V36.1:
  - Không có lỗi nghiêm trọng (mặc định).
  - Sạch lỗi + cảnh báo.
  - Không lọc QC để tương thích dữ liệu cũ.
- Tùy chọn chỉ lấy câu đã duyệt.
- Tùy chọn bắt buộc metadata V36 đầy đủ.
- Cân phủ `knowledgeCode` và `formId` để đề không dồn quá nhiều câu vào cùng một dạng.
- Ưu tiên tránh câu đã xuất hiện trong 1 / 3 / 5 / 10 đề lưu gần nhất.
- Phát hiện độ đủ của từng ô Chương × Mức độ sau khi áp dụng các bộ lọc.
- Hiển thị số câu đủ điều kiện, số chuẩn kiến thức và số dạng toán phủ được.

Hệ thống vẫn giữ ma trận cũ của V21/V30; V36.2 chỉ nâng lớp chọn câu, không xóa hoặc thay cấu trúc đề cũ.

### 2. Blueprint V36.2

Có thể:

- Kiểm tra blueprint trước khi sinh đề.
- Xuất blueprint JSON.
- Lưu tối đa 10 mẫu ma trận trên máy.
- Nạp lại mẫu gồm: tên đề, thời gian, Chương × Mức độ, chính sách QC, cân bằng nội dung và số mã đề.

### 3. Mã đề 101–108

V36.2 tiếp tục dùng seed xác định của Exam Engine Pro V30 nhưng hiển thị mã đề theo cách quen thuộc:

- 101
- 102
- 103
- 104
- tối đa 108

Một đề chỉ lưu **một bộ câu gốc**. Các mã đề được tái tạo từ seed, không nhân bản 4–8 bản câu hỏi trong dữ liệu.

### 4. Trộn an toàn

- Chỉ đảo phương án của câu MCQ.
- Không đảo 4 ý bên trong một câu Đúng/Sai 4 ý.
- Có thể khóa riêng một MCQ bằng `lockOptions=true` hoặc `shuffleOptions=false`.
- Nếu các câu có `groupId`, `stimulusId`, `parentId` hoặc `sharedContextId`, V36.2 coi đó là một block và giữ các câu cùng dữ kiện cạnh nhau khi đảo thứ tự.
- Khi giữ Phần I–II–III, hệ thống chỉ đảo trong từng phần.

### 5. Hạn chế lặp và câu gần trùng

Khi chọn câu, V36.2:

- Không chọn hai ID giống nhau.
- Ưu tiên không chọn hai câu có stem giống nhau sau chuẩn hóa.
- Giảm ưu tiên câu đã xuất hiện trong các đề gần nhất.
- Nếu ngân hàng không đủ, hệ thống vẫn ưu tiên đáp ứng đúng quota Chương × Mức độ × Loại câu thay vì làm hỏng cấu trúc đề.

### 6. Xuất bộ mã đề

Từ đề xem trước có thể xuất một gói JSON gồm:

- Blueprint.
- Chính sách trộn.
- Các mã 101–108.
- Thứ tự câu của từng mã.
- Thứ tự phương án MCQ sau trộn.
- Answer key tương ứng từng mã.

Gói này dành cho giáo viên; không tự công khai đáp án cho học sinh.

## Production Center

Regression V36.2 kiểm tra:

- Module `36.2-smart-exam` đã nạp.
- Mã đầu là 101 và mã thứ tư là 104.
- Các câu có cùng group vẫn nằm cạnh nhau sau khi trộn.
- Các regression cũ của THPT scoring, role access, Knowledge Map và Quality Engine vẫn giữ nguyên.

## Tương thích dữ liệu

- Không tạo Firestore collection mới.
- Không yêu cầu migration Firestore Rules.
- Không thay `firestore.indexes.json`.
- Không đổi ID câu hỏi.
- Không xóa đề V36.1/V35.x.
- Đề cũ V30 vẫn mở được; nếu không có metadata V36.2 thì dùng policy tương thích.

## Build

- `APP_VERSION = 36.2`
- `app-build = 36.2-smart-exam`
- Service Worker cache: `math12hub-v36-shell-8`
- Local assets: `?v=36.2`
- New module: `assets/js/smart-exam-v36.2.js`
- Quality Engine vẫn dùng module: `assets/js/quality-engine-v36.1.js`
- Knowledge Map vẫn dùng build nội bộ: `36.0-knowledge-map`

## Sau khi triển khai GitHub Pages

1. Thay toàn bộ package cũ bằng V36.2.
2. `Ctrl + F5` một lần để bỏ cache `shell-7`.
3. Đăng nhập Teacher/Admin.
4. Mở **Tạo đề kiểm tra**.
5. Chọn ma trận hoặc mẫu `Cấu trúc THPT 12–4–6`.
6. Kiểm tra khối **Smart Exam Matrix V36.2**.
7. Bấm **Kiểm tra blueprint** trước khi **Sinh đề từ ma trận**.
8. Vào **Production Center** và chạy regression check.
