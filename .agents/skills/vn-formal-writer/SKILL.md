---
name: vn-formal-writer
description: Viết, biên tập và rà soát văn bản tiếng Việt trang trọng (formal / technical), tự nhiên như người có chuyên môn viết, loại bỏ "văn mẫu AI" và sáo rỗng. Áp dụng khi người dùng yêu cầu viết hoặc sửa báo cáo, tài liệu kỹ thuật, bài nghiên cứu, tóm tắt dự án, hoặc yêu cầu văn phong tiếng Việt tự nhiên, chuẩn mực, không rườm rà.
---

# Hướng dẫn Viết Tiếng Việt Trang trọng & Tự nhiên (Không Giọng AI)

## Mục tiêu

Tạo văn bản tiếng Việt trang trọng, mạch lạc, chuẩn mực về chính tả và cấu trúc, phản ánh tư duy chuyên môn thực tế thay vì giọng máy sinh (AI-generated). Trọng tâm là tính súc tích, bằng chứng cụ thể và nhịp điệu tự nhiên, tránh cứng nhắc máy móc.

---

## 1. Nguyên tắc Trình bày & Chính tả

1. **Chính tả và viết hoa chuẩn tiếng Việt**:
   - Chỉ viết hoa chữ cái đầu câu và tên riêng / danh từ riêng (người, địa danh, tổ chức).
   - Tiêu đề mục, tên bảng, tên hình dùng kiểu viết hoa chữ cái đầu (sentence case), không dùng Title Case kiểu tiếng Anh.
   - Thuật ngữ chuyên môn là danh từ chung thì viết thường (ví dụ: *kiểm thử hộp đen*, *cơ sở dữ liệu quan hệ*). Chi tiết xem [viet-hoa.md](references/viet-hoa.md).
2. **Định dạng trực quan linh hoạt**:
   - **Danh sách & Bảng**: Cho phép dùng danh sách gạch đầu dòng (bullet points) và bảng so sánh khi trình bày các tiêu chí kỹ thuật, danh mục chức năng hoặc các bước tiến trình để tăng tính trực quan và dễ tra cứu.
   - **Nhấn mạnh từ khóa**: Được phép in đậm (`**từ khóa**`) có chọn lọc ở các khái niệm hoặc kết quả cốt lõi để người đọc dễ nắm bắt nhanh, tránh in đậm tràn lan khắp đoạn.
   - **Biểu tượng**: Hạn chế emoji trang trí sặc sỡ trong tài liệu nghiêm túc; ưu tiên ký hiệu chuẩn hoặc bảng biểu markdown rõ ràng.
3. **Dấu câu và số liệu**:
   - Dùng dấu câu tiếng Việt chuẩn (phẩy, chấm, hai chấm, chấm phẩy); tránh lạm dụng gạch ngang dài (`—`) hoặc gạch nối ngắt quãng câu liên tục.
   - Khoảng giá trị diễn đạt bằng lời hoặc dấu gạch nối chuẩn: "từ 5 đến 10", "khoảng 20–30 phút".
   - Số liệu và dẫn chứng phải xác thực, không tự bịa thông tin. Chỗ chưa đủ dữ liệu thì ghi rõ `[Cần làm rõ: nội dung cần bổ sung]`.

---

## 2. Văn phong & Diễn đạt (Loại bỏ Giọng AI)

### A. Đi thẳng vào vấn đề
- Bỏ các câu mở bài khuôn sáo về bối cảnh chung chung như: *"Trong kỷ nguyên số...", "Trong bối cảnh công nghệ ngày càng phát triển...", "X đóng vai trò then chốt..."*.
- Mở đầu bằng vấn đề thực tế, mục tiêu cụ thể, hoặc phạm vi tài liệu cần giải quyết.

### B. Cụ thể hóa thay vì dùng từ rỗng nghĩa
- Tránh các tính từ sáo rỗng không đo lường được: *"mạnh mẽ"*, *"đột phá"*, *"toàn diện và phong phú"*, *"bức tranh toàn cảnh"*.
- Thay thế bằng số liệu, đại lượng, hành động cụ thể hoặc công nghệ thực tế (ví dụ: thay vì *"tối ưu hóa hiệu năng vượt bậc"*, viết *"giảm thời gian phản hồi từ 120ms xuống 45ms"*).

### C. Tránh cấu trúc đối xứng và văn mẫu gượng ép
- Hạn chế lặp lại mẫu *"không chỉ... mà còn..."*, *"không phải A mà là B"* trừ khi thực sự cần thiết đối chiếu.
- Không kết thúc mọi đoạn văn bằng câu tóm tắt lặp ý (*"Tóm lại, điều này cho thấy tầm quan trọng của..."*). Hãy để lập luận tự dẫn đến kết luận tự nhiên.
- Chi tiết các mẫu câu máy sinh và phương án viết lại: xem [giong-van-ai.md](references/giong-van-ai.md).

### D. Ngôi xưng và nhịp điệu
- **Ngôi xưng**:
  - Báo cáo nghiên cứu / học thuật: dùng ngôi thứ ba khách quan (*"báo cáo này"*, *"tài liệu này"*, *"nhóm tác giả"*).
  - Tài liệu kỹ thuật / trao đổi dự án: linh hoạt xưng hô tự nhiên và tôn trọng (*"chúng tôi"*, *"bạn"* hoặc thể chủ động).
- **Nhịp câu**: Linh hoạt xen kẽ giữa các câu diễn giải logic và các câu chốt ý gãy gọn. Tách các câu quá dài (trên 40–50 từ) thành các mệnh đề độc lập để câu văn sáng sủa.

---

## 3. Quy trình Thực hiện (Linh hoạt, Thực tế)

1. **Xác định mục tiêu & đối tượng**:
   - Nắm rõ loại văn bản (tài liệu kỹ thuật, báo cáo phân tích, tóm tắt đồ án, hay tài liệu bàn giao).
   - Nắm tài liệu nguồn và các yêu cầu cốt lõi người dùng đã cung cấp; chỉ hỏi lại khi thực sự thiếu thông tin quan trọng.
2. **Soạn thảo / Biên tập**:
   - Áp dụng cấu trúc logic theo [cau-truc-bao-cao.md](references/cau-truc-bao-cao.md).
   - Nếu viết lại văn bản có sẵn: giữ nguyên dữ kiện thực tế, trau chuốt lại câu từ gãy gọn, loại bỏ các từ đệm và văn mẫu AI.
3. **Kiểm tra & Rà soát (Tùy chọn)**:
   - Tự rà soát các tiêu chí chính: viết hoa đúng, không sáo rỗng, dẫn chứng rõ ràng, bố cục sáng.
   - Đối với tài liệu báo cáo dài hoặc khi người dùng yêu cầu kiểm tra kỹ càng, có thể sử dụng công cụ hỗ trợ `python scripts/lint_vi.py <file.md>` để tham khảo cảnh báo (không xem lint là rào cản tuyệt đối).
4. **Phản hồi**:
   - Trả lời trực tiếp, rõ ràng, tập trung vào nội dung văn bản. Nếu có điểm cần lưu ý hoặc thiếu dữ liệu, nêu ngắn gọn ở cuối.

---

## 4. Tài liệu Tham khảo Đi kèm

- [giong-van-ai.md](references/giong-van-ai.md): Bảng phân tích các mẫu câu AI quen thuộc, cụm từ sáo rỗng và ví dụ viết lại.
- [viet-hoa.md](references/viet-hoa.md): Quy tắc viết hoa chính tả tiếng Việt, số liệu, đơn vị, danh từ riêng.
- [cau-truc-bao-cao.md](references/cau-truc-bao-cao.md): Bố cục tiêu chuẩn cho báo cáo, bài nghiên cứu và tài liệu kỹ thuật.
- [lint_vi.py](scripts/lint_vi.py): Script Python hỗ trợ rà soát định dạng và các dấu hiệu câu từ máy sinh.
