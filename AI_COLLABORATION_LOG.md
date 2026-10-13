# Tóm Tắt Quá Trình Làm Việc Với AI (AI Collaboration Summary)

| # | Ứng viên yêu cầu / Câu hỏi | AI thực hiện & Phản hồi (Summary) |
| :---: | :--- | :--- |
| **1** | Đọc đề bài `candidate/README.md`, làm rõ yêu cầu với techstack: React, Express, Docker Postgres, Google Gen AI SDK. | Phân tích toàn bộ đề bài, schema, seed data; đề xuất 4 phương án làm rõ kiến trúc. |
| **2** | Phản biện bảo mật: Cách bảo vệ Read-only dùng Regex có dễ bị bypass không? Xử lý ra sao khi query kẹt, DB lỗi, LLM hết quota? | Phân tích lỗ hổng multi-statement injection; đề xuất phòng thủ 3 tầng (Prompt + Backend filter + Postgres role `shop_readonly`), cấu hình timeout 5s, giới hạn 100 dòng. |
| **3** | Yêu cầu thiết kế modular, clean code, scalable, maintainable, global error handling; giao diện minimalism không gradient/ai slop. | Đề xuất kiến trúc 3 tầng (Controllers - Services - Infrastructure), Response Envelope chuẩn, giao diện Vanilla CSS đơn sắc tối giản. |
| **4** | Lập `plan.md` chi tiết, tạo `.env` / `.env.example`, khởi tạo Git, chạy Docker Postgres và test kết nối. | Tạo kế hoạch 7 giai đoạn, chạy container `shop-db`, nạp `seed.sql`, tạo user `shop_readonly`, test chặn lệnh DELETE/DROP thành công. |
| **5** | Yêu cầu tách riêng file cấu hình, tuyệt đối không hardcode giá trị, tách file System Prompt riêng. | Tạo `config/env.ts`, `config/constants.ts`, `prompts/systemPrompt.ts`, `prompts/retryPrompt.ts`. |
| **6** | Thêm rule Unit test & Integration test, nghiêm cấm cố tình làm cho test pass (Zero Fake Passes), thiết kế code dễ test. | Ban hành `.agents/rules/testing.md`, áp dụng Dependency Injection (DI) để mock DB và LLM độc lập. |
| **7** | Ra lệnh thực thi dự án ("execute đi"). | Xây dựng hoàn chỉnh Backend Express và Frontend React, viết và chạy thành công **26/26 Unit & Integration Tests**, kiểm thử 8 câu hỏi mẫu. |
| **8** | Phát hiện lỗi UX: Nút trả lời nhanh bị trùng lặp nội dung với câu hỏi follow-up, yêu cầu bỏ nút đi. | Xóa nút bấm trùng lặp trên UI; tinh chỉnh prompt để câu hỏi đã rõ ràng thì không sinh follow-up thừa. |
| **9** | Yêu cầu tách biệt `reasoning` (suy luận kỹ thuật) và `answer` (câu trả lời thân thiện cho người dùng). | Tách schema thành 2 biến riêng biệt: đưa `answer` lịch sự ra giao diện chính, thu gọn `reasoning` vào mục chi tiết kỹ thuật. |
| **10** | Yêu cầu ẩn element khi giá trị là `null`; chặn sinh câu lệnh SQL giả (`SELECT 1 WHERE 1 = 0`) khi nhập chuỗi vô nghĩa (`abcxyz`). | Chuẩn hóa chuỗi `"null"` thành `null`, ẩn hoàn toàn khối SQL & Bảng khi không có SQL, cấm AI sinh câu lệnh dummy. |
| **11** | Yêu cầu các câu prompt injection, raw SQL delete, hidden delete, và tình huống bi kịch xin mã HTML để test UI. | Cung cấp bộ test vectors: DELETE trực diện, multi-statement injection, CTE delete, prompt override, và 5 kịch bản thao túng cảm xúc. |
