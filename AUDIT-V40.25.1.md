# Math12 Hub v40.25.1 — Cleanup audit

- Gỡ chú thích kỹ thuật không cần thiết khỏi giao diện học sinh.
- Ẩn các nhãn phiên bản cũ còn sót trong Avatar, Hall of Fame và Arena.
- Sửa các câu chữ bị khuyết sau các lần nâng cấp.
- Giữ các cảnh báo bảo mật cần thiết trong khu vực quản trị.
- Tăng cache revision để bản làm sạch được cập nhật sau deploy.
- Siết snippet Firestore Arena: chủ phòng/UID bất biến, score 0–10, duration không âm.
- Không xóa code legacy/bundle để tránh phá tương thích; tái cấu trúc bundle được đưa vào lộ trình nâng cấp tiếp theo.
