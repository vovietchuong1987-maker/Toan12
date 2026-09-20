# Deploy Math12 Hub v40.33.0

1. Upload toàn bộ nội dung gói lên đúng thư mục GitHub Pages đang dùng.
2. Giữ nguyên `firestore.rules` hiện tại; v40.33 không yêu cầu thay Rules.
3. Sau khi GitHub Pages cập nhật, mở trang và nhấn `Ctrl + F5` một lần để nhận Service Worker `v40.33.0`.
4. Kiểm tra nhanh bằng một tài khoản học sinh:
   - Hôm nay → mở một bài luyện tự chấm.
   - Nộp bài có ít nhất một câu sai → thấy nút “Sửa … câu sai”.
   - Hoàn thành lượt sửa → thấy EXP và “Việc tiếp theo”.
   - Nộp một Secure Assignment → thấy “Chờ giáo viên chấm” và có thể tiếp tục học.
5. Nếu cần đối chiếu giao diện trước, thêm `?safe=1` vào URL để tắt lớp UX mới.
