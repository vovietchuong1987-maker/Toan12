# Math12 Hub V37.3.6 — Variation Arrow Rendering Fix

Nâng trực tiếp từ V37.3.5, giữ nguyên toàn bộ dữ liệu, Firestore Rules/Indexes và các engine V36–V37.

## Trọng tâm V37.3.6

- Bỏ phụ thuộc `marker-end` của SVG trong bảng biến thiên.
- Mỗi mũi tên biến thiên gồm thân đường + đầu tam giác SVG riêng.
- Đầu mũi tên được tính theo **pixel màn hình thật** (10 × 9 px), vì vậy không bị mất hoặc mảnh đi khi browser zoom, responsive hay in.
- `ResizeObserver` tự vẽ lại đầu mũi tên khi kích thước bảng thay đổi.
- Tự vẽ lại trước khi in.
- Nhãn cực đại/cực tiểu và ±∞ được đẩy xa đường phân cách hơn để bảng sạch.
- Giữ nguyên bố cục MCQ 2×2 của V37.3.5 trên desktop; đáp án dài/mobile vẫn 1 cột.

## Tương thích

- Không migration ngân hàng câu hỏi.
- Không tạo collection Firestore mới.
- Không thay `firestore.rules`.
- Không thay `firestore.indexes.json`.
- Giữ nguyên TikZ V37.2, Graph Engine V37.3.x, Backup V2 V37.1 và các engine V36–V37.

## Regression V37.3.6

- 3 khoảng biến thiên → 3 thân mũi tên + 3 đầu mũi tên.
- Không còn `marker-end` trong renderer V37.3.6.
- Kích thước đầu mũi tên giữ 10 × 9 px ở bố cục rộng và hẹp.
