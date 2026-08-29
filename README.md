# Math12 Hub V37.3.2 — Graph Visual Polish

Bản nâng cấp trực tiếp từ V37.3.1, giữ nguyên toàn bộ dữ liệu, Firestore Rules, Backup V2, TikZ V37.2 và Native Function Graph Engine V37.3.

## Nâng cấp giao diện đồ thị
- Phong cách đề thi THPT là mặc định cho đồ thị mới: không lưới, chỉ ghi các mốc có ý nghĩa.
- Đường cong đậm hơn trục; nét chiếu/tiệm cận mảnh và nhẹ hơn.
- Nhãn O, x, y và nhãn trục được căn lại để tránh chồng lấn.
- Tự tăng khoảng đệm khung vẽ để nhánh đồ thị ít bị sát/cắt mép.
- Điểm cực trị và nhãn tọa độ có cơ chế đặt nhãn thông minh hơn.
- SVG responsive, giới hạn chiều rộng phù hợp câu hỏi và mobile.
- Trong phòng thi ẩn thanh kỹ thuật/cấu hình để học sinh chỉ thấy hình.
- Export Graph → TikZ bổ sung các mốc đặc trưng trên trục khi dùng phong cách đề thi.

## Tương thích
- Các cấu hình V37.3 cũ vẫn đọc được.
- Không migration Firestore.
- Không thay firestore.rules / firestore.indexes.json.
