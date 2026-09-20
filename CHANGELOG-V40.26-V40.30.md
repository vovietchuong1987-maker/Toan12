# Math12 Hub — Upgrade chain v40.26 → v40.30

## v40.26 — Stability & Security Core
- Firebase runtime bridge for add-on modules.
- Arena trusted-attempt guard.
- Hardened Arena Firestore rules.

## v40.27 — Firestore Delta Sync
- One-time compatibility bootstrap per device/account.
- Later teacher sync writes/deletes only changed documents.
- Legacy sync available through Safe Mode.

## v40.28 — Performance & Smart Loading
- Hall of Fame listener capped to 300 recently active profiles.
- Slimmer PWA pre-cache; heavy avatar images and lazy AI/Reports no longer block install.
- Runtime performance metrics and automatic lazy image decoding.

## v40.29 — UX Pro
- Focus-safe modal behavior, Escape support, skip link and aria-current.
- Mobile touch/input improvements, offline badge, reduced-motion behavior.
- Cleaner Vietnamese labels on student-facing surfaces.

## v40.30 — Production Quality Gate
- Runtime health checks, local error buffer, last-known-good marker.
- Admin diagnostics card/export.
- Safe Mode and release checksum manifest.


## v40.30.1 — Unified Profile Sync Fix
- Avatar no longer hard-codes Level 1 / Tân binh after the student has earned EXP.
- `gamificationV379` is the single display source for Level and Rank across Avatar, dashboard, shop/profile surfaces and Hall of Fame.
- Avatar compatibility payloads mirror the current learning Level/Rank instead of resetting them to starter values.
- Hall of Fame explicitly re-syncs after EXP/reward events.
- Dashboard removes duplicated Level/Rank from the lower EXP strip; the strip now focuses on EXP progress and gold.
- PWA cache revision bumped so GitHub Pages clients receive the fix immediately.

## v40.31.0 — UX Experience Upgrade
- Mobile **Cá nhân/Thêm** mở bottom-sheet tác vụ nhanh theo vai trò thay vì mở toàn sidebar.
- Tìm nhanh và Tài khoản/đồng bộ dễ tiếp cận hơn trên mobile.
- Ghi nhớ vị trí cuộn từng trang trong phiên và khôi phục khi quay lại.
- Chuẩn hóa các nhãn kỹ thuật/thương hiệu phụ thành tên người dùng dễ hiểu.
- Topbar, hero, touch target, card, form và table được tối ưu responsive.
- Loại badge ngoại tuyến trùng khi network status cũ đã hiển thị.
- Thêm nút lên đầu trang và chuyển trang nhẹ, hỗ trợ reduced motion.
- Không phát sinh Firestore Reads/Writes mới.

## v40.32.0 — Student Home Redesign
- Đổi dashboard học sinh thành màn hình **Hôm nay**.
- Ưu tiên bài giáo viên giao đang mở; nếu không có thì dùng Next Best Action của lộ trình v28.
- Tóm tắt tiến độ và bài được giao trong màn hình đầu, giảm trùng các khối cũ.
- Thêm lối tắt Lộ trình / Bài được giao / Câu sai / Thử thách.
- Không phát sinh Firestore query mới; tận dụng dữ liệu lõi đã tải.
- Giữ `?safe=1` để quay về lớp UX trước khi cần đối chiếu.

## v40.33.0 — Student Learning Flow
- Nối chu trình Hôm nay → Làm bài → Kết quả → Sửa câu sai → EXP → Việc tiếp theo.
- Làm lại đúng các câu vừa sai đối với bài tự chấm.
- Secure Assignment chỉ dẫn luồng tiếp theo mà không lộ đáp án.
- Đồng bộ trạng thái nộp vào dashboard ngay sau commit thành công, không thêm Firestore read nền.
- Thẻ tiếp tục vòng học trên trang Hôm nay và CTA theo ngữ cảnh.
