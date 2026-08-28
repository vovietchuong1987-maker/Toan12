# Math12 Hub V31 – Analytics & Competency Pro

V31 được nâng trực tiếp từ V30. Toàn bộ Secure Exam V18, Low Reads V19, Data Safety V21, Dashboard V22, Account/Admin V24–V25, Data Integrity V26, Teacher Operations V27, Student Learning UX V28, Question Bank Pro V29 và Exam Engine Pro V30 được giữ nguyên.

## Mục tiêu V31

Biến điểm và lịch sử câu hỏi thành **bản đồ năng lực có nguồn dữ liệu rõ ràng**, theo cấu trúc:

`Chương → Bài → Mã kiến thức → NB / TH / VD`

V31 tách hai nguồn:

- **Verified / Xác minh:** chỉ từ Secure Exam đã được giáo viên chấm.
- **Practice / Tự luyện:** lịch sử luyện tập do học sinh đồng bộ, dùng để cá nhân hóa và tham khảo.

Dữ liệu Practice không được coi là thay thế điểm/năng lực xác minh.

---

## 1. Aggregate năng lực xác minh Low Reads

V31 **không tạo collection analytics mới**. Năng lực xác minh được cộng dồn ngay trong document teacher-only đã có:

`classes/{classId}/studentStatsV19/{uid}.verifiedCompetencyV31`

Các nhóm aggregate:

- tổng bằng chứng câu (`totalAttempts`);
- tổng credit (`totalCredit`);
- mã kiến thức (`codes`);
- bài (`lessons`);
- chương (`chapters`);
- mức độ (`levels`: NB / TH / VD).

Khi giáo viên chấm một Secure Exam mới, V31 tự cộng phần `questionResults` vào aggregate. Khi mở Dashboard, hệ thống chỉ đọc `studentStatsV19` vốn đã được Low Reads V19 tải, **không đọc lại toàn bộ submissions**.

## 2. Bản đồ năng lực giáo viên

Dashboard giáo viên có thêm **Bản đồ năng lực xác minh • V31**:

- số kết quả câu đã xác minh;
- mức đạt xác minh;
- độ phủ mã kiến thức có đủ bằng chứng;
- số mã yếu;
- NB / TH / VD;
- Chương → Bài → Mã kiến thức;
- số câu xác minh ở từng nút;
- trạng thái: Chưa đủ dữ liệu / Cần học lại / Cần củng cố / Đã vững.

Ngưỡng hiển thị mặc định:

- dưới 2 bằng chứng: chưa đủ dữ liệu;
- dưới 60%: cần học lại;
- 60% đến dưới 80%: cần củng cố;
- từ 80%: đã vững.

## 3. Ma trận học sinh × mã yếu

V31 tự chọn tối đa 6 mã kiến thức yếu nổi bật của lớp và lập ma trận học sinh × mã.

Giáo viên có thể bấm tên học sinh để xem:

- điểm trung bình Secure Exam;
- số câu xác minh;
- mức đạt xác minh;
- năng lực theo chương;
- mã kiến thức yếu;
- dữ liệu tự luyện được đặt ở khu vực tham khảo riêng.

## 4. Chi tiết theo mã kiến thức

Bấm một mã kiến thức trong cây năng lực để xem những học sinh đã có bằng chứng xác minh cho mã đó, sắp từ yếu lên mạnh.

Từ modal này có thể chuyển sang luồng **Tạo bài củng cố** bằng ngân hàng câu hỏi hiện có.

## 5. Gợi ý giao bài ưu tiên dữ liệu Verified

Khối gợi ý giao bài của Dashboard V31 ưu tiên:

1. mã có ít nhất 2 câu Secure Exam đã chấm;
2. mức đạt dưới 80%;
3. mã yếu hơn đứng trước.

Nếu chưa đủ Verified evidence, hệ thống mới fallback về gợi ý tự luyện cũ. Giáo viên luôn là người duyệt đề và bấm “Giao bài”; V31 không tự xuất bản bài.

## 6. Tách nguồn trên trang học sinh

Trang **Phân tích năng lực** có hai thẻ nguồn:

- `✓ Secure Exam đã xác minh`;
- `◎ Tự luyện trên thiết bị`.

Secure Exam được nhận diện từ lịch sử `assignment` / `assignment-graded`. Practice là các chế độ luyện còn lại.

Nhờ vậy học sinh không nhầm dữ liệu tự luyện với kết quả giáo viên đã chấm.

## 7. Chuẩn hóa dữ liệu V30 một lần

Bài được chấm mới từ V31 tự cộng aggregate. Với bài V30 trở về trước đã có `questionResults`, giáo viên dùng nút:

**Chuẩn hóa dữ liệu V30**

V31 sẽ đọc current graded submissions của lớp, bỏ qua submission đã đánh dấu `competencyV31Aggregated`, cộng dữ liệu còn thiếu rồi đánh dấu đã chuẩn hóa.

Đây là thao tác **theo yêu cầu, một lần và có phát sinh Firestore Reads**. V31 không tự chạy migration nền.

## 8. Idempotent – tránh cộng trùng

Mỗi current graded submission đã cộng năng lực được đánh dấu:

- `competencyV31Aggregated: true`
- `competencyV31SchemaVersion: 31`

Vì vậy mở lại kết quả hoặc chạy backfill lần nữa không cộng trùng phần đã xử lý.

## 9. Làm lại và xóa bài vẫn giữ aggregate đúng

Khi giáo viên **cấp thêm lượt làm**:

- điểm current official được gỡ khỏi `studentStatsV19`;
- phần năng lực xác minh của lượt current cũng bị trừ;
- lịch sử lượt V27 vẫn giữ nguyên;
- khi lượt mới được chấm, V31 cộng kết quả mới trở lại.

Khi **xóa vĩnh viễn** một bài đang trong Thùng rác, V31 đồng thời gỡ phần năng lực current official của bài khỏi thống kê.

## 10. Snapshot so sánh lớp V31

Document lớp ghi snapshot nhẹ:

`analyticsV31`

Bổ sung:

- `verifiedEvidence`
- `verifiedAccuracy`
- `verifiedCoverage`
- `weakVerifiedCode`
- `weakVerifiedAccuracy`

Khi so sánh các lớp, Dashboard đọc snapshot ngay trên class document, không tải toàn bộ học sinh của lớp khác.

V31 vẫn đọc fallback `analyticsV30 → ... → analyticsV22`.

## 11. Firestore Rules

V31 không cần mở quyền mới cho học sinh. `verifiedCompetencyV31` nằm trong `studentStatsV19`, collection vốn chỉ cho:

- admin đọc;
- chủ lớp đọc/ghi;
- học sinh không đọc/ghi trực tiếp.

Các lớp bảo mật Secure Exam, answer key, draftsV30, retry và target của V30 được giữ nguyên.

## 12. Firestore Indexes

V31 **không thêm composite index mới**. Tiếp tục giữ 2 index từ V27–V30:

- `targetMode + opensAt`
- `targetUids ARRAY_CONTAINS + opensAt`

Nếu hai index đã `Enabled`, không cần tạo lại.

## 13. Nâng cấp từ V30

Khuyến nghị:

1. Sao lưu V30.
2. Publish `firestore-v31.rules`.
3. Giữ nguyên 2 indexes nếu đã Enabled.
4. Upload toàn bộ package V31 lên GitHub Pages.
5. Đăng nhập tài khoản giáo viên và chọn một lớp test.
6. Chấm một Secure Exam mới rồi kiểm tra Bản đồ năng lực V31.
7. Với dữ liệu V30 cũ, bấm **Chuẩn hóa dữ liệu V30** một lần.
8. Thử: chấm → cấp thêm lượt → chấm lượt mới, kiểm tra aggregate không cộng lặp.

## 14. Các lớp dữ liệu cũ được giữ nguyên

V31 không đổi tên các collection quan trọng như:

- `assignmentsV18`
- `answerKeysV18`
- `submissionIndexV19`
- `studentStatsV19`
- `recycleBinV26`
- `attemptHistoryV27`
- `draftsV30`

Không có collection mới chỉ để phục vụ V31 Analytics.
