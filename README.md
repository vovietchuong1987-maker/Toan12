# Math12 Hub V37.3.3 — Smart Graph Layout & Exam Presets

Nâng trực tiếp từ V37.3.2, giữ nguyên toàn bộ dữ liệu, Firestore Rules/Indexes, TikZ V37.2, Backup V2 và các engine V36–V37 trước đó.

## Trọng tâm V37.3.3

- Preset **Đề thi THPT** mặc định: hình sạch, không lưới, chỉ giữ các mốc cần thiết.
- Preset **Khảo sát đặc trưng**: hiện cực trị, giao trục, tọa độ điểm và điểm uốn của hàm bậc ba.
- Preset **Tiệm cận tối giản**: tập trung vào tiệm cận + giao trục cho các hàm phân thức.
- Preset **Tùy chỉnh** cho giáo viên tự kiểm soát toàn bộ hiển thị.
- **Smart Label Layout**: thử nhiều vị trí cho nhãn trục/điểm, ưu tiên vị trí ít đè lên đường cong và ít chồng nhãn khác.
- Khối **Tùy chỉnh nâng cao** mặc định thu gọn: xMin/xMax/yMin/yMax, lưới, cực trị, tiệm cận, nét chiếu, giao trục, tọa độ điểm, điểm uốn, Smart Labels.
- Nếu giáo viên thay đổi tùy chọn hiển thị thủ công, preset tự chuyển sang `Tùy chỉnh`.
- Giữ tương thích cấu hình Graph V37.3/V37.3.2 cũ; các cấu hình cũ khác preset mặc định sẽ được nhận diện là `custom`.
- Graph → TikZ tiếp tục hoạt động; preset khảo sát có thể xuất cả điểm uốn.

## 3 họ hàm giữ nguyên

1. `y = ax^3 + bx^2 + cx + d`
2. `y = (ax+b)/(cx+d)`
3. `y = (ax^2+bx+c)/(dx+e)`

## Không thay đổi dữ liệu

- Không tạo collection Firestore mới.
- Không migration ngân hàng câu hỏi.
- Không thay Firestore Rules.
- Không thay Firestore Indexes.
