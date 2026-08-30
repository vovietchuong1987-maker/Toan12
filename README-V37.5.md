# Math12 Hub V37.5 — Figure Production Engine & Release Gate

V37.5 kế thừa nguyên V37.4.8 và hoàn thiện chuỗi nâng cấp hình V37.4.5 → V37.4.8 thành quy trình Production có kiểm soát.

## Chức năng mới

1. **Figure Production Center** trong `Ngân hàng câu hỏi → Công cụ → Production Hình V37.5`.
2. **Release Gate hai mức**:
   - `OPERATIONAL READY`: không còn hình Approved bị lỗi QC, SVG hỏng hoặc cache lệch source hash.
   - `VERIFIED PRODUCTION`: ngoài điều kiện trên, mọi hình Approved đã được giáo viên xem và xác minh trực quan.
3. **Production signature**: chữ ký thay đổi nếu nội dung/đáp án/ID6/hình hoặc trạng thái xác minh của câu Approved thay đổi.
4. **Signed Production Snapshot**: khi chốt, hệ thống lưu chữ ký. Nếu ngân hàng thay đổi về sau, snapshot tự báo `stale`.
5. **Safe Repair**:
   - loại cache SVG hỏng hoặc không khớp source;
   - tạo lại Smart SVG khi renderer native hỗ trợ;
   - chuẩn hóa `figureKind`, `figureDisplay`, `figureRenderEngine`, `figureQC`;
   - giữ dấu xác minh chỉ khi source hash không đổi và QC vẫn đạt;
   - không sửa nội dung Toán, đáp án, ID6 hoặc `reviewStatus`.
6. **Production Manifest JSON**: xuất trạng thái ngân hàng, chữ ký, SHA-256 (khi trình duyệt hỗ trợ), thống kê hình và danh sách vấn đề.
7. **Production Center V35** có thêm regression của V37.5 và trạng thái Release Gate của ngân hàng đang mở.

## Nguyên tắc an toàn

- V37.5 **không tự bấm “Hình đúng”** thay giáo viên.
- `Chốt Production` chỉ là snapshot chất lượng trong Math12 Hub; không tự giao bài, không tự xuất bản cho học sinh.
- Approved cũ được giữ nguyên. Nếu chưa xác minh theo V37.4.7+, hệ thống báo cảnh báo chứ không hạ trạng thái.
- Firestore rules/indexes không thay đổi.

## Ngân hàng đi kèm

File `imports/math12-question-bank-F1-CLEAN-APPROVED-240-20260830.json` vẫn gồm **240/240 câu Approved**:
- 82 câu không hình;
- 76 TikZ;
- 82 `tkz-tab`;
- 5 TikZ đã có Stored SVG, và kiểm tra tĩnh cho thấy **0 cache Stored SVG lệch source hash**.

Các câu Approved cũ chưa có dấu xác minh V37.4.7 trong chính file JSON import sẽ được V37.5 phân loại là `legacy-approved` cho tới khi giáo viên xem và xác minh; đây là hành vi chủ đích, không phải lỗi dữ liệu.

## Kiểm thử

Trong Console có thể chạy:

```js
V375FigureProduction.regression()
V375FigureProduction.audit()
```

Mở `v375-production-preview.html` để xem mô phỏng giao diện Production Center mà không tác động dữ liệu thật.
