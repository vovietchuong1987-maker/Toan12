# Math12 Hub V26 — Data Integrity, Recovery & System Health

V26 nâng trực tiếp từ V25 và **giữ nguyên kiến trúc, dữ liệu và các module đang hoạt động**. Secure Exam V18, Low Reads V19, Data Safety V21, Smart Analytics V22, Data Integrity V23, Account Security V24 và Production Admin V25 tiếp tục tương thích.

## Mục tiêu của V26

V26 không chạy theo việc thêm nhiều màn hình mới. Trọng tâm là bảo đảm dữ liệu quan trọng **khó mất, có đường khôi phục và có công cụ phát hiện liên kết sai** trước khi hệ thống được dùng với nhiều lớp/học sinh.

## 1. Thùng rác nội dung giáo viên

Các thao tác xóa trong ngân hàng câu hỏi và đề tự tạo đã chuyển sang mô hình xóa an toàn:

- Câu hỏi → `Thùng rác nội dung`.
- Đề đã lưu → `Thùng rác nội dung`.
- Có thể khôi phục lại.
- Nếu mã câu/đề bị trùng khi khôi phục, V26 tự tạo mã `RESTORED` mới thay vì ghi đè dữ liệu đang có.
- Chỉ thao tác `Xóa vĩnh viễn` mới loại mục khỏi thùng rác.
- Trước thao tác nguy hiểm, V26 yêu cầu Data Safety V21 tạo recovery snapshot nếu IndexedDB đang sẵn sàng.

Thùng rác này nằm trong `state.recycleBinV26` và được đồng bộ cho giáo viên qua:

```text
users/{uid}/recycleBinV26/{trashId}
```

Do đó đổi máy/đăng nhập lại vẫn có thể nhận lại thùng rác cùng ngân hàng câu hỏi và đề.

## 2. Thùng rác bài giao Firestore

`Xóa bài` trong quản lý lớp không còn xóa ngay:

```text
assignmentsV18/{assignmentId}.status = "trashed"
```

Khi vào Thùng rác:

- Học sinh không còn đọc/nhìn thấy bài.
- `targetMode/targetUids` bị vô hiệu hóa tạm thời.
- Bài nộp vẫn còn.
- Điểm vẫn còn.
- `submissionIndexV19` vẫn còn.
- `answerKeysV18` vẫn còn.
- Giáo viên có thể khôi phục và V26 trả lại target cũ.

Chỉ bài đang ở Thùng rác mới có nút `Xóa vĩnh viễn`. Khi xóa vĩnh viễn phải nhập `XOA`.

## 3. Gói cứu hộ trước khi xóa cloud vĩnh viễn

Trước khi xóa vĩnh viễn một bài giao, V26 đọc và lưu một recovery bundle cục bộ gồm:

- document assignment;
- answer key;
- submissions;
- submission indexes.

Trước khi giáo viên reset lượt nộp của một học sinh, V26 lưu:

- submission;
- submission index.

Các gói này được giữ trong IndexedDB Data Safety Vault và có thể **xuất JSON** từ `Dữ liệu & sao lưu`.

> V26 cố tình chưa tự động ghi ngược recovery bundle lên Firestore. Timestamp và dữ liệu chấm điểm là dữ liệu nhạy cảm; tự phục hồi đoán mò có thể làm sai lịch sử. Bundle là lớp cứu hộ/đối soát sau xóa vĩnh viễn, còn đường khôi phục chuẩn vẫn là Thùng rác trước khi purge.

## 4. System Health cho Admin

Trang `Quản trị hệ thống` có thêm **Sức khỏe dữ liệu V26**.

Admin chủ động bấm `Quét hệ thống`; V26 không chạy quét nền để tránh tăng Firestore Reads.

Bộ quét kiểm tra:

### Chủ lớp

- lớp không tìm thấy `users/{ownerId}`;
- owner không còn role `teacher/admin`;
- schema lớp cũ.

### Join code

- lớp hoạt động không có join code;
- join code không trỏ đúng lớp;
- owner của join code không khớp owner lớp.

### Member ↔ Membership

Đối chiếu:

```text
classes/{classId}/members/{uid}
↕
users/{uid}/memberships/{classId}
```

Phát hiện:

- thiếu membership;
- thiếu member;
- membership trỏ tới lớp không còn tồn tại;
- membership còn sót tới lớp đã ở Thùng rác;
- member/membership không còn hồ sơ người dùng.

### Secure Exam

Đối chiếu:

```text
assignmentsV18/{assignmentId}
↕
answerKeysV18/{assignmentId}
```

và kiểm tra `submissionIndexV19` có trỏ tới assignment tồn tại hay không.

## 5. Repair Database — chỉ sửa phần an toàn

Nút `Sửa lỗi an toàn` chỉ xử lý những liên kết có thể suy ra chắc chắn:

- tạo join code mới cho lớp bị hỏng mã;
- dựng membership từ member khi hồ sơ người dùng còn tồn tại;
- dựng member từ membership + hồ sơ người dùng khi đủ dữ liệu;
- xóa membership trỏ tới lớp không còn tồn tại;
- xóa membership còn sót tới lớp đã ở Thùng rác.

V26 **KHÔNG tự sửa**:

- answer key bị thiếu;
- đáp án;
- điểm;
- submission;
- chỉ mục điểm nghi ngờ;
- owner lớp bị mất;
- member/membership khi hồ sơ người dùng không còn đủ dữ liệu.

Mỗi lần Repair được ghi vào `adminAudit` với action:

```text
system.integrity.repair
```

## 6. Chống false-positive khi quét dữ liệu lớn

System Health dùng giới hạn đọc để bảo vệ chi phí. Nếu một collection chạm giới hạn mẫu, V26:

1. đánh dấu phần quét là `partial`;
2. hiện cảnh báo trong Admin Console;
3. **không kết luận “thiếu” ở phép đối chiếu phụ thuộc tập dữ liệu chưa đầy đủ**;
4. không cho Repair tự động trên kết luận có nguy cơ false-positive.

Giới hạn mặc định:

```text
users             1000
classes           1000
joinCodes          700
members           2500
memberships       2500
assignmentsV18    1800
answerKeysV18     1800
submissionIndex   3000
```

Nếu hệ thống vượt quy mô này, V26 chỉ coi lần quét là mẫu an toàn; V34/V35 sẽ chuyển health check sang backend/pagination.

## 7. Firestore Rules V26

Rules V26 bổ sung/siết các điểm quan trọng:

- `recycleBinV26` chỉ chính giáo viên sở hữu tài khoản đọc/ghi.
- Admin được `list/read` các collection cần thiết cho System Health.
- Admin chỉ được sửa member/membership theo quyền quản trị hiện có.
- bài `status = trashed` không thể được học sinh đọc.
- `assignmentTargetsMe()` từ chối assignment đã trashed.
- giữ nguyên account lock V25 và member suspend V25.
- giữ nguyên Secure Exam: học sinh không đọc `answerKeysV18`, không tự ghi điểm.

## 8. Analytics V26

Dashboard lớp ghi snapshot mới:

```text
classes/{classId}.analyticsV26
```

và tiếp tục đọc tương thích:

```text
analyticsV26
→ analyticsV25
→ analyticsV24
→ analyticsV23
→ analyticsV22
```

Không cần migrate xóa dữ liệu snapshot cũ.

## 9. Full Backup V26

Full Backup hiện ghi:

```text
schemaVersion: 26
version: 26
```

Tên file mặc định:

```text
math12hub-v26-full-....json
```

Teacher Rescue cũng bao gồm `recycleBinV26`, vì vậy việc cứu ngân hàng câu hỏi không làm mất thùng rác nội dung.

## 10. Cấu trúc package

```text
index.html
firestore.rules
README.md
assets/
  css/
    app.css
  js/
    core.js
    authoring.js
    data-vault.js
    exam.js
    firebase.js
    dashboard-v22.js      # giữ tên để tương thích, ghi analyticsV26
    admin-v25.js          # giữ tên/API DOM V25 để không phá nâng cấp cũ
    integrity-v26.js      # mới: recycle/recovery/system health/repair
    bootstrap.js
    mathjax-config.js
vendor/
  mathjax.js
```

Tên `dashboard-v22.js`, `admin-v25.js` và các ID/hàm `v25...` được **cố ý giữ lại**. Đổi tên chúng không mang lợi ích vận hành nhưng dễ gây lỗi các lời gọi cũ.

## 11. Thứ tự triển khai V26

Khuyến nghị:

1. **Publish `firestore.rules` V26 trước.**
2. Upload `index.html`, `assets/` và `vendor/` của V26 lên GitHub Pages.
3. Đăng nhập tài khoản admin.
4. Mở `Quản trị hệ thống` → `Quét hệ thống`.
5. Đọc danh sách lỗi trước khi bấm `Sửa lỗi an toàn`.
6. Đăng nhập một tài khoản giáo viên và thử:
   - xóa/khôi phục 1 câu hỏi mẫu;
   - đưa/khôi phục 1 bài giao thử;
   - mở `Dữ liệu & sao lưu` để xác nhận Data Safety.
7. Chỉ sau khi luồng trên ổn định mới dùng `Xóa vĩnh viễn` cho dữ liệu thật.

## 12. Tương thích V25

V26 không xóa hoặc đổi tên các kho dữ liệu chính:

```text
users
classes
joinCodes
assignmentsV18
answerKeysV18
submissionIndexV19
studentStatsV19
adminAudit
```

Dữ liệu V25 tiếp tục hoạt động. Không có migration phá hủy bắt buộc.

## 13. Giới hạn có chủ ý

- Account lock vẫn là khóa **quyền ứng dụng/Firestore**, chưa phải disable Firebase Authentication ở server. Disable Auth thật cần Admin SDK/backend.
- System Health là công cụ hỗ trợ toàn vẹn dữ liệu trong phạm vi quét, không thay thế backup bên ngoài Firebase.
- Recovery bundle sau `purge` hiện là JSON cứu hộ/đối soát, chưa có one-click cloud restore để tránh ghi lại Timestamp/điểm sai kiểu dữ liệu.
- Quét hệ thống có phát sinh Reads **khi admin bấm quét**; không có polling nền.

---

**Math12 Hub V26** đặt mục tiêu: trước khi thêm nhiều chức năng dạy học ở V27, dữ liệu hiện tại phải có cơ chế xóa an toàn, cứu hộ và kiểm tra sức khỏe đủ rõ để vận hành production.
