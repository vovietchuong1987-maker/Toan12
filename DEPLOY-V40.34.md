# Deploy Math12 Hub v40.34.0

1. Upload toàn bộ nội dung gói lên GitHub Pages, giữ nguyên cấu trúc thư mục.
2. Không cần thay `firestore.rules` nếu đang dùng Rules đầy đủ của v40.30+.
3. Sau khi GitHub Pages cập nhật, mở trang và nhấn `Ctrl + F5` một lần để nhận Service Worker v40.34.
4. Kiểm tra nhanh:
   - Học sinh: Hôm nay → làm bài → kết quả → sửa câu sai.
   - Giáo viên: trang chủ có `Quy trình giáo viên` và không có nút dẫn tới trang đã bị loại khỏi bản Lite.
   - Thử một thao tác xóa/khôi phục: hộp xác nhận phải dùng UI mới, không phải `window.confirm` của trình duyệt.
   - Thử trường nhập xác nhận `XOA`/`THAYTHE`: phải hiện Dialog nhập liệu mới.
   - Mở một vùng chưa có dữ liệu: trạng thái trống/tải/lỗi có biểu tượng thống nhất.
5. Chế độ kiểm tra đường cũ: thêm `?safe=1`. Dialog compatibility vẫn hoạt động vì core v40.34 đã chuyển confirm/prompt sang Math12UI; Teacher Workflow v40.34 sẽ không chạy trong Safe Mode.
