# Math12 Hub V25 — Production Admin & User Management

V25 nâng trực tiếp từ V24 và **giữ nguyên kiến trúc/module/dữ liệu cũ**. Secure Exam V18, Low Reads V19, Data Safety V21, Smart Analytics V22, Data Integrity V23 và Account Security V24 tiếp tục tương thích.

## Nâng cấp chính V25

### 1. Vai trò `admin` và Admin Console

V25 bổ sung vai trò thứ ba ở tầng ứng dụng:

- `student` — học sinh;
- `teacher` — giáo viên;
- `admin` — quản trị viên hệ thống.

Admin có trang **Quản trị hệ thống** riêng để:

- xem tổng số tài khoản, giáo viên, học sinh và lớp;
- tìm theo tên/email/UID;
- đổi quyền `student ↔ teacher`;
- khóa/mở quyền truy cập ứng dụng;
- gửi email đặt lại mật khẩu;
- xem và khóa/mở quyền học sinh truy cập một lớp;
- xem cảnh báo vận hành;
- xem nhật ký thao tác quản trị.

V25 **không cho phép tạo hoặc nâng một tài khoản thành admin từ trình duyệt**. Đây là chủ ý bảo mật.

### 2. Thiết lập admin đầu tiên

Sau khi publish `firestore.rules` V25:

1. Đăng nhập tài khoản sẽ dùng làm quản trị viên ít nhất một lần để document `users/{uid}` tồn tại.
2. Mở **Firebase Console → Firestore Database → users → UID của tài khoản**.
3. Đổi trường:

```text
role: "admin"
```

4. Tải lại website và đăng nhập lại.

Từ đó admin có thể đổi người dùng khác giữa `student` và `teacher`, nhưng không thể tạo thêm admin từ client.

## 3. Khóa tài khoản an toàn

Admin Console có thể đặt:

```text
users/{uid}.accountStatus = "locked"
```

Firestore Rules V25 sẽ từ chối hầu hết đọc/ghi online của tài khoản bị khóa. Website vẫn cho người dùng thấy thông báo tài khoản bị khóa và có thể đăng xuất.

> Đây là **khóa ở cấp ứng dụng/Firestore**, không phải vô hiệu hóa Firebase Authentication. Vô hiệu hóa Auth thật sự cần Firebase Admin SDK/Cloud Functions/backend tin cậy; không nên đặt quyền Admin SDK trong GitHub Pages.

## 4. Quản lý học sinh trong từng lớp

Giáo viên có thêm nút ở danh sách học sinh:

- **Tạm khóa** — học sinh mất quyền đọc lớp, nhận bài và ghi progress; lịch sử cũ vẫn giữ nguyên.
- **Mở lại** — cấp lại quyền truy cập.
- **Gỡ khỏi lớp** — xóa member/progress/membership nhưng **không xóa bài nộp và điểm lịch sử**, giúp đối soát an toàn.

Học sinh bị tạm khóa không được tính vào mẫu số nộp bài/trễ hạn và không được đưa vào nhóm giao bài thông minh.

## 5. Quản trị lớp ở cấp hệ thống

Admin có thể đặt:

```text
classes/{classId}.accessStatus = "locked"
```

Khi đó:

- học sinh không thể đọc lớp/bài giao;
- mã tham gia không thể dùng để vào lớp;
- giáo viên chủ lớp vẫn đọc/quản trị được;
- mở khóa không làm mất dữ liệu.

Thùng rác lớp V24 vẫn được giữ riêng, không bị thay thế bởi `accessStatus`.

## 6. Nhật ký quản trị V25

Các thao tác quyền cao được ghi vào:

```text
adminAudit/{logId}
```

Ví dụ:

- `user.role.change`
- `user.lock`
- `user.unlock`
- `user.password-reset.request`
- `class.lock`
- `class.unlock`

Client chỉ được **thêm** log khi đang là admin; không được sửa/xóa log.

Nhật ký cá nhân V24 tại `users/{uid}/audit` vẫn được giữ nguyên.

## 7. Hồ sơ tài khoản V25

Khi đăng nhập V25, hồ sơ tự bổ sung/cập nhật:

```text
schemaVersion: 25
accountStatus: "active"        // nếu hồ sơ cũ chưa có
emailVerified: true | false
lastLoginAt: serverTimestamp()
updatedAt: serverTimestamp()
```

Điều này giúp Admin Console có dữ liệu trạng thái mà không cần truy cập Firebase Authentication Admin API.

## 8. Firestore Rules V25

Rules V25 bổ sung:

- `currentAccountActive()` — khóa tài khoản ở cấp dữ liệu;
- `isAdmin()`;
- admin được list `users` và `classes`;
- người dùng không thể tự đổi `role` hoặc `accountStatus`;
- admin chỉ đổi được `student ↔ teacher`, không sửa tài khoản admin khác;
- `isClassMember()` kiểm tra cả `member.status != suspended`;
- `isActiveClass()` kiểm tra cả Thùng rác và `accessStatus != locked`;
- học sinh không thể tự bỏ trạng thái suspended bằng Firestore;
- `adminAudit` chỉ admin đọc/thêm, không sửa/xóa.

## 9. Các file chính

```text
index.html
assets/css/app.css
assets/js/core.js
assets/js/authoring.js
assets/js/firebase.js
assets/js/admin-v25.js       ← mới
assets/js/dashboard-v22.js  ← giữ tên để tương thích, snapshot mới analyticsV25
assets/js/data-vault.js
assets/js/exam.js
assets/js/bootstrap.js
firestore.rules
```

## 10. Thứ tự triển khai V25

1. **Publish `firestore.rules` V25 trước.**
2. Upload `index.html` và toàn bộ thư mục `assets/` V25 lên GitHub Pages.
3. Đăng nhập tài khoản quản trị một lần.
4. Trong Firebase Console, đặt `users/{adminUid}.role = "admin"` cho admin đầu tiên.
5. Đăng xuất/đăng nhập lại và kiểm tra mục **Quản trị hệ thống**.
6. Chưa cần bật App Check enforcement nếu thầy chưa theo dõi request metrics ổn định.

## 11. Tương thích dữ liệu

V25 không đổi/xóa các kho chính:

- `assignmentsV18`
- `answerKeysV18`
- `submissionIndexV19`
- `studentStatsV19`
- `users/{uid}/learning`
- `users/{uid}/questionBank`
- `users/{uid}/customExams`

Dashboard ghi snapshot mới vào `analyticsV25` và vẫn đọc fallback `analyticsV24 → analyticsV23 → analyticsV22`.
