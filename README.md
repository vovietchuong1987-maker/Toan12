# Math12 Hub V37.8

**Build:** `37.8-avatar-foundation`

V37.8 nâng trực tiếp từ V37.7.1 và mở nền móng **nhân vật học tập (Avatar Foundation)** cho học sinh, không thay đổi ngân hàng câu hỏi, ID6, Exam Pro, Lesson Content Engine hoặc Firestore Rules/Indexes.

## Điểm mới

- Học sinh có mục **Nhân vật của em** trong nhóm Cá nhân.
- Avatar xuất hiện ở **topbar** và **dashboard học sinh**.
- Lần đầu tài khoản học sinh đăng nhập mà chưa có avatar, hệ thống mời chọn **Nam / Nữ**.
- Bộ tùy chỉnh tân thủ miễn phí:
  - 3 tông da;
  - 2 gương mặt;
  - 3 kiểu tóc riêng cho mỗi kiểu nhân vật Nam/Nữ;
  - 3 trang phục tân thủ.
- Avatar được dựng bằng **SVG nội bộ**, không phụ thuộc ảnh ngoài hoặc dịch vụ bên thứ ba.
- Lưu local-first trong `state.avatarV378`; khi đăng nhập sẽ đồng bộ vào trường `avatarV378` của chính `users/{uid}`.
- Không tạo collection Firestore mới và không thay đổi quyền tài khoản.
- Chưa kích hoạt EXP, vàng hay Shop. UI chỉ hiển thị `Lv.1 • Tân binh Toán học` làm nền cho V37.9.

## Nguyên tắc an toàn học tập

- Avatar và vật phẩm là **cosmetic**.
- V37.8 không cộng điểm, không sửa kết quả bài làm và không ảnh hưởng độ khó câu hỏi.
- Học sinh không thể dùng Avatar để tự thay đổi `role` hoặc `accountStatus`.

## Kế thừa nguyên vẹn

- Lesson Content Engine V37.7.
- TikZ Scope/Clip Hotfix V37.7.1.
- Exam Pro V37.6.
- Question Bank / ID6 / Figure Renderer hiện có.
- Firestore Rules, Indexes và Firebase config giữ nguyên byte-for-byte.

## Bước tiếp theo dự kiến

**V37.9 — EXP + Level + Gold Engine**: thưởng theo hoạt động học thật, có chống farm câu dễ và chưa mở Shop cho tới khi hệ thống kinh tế ổn định.

## Triển khai

Upload toàn bộ nội dung thư mục lên GitHub Pages như các bản trước. Sau khi thay bản, tải lại mạnh trình duyệt (`Ctrl + F5`) một lần để Service Worker chuyển sang `sw-v37.8.js`.
