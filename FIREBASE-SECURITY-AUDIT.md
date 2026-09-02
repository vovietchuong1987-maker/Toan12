# Math12 Hub — Firebase Security Audit

## Kết quả đã gia cố trong gói này
- Vai trò giao diện chỉ lấy từ hồ sơ Firestore đã đăng nhập; không có nút tự đổi Student/Teacher.
- Các thao tác Teacher/Admin phía client được chặn thêm khi tài khoản đang ở trạng thái khóa.
- Học sinh không nhận ngân hàng riêng của giáo viên; dữ liệu tự học công khai chỉ phát câu đã duyệt.
- Đáp án bài giao được tách khỏi assignment công khai sang `answerKeysV18`.
- Bản nộp của học sinh và chỉ mục trạng thái được tách; điểm được ghi bởi luồng giáo viên.
- Firebase App Check đã có hook khởi tạo nhưng **chưa thể bật hoàn toàn** vì package hiện không có reCAPTCHA site key.

## Điểm bắt buộc phải kiểm tra trên Firebase Console trước khi mở rộng
1. Firestore Rules phải là nguồn bảo mật chính; kiểm tra `users/{uid}.role`, `accountStatus`, ownership lớp và membership.
2. Người dùng chỉ được tạo hồ sơ của chính mình với `role = student`; không được tự sửa `role` hoặc `accountStatus`.
3. `answerKeysV18` chỉ Teacher chủ lớp/Admin được đọc.
4. `submissions/{uid}`: học sinh chỉ tạo/ghi bản của chính mình và không được tự ghi `score`, `questionResults`, `gradedAt`.
5. `submissionIndexV19`: học sinh chỉ ghi trạng thái của chính mình; trường điểm/chấm phải do Teacher/Admin ghi.
6. `classes/{classId}` chỉ chủ lớp/Admin được sửa; học sinh chỉ đọc khi là thành viên hợp lệ.
7. `adminAudit` chỉ Admin đọc/ghi.
8. Bật App Check theo lộ trình: cấu hình site key → quan sát metrics → mới bật enforcement.

## Lưu ý
Firebase web `apiKey` trong `firebaseConfig` là định danh client, không phải mật khẩu. Không dựa vào việc giấu apiKey để bảo mật dữ liệu; bảo mật phải nằm ở Auth + App Check + Firestore Rules.
