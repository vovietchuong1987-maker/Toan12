# Lộ trình nâng cấp Math12 Hub sau v40.25.1

## v40.26 — Stability & Security Core
- Rà soát đầy đủ Firestore Rules đang triển khai, đặc biệt users/classes/assignments/results/questionBank/arena.
- Chuyển điểm Arena sang xác thực bằng Cloud Function/backend hoặc signed attempt; client không còn là nguồn điểm tin cậy.
- Bổ sung kiểm tra quyền theo vai trò ở cả UI và Rules, khóa tuyệt đối answer key của Secure Exam.
- Hoàn thiện App Check theo lộ trình đo metrics → bật enforcement từng collection.

## v40.27 — Firestore Scale & Sync 2.0
- Thay cơ chế đồng bộ toàn bộ questionBank bằng delta sync theo document thay đổi.
- Phân trang/lazy load question bank trên cloud; không tải toàn bộ hàng nghìn câu mỗi lần đăng nhập.
- Giới hạn/restructure realtime Hall of Fame để không nghe toàn bộ collection khi dữ liệu tăng lớn.
- Chuẩn hóa cache, retry, conflict resolution và thống kê Reads/Writes thực tế.

## v40.28 — Modular Frontend & Performance
- Tách bundle JS ~3.3 MB thành module theo Student / Teacher / Admin / AI / Avatar / Arena.
- Lazy-load AI, Admin, báo cáo, Avatar/Shop khi mở trang tương ứng.
- Loại code legacy v37.x/v38.x sau khi lập dependency map và có regression tests.
- Chuẩn hóa Service Worker: precache shell nhỏ, runtime cache theo nhóm asset, cache-busting thống nhất.

## v40.29 — UX & Accessibility Pro
- Giảm văn bản mô tả dài, ưu tiên hành động chính và trạng thái ngắn gọn.
- Đồng nhất component, spacing, typography, trạng thái loading/error/empty.
- Tối ưu mobile 360–430 px, keyboard navigation, focus, aria-label và contrast.
- Chuẩn hóa giáo viên/học sinh/admin dashboard theo tác vụ quan trọng nhất.

## v40.30 — Production Quality Gate
- Regression test tự động cho đăng nhập, phân quyền, ngân hàng câu hỏi, tạo đề, làm bài, đồng bộ, Arena.
- Test import LaTeX/Word/PDF, TikZ/BBT/đồ thị/Oxyz và ID6.
- Thiết lập release checklist, backup/rollback, CSP/security headers, diagnostics có thể xuất file.
- Chỉ phát hành khi đạt bộ tiêu chí hiệu năng + bảo mật + không lỗi cú pháp/runtime trọng yếu.
