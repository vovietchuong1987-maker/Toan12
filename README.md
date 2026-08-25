# Math12 Hub V22 — Smart Class Analytics

V22 nâng trực tiếp từ V21, giữ nguyên Secure Exam V18, Low Reads V19, kiến trúc module V20 và Data Safety Vault V21.

## Nâng cấp chính

- Dashboard giáo viên có **xu hướng 8 tuần / 6 tháng**.
- Học sinh đồng bộ thêm `skillSnapshot` và `recentAttempts` trong document `progress` đã có sẵn; không tạo N+1 reads mới.
- **Heatmap mã kiến thức** tổng hợp độ chính xác, số học sinh và mức độ bằng chính progress documents dashboard vốn đã đọc.
- **So sánh các lớp** dùng `analyticsV22` nhỏ lưu ngay trên document lớp. Mở Dashboard một lớp một lần để tạo/cập nhật snapshot; xem so sánh không tải members/submissions lớp khác.
- **Gợi ý bài giao tự động**: chọn mã lớp yếu, ghép tối đa 10 câu từ ngân hàng, tạo đề nháp và mở sẵn màn hình giao cho nhóm cần hỗ trợ/đang củng cố. Giáo viên vẫn là người bấm nút Giao bài.
- Khi học sinh mở kết quả Secure Exam đã chấm, V22 nhập **điểm và credit theo mã kiến thức** vào phân tích cá nhân mà không tải đáp án; sau đó progress V22 được đồng bộ lên lớp.
- Sửa luồng thông báo dùng trực tiếp `analyticsSkillStats()` thay cho lời gọi cũ không tồn tại.

## Firestore Reads

V22 được thiết kế không đảo ngược Low Reads V19:

- Heatmap/xu hướng dùng `progress` đã đọc sẵn.
- So sánh lớp dùng summary nhỏ trên document `classes/{classId}` đã được query khi giáo viên đăng nhập.
- Không tải toàn bộ submissions để dựng biểu đồ.
- Chi tiết bài/học sinh vẫn lazy-load như V19.

## Cấu trúc

- `index.html`
- `assets/css/app.css`
- `assets/js/core.js`
- `assets/js/authoring.js`
- `assets/js/data-vault.js`
- `assets/js/exam.js`
- `assets/js/firebase.js`
- `assets/js/dashboard-v22.js` — dashboard analytics mới
- `assets/js/bootstrap.js`
- `assets/vendor/mathjax.js`
- `firestore.rules`

## Cập nhật từ V21

1. Upload **toàn bộ** gói V22 (`index.html` + `assets/`) lên GitHub Pages.
2. `firestore.rules` V22 tương thích với Rules V21 và **không bắt buộc đổi Rules** nếu V21 đang chạy ổn, vì V22 chỉ ghi thêm field vào các document mà Rules hiện tại đã cho phép.
3. Đăng nhập giáo viên, mở Dashboard từng lớp một lần để tạo `analyticsV22` phục vụ so sánh lớp.
4. Học sinh sau lần đồng bộ V22 tiếp theo sẽ bổ sung `skillSnapshot`/`recentAttempts`; heatmap sẽ tự đầy dần.

## Lưu ý

Các hàm/kho mang tên `v21...` và `syncMeta/v21` được giữ để bảo toàn tương thích dữ liệu Data Safety V21; đây không phải lỗi phiên bản.
