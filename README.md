# Math12 Hub V24 — Account & Production Security

V24 nâng trực tiếp từ V23, **không viết lại hệ thống**. Secure Exam V18, Low Reads V19, kiến trúc module V20, Data Safety Vault V21, Smart Analytics V22 và Data Integrity V23 tiếp tục được giữ nguyên/tương thích. Mục tiêu của V24 là tăng an toàn tài khoản, giảm rủi ro xóa nhầm dữ liệu và làm chắc Firestore Rules trước khi dùng rộng.

## Nâng cấp chính V24

### 1. Account Security

- **Quên mật khẩu:** gửi email đặt lại mật khẩu bằng Firebase Authentication.
- **Xác minh email:** tài khoản mới được gửi email xác minh; tài khoản cũ chưa xác minh vẫn đăng nhập được để tránh khóa người dùng hiện tại.
- **Gửi lại / kiểm tra trạng thái xác minh** ngay trong mục Tài khoản.
- **Đổi mật khẩu** khi đang đăng nhập; nếu phiên xác thực đã cũ Firebase sẽ yêu cầu đăng nhập lại.
- Hồ sơ Firebase hiển thị rõ trạng thái **email đã/chưa xác minh**.

### 2. App Check-ready

V24 nạp Firebase App Check compat SDK và có sẵn điểm cấu hình:

```html
<script>window.MATH12_APP_CHECK_SITE_KEY = window.MATH12_APP_CHECK_SITE_KEY || '';</script>
```

- Để trống: website hoạt động như V23, **App Check chưa kích hoạt**.
- Sau khi đăng ký Web App trong Firebase App Check, điền **reCAPTCHA v3 site key** vào biến trên.
- Chỉ bật **enforcement** trong Firebase Console sau khi đã kiểm tra request metrics và chắc chắn traffic hợp lệ đang nhận token App Check.

### 3. Nhật ký thao tác V24

Thêm collection:

```text
users/{uid}/audit/{logId}
```

Ghi các sự kiện quan trọng như:

- đăng nhập / đăng xuất / tạo tài khoản;
- gửi xác minh email / đổi mật khẩu;
- tạo lớp / tham gia / rời lớp;
- đưa lớp vào Thùng rác / khôi phục / xóa vĩnh viễn.

Rules chỉ cho chính tài khoản đọc và **chỉ thêm mới**, không cho sửa/xóa bản ghi audit từ client.

> Đây là nhật ký vận hành phía client, hữu ích để truy vết thao tác; không được coi là audit log chống giả mạo cấp máy chủ.

### 4. Thùng rác lớp học

Nút xóa lớp cũ được thay bằng **Đưa vào Thùng rác**.

Khi đưa lớp vào Thùng rác:

1. lớp đổi sang `status: "trashed"`;
2. join code bị thu hồi;
3. membership hiển thị của học sinh được dọn;
4. **không xóa** member, progress, assignment, submission, answer key hay điểm;
5. Rules chặn học sinh truy cập lớp đã trashed ngay cả khi còn membership cũ do sự cố mạng.

Khi khôi phục:

- V24 tạo **join code mới**;
- cấp lại membership theo danh sách member đã lưu;
- đưa lớp về `status: "active"`;
- giữ nguyên bài giao, lượt nộp và điểm.

Chỉ **Xóa vĩnh viễn** mới loại bỏ dữ liệu thật. V24 yêu cầu nhập `XOA` để xác nhận.

### 5. Firestore Rules V24 — vá lỗi và siết quyền

- Sửa lỗi V23: quyền chủ lớp xóa membership từng bị đặt nhầm ở nhánh `learning`; V24 chuyển đúng về `users/{uid}/memberships/{classId}`.
- Học sinh không thể đọc lớp ở trạng thái `trashed`.
- Bài giao theo nhóm vẫn được bảo vệ bằng `targetUids`.
- Join code mới phải trỏ đến **lớp do chính tài khoản giáo viên đó sở hữu**.
- Chủ lớp không thể tự đổi `ownerId` của document lớp sau khi tạo.
- Nhật ký `audit` chỉ append, không update/delete từ client.
- Secure Exam V18 và Low Reads V19 vẫn giữ các ràng buộc submission/index theo batch.

### 6. Các cải tiến nhỏ

- Dashboard hiển thị **chuỗi học thật** thay cho số `5 ngày` cố định ở HTML.
- Schema dữ liệu hiện hành nâng lên `24` nhưng vẫn đọc fallback dữ liệu V23/V22 khi cần.
- Teacher dashboard ưu tiên dữ liệu Secure Exam xác minh; dữ liệu tự luyện tiếp tục chỉ dùng làm gợi ý/heatmap.
- Học sinh có membership cũ trỏ đến lớp đã xóa mềm sẽ không làm hỏng toàn bộ quá trình đồng bộ; client tự bỏ qua quyền đã hết hiệu lực và tải lại memberships.

## Cấu trúc gói

- `index.html`
- `assets/css/app.css`
- `assets/js/core.js`
- `assets/js/authoring.js`
- `assets/js/data-vault.js`
- `assets/js/exam.js`
- `assets/js/firebase.js`
- `assets/js/dashboard-v22.js` — giữ tên file để tương thích dữ liệu/code cũ, bên trong đã nâng logic V24
- `assets/js/bootstrap.js`
- `assets/vendor/mathjax.js`
- `firestore.rules`

## Thứ tự triển khai từ V23

1. **Publish `firestore.rules` V24 trước.**
2. Upload toàn bộ `index.html` + thư mục `assets/` V24 lên GitHub Pages.
3. Đăng nhập tài khoản giáo viên và kiểm tra: tạo lớp → tham gia bằng một tài khoản học sinh → đưa lớp vào Thùng rác → học sinh không còn truy cập → khôi phục → học sinh thấy lại lớp.
4. Kiểm tra Quên mật khẩu và email xác minh bằng một tài khoản thử.
5. Nếu muốn bật App Check: đăng ký Web App trong Firebase Console, điền site key vào `index.html`, triển khai lại và **theo dõi metrics trước**.
6. Chỉ khi traffic hợp lệ đã nhận App Check token ổn định mới bật enforcement cho Firestore/Authentication theo cấu hình Firebase phù hợp.

## Lưu ý tương thích

Các tên cũ như `assignmentsV18`, `studentStatsV19`, `syncMeta/v21`, `firebaseV23LoadStudentAssignments`, `dashboard-v22.js` được giữ có chủ đích để tránh migration lớn và không làm mất dữ liệu đang dùng. Tên kỹ thuật cũ **không có nghĩa** tính năng vẫn ở phiên bản cũ.
