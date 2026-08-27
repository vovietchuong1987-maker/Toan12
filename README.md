# Math12 Hub V23 — Production Hardening & Data Integrity

V23 nâng trực tiếp từ V22, giữ nguyên Secure Exam V18, Low Reads V19, kiến trúc module V20, Data Safety Vault V21 và Smart Analytics V22. Mục tiêu của V23 là làm chắc dữ liệu trước khi dùng rộng cho nhiều lớp học sinh.

## Nâng cấp chính V23

- **Tiến độ mới bắt đầu sạch:** tài khoản/thiết bị mới bắt đầu `0/19` bài, chuỗi học được tính từ lịch sử thật thay vì hard-code 5 ngày.
- **Dọn seed demo V22 an toàn:** chỉ xóa bộ 4 bài mẫu cũ khi thiết bị chưa có attempt, examAttempt, questionHistory hoặc lessonScores thật.
- **Tạo lớp bằng batch:** document lớp và join code được tạo trong cùng một atomic batch.
- **Tham gia/rời lớp bằng batch:** member, membership và progress được cập nhật/xóa cùng một thao tác để giảm trạng thái lệch.
- **Xóa lớp an toàn theo 3 giai đoạn:** khóa join code + đánh dấu `deleting`, thu hồi quyền học sinh trước, sau đó mới xóa bài/lượt nộp/tổng hợp rồi xóa document lớp. Nếu mạng lỗi, có thể bấm Xóa lại để tiếp tục.
- **Rules V23 cho phép chủ lớp xóa membership** của học sinh trong đúng quy trình xóa lớp.
- **Bài giao theo nhóm được bảo vệ ở cả UI và Firestore Rules:** học sinh chỉ được đọc bài `targetMode == all` hoặc bài có UID của mình trong `targetUids`.
- **Low Reads vẫn được giữ:** học sinh tải bài bằng 2 query nhỏ (`all` + `array-contains uid`) thay vì tải toàn bộ bài của lớp rồi lọc trên client.
- **Tách dữ liệu xác minh và tự luyện:** điểm trung bình Secure Exam lấy từ `studentStatsV19`/assignment aggregate (giáo viên ghi) được ưu tiên cho trạng thái và xu hướng lớp; `progress`/`skillSnapshot` được gắn nhãn dữ liệu tự luyện, dùng cho heatmap/gợi ý chứ không coi là điểm xác minh.
- **Snapshot so sánh lớp:** V23 ghi `analyticsV23`, vẫn đọc fallback `analyticsV22` để không mất dữ liệu cũ.

## Firestore Rules — bắt buộc cập nhật

V23 **cần publish file `firestore.rules` mới**. Nếu giữ Rules V22, quy trình xóa lớp mới sẽ không thể xóa membership của học sinh và học sinh vẫn có quyền đọc toàn bộ assignment document trong lớp.

Sau khi publish Rules V23, giáo viên nên mở màn hình quản lý từng lớp một lần. V23 sẽ tự chuẩn hóa các assignment Secure cũ thiếu `targetMode/targetUids` thành `targetMode: "all"` để tương thích Rules mới.

## Cấu trúc

- `index.html`
- `assets/css/app.css`
- `assets/js/core.js`
- `assets/js/authoring.js`
- `assets/js/data-vault.js`
- `assets/js/exam.js`
- `assets/js/firebase.js`
- `assets/js/dashboard-v22.js` — giữ tên file để tương thích, bên trong đã nâng logic V23
- `assets/js/bootstrap.js`
- `assets/vendor/mathjax.js`
- `firestore.rules`

## Thứ tự triển khai từ V22

1. Publish `firestore.rules` V23 trước.
2. Upload toàn bộ gói V23 (`index.html` + `assets/`) lên GitHub Pages.
3. Đăng nhập bằng tài khoản giáo viên và mở từng lớp một lần để V23 chuẩn hóa assignment cũ.
4. Kiểm tra thử bằng 1 tài khoản học sinh: bài cả lớp hiển thị, bài nhóm khác không hiển thị, bài đúng nhóm vẫn hiển thị và nộp được.
5. Chỉ sau khi kiểm tra bước 4 mới dùng chức năng xóa lớp trên dữ liệu thật.

## Tương thích

Các hàm/kho mang tên `v21...`, `v22...`, `syncMeta/v21`, `studentStatsV19`, `assignmentsV18` được giữ có chủ đích để bảo toàn dữ liệu và tránh migration lớn. Tên cũ không có nghĩa là tính năng đang ở phiên bản cũ.
