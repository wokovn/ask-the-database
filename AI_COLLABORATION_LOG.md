# Nhật Ký Làm Việc & Phối Hợp với AI (AI Collaboration Log)

> **Tài liệu dành cho Người chấm bài / Nhà tuyển dụng (Reviewer)**  
> Ghi lại toàn bộ hành trình trao đổi giữa **Ứng viên (Candidate)** và **AI Coding Assistant (Antigravity - Gemini 3.8 Flash)** theo đúng tiêu chí đánh giá trong `README.md`:
> *"Show us how you use them: what you ask, what you check, and what you fix or reject."*

---

## 📌 Tổng quan Vai trò (Collaboration Dynamic)
* **Ứng viên (Lead Engineer)**: Giữ vai trò Kiến trúc sư trưởng và Tech Lead. Đặt câu hỏi, phản biện giải pháp bảo mật, đặt ra các tiêu chuẩn kỹ thuật (Clean Code, Modular, Zero-Hardcode, Test Integrity), phát hiện lỗi UI/UX và chỉ đạo hướng khắc phục.
* **AI Assistant (Pair Programmer)**: Đóng vai trò lập trình viên thực thi tốc độ cao. Tiếp nhận yêu cầu, phân tích mã nguồn, đề xuất phương án kiến trúc, viết code, chạy lệnh kiểm thử và sửa lỗi theo phản hồi của ứng viên.

---

## 🗓️ Chi tiết Từng Lượt Trao đổi (Chronological Log)

### Lượt 1: Làm rõ Yêu cầu Ban đầu & Đọc Đề bài
* **Ứng viên yêu cầu**:
  > *"Đọc file readme trong candidate/ và hỏi thêm các câu hỏi để làm rõ yêu cầu, một số quyết định có sẵn như sau: frontend bằng react, backend bằng express; database chạy trên docker, LLM dùng của google gen ai sdk."*
* **AI thực hiện (Summary)**:
  * Đọc toàn bộ `candidate/README.md`, `schema.sql` và `seed.sql`.
  * Đặt 4 câu hỏi trắc nghiệm tương tác: Cấu trúc monorepo, cơ chế bảo vệ Read-Only, cách xử lý câu hỏi dị thường (câu 5–8), và cơ chế Retry khi SQL lỗi.
* **Đánh giá của Ứng viên**: Đồng ý khung cơ bản, nhưng phát hiện phương án bảo vệ Read-Only của AI tiềm ẩn lỗ hổng.

---

### Lượt 2: Phản biện Lỗ hổng Bảo mật & Xử lý Các tình huống Biên (Edge Cases)
* **Ứng viên yêu cầu & Phản biện**:
  > *"Cách 1 (Regex + BEGIN READ ONLY) có vẻ ổn nhưng có bị dễ dàng bypass? Còn cách nào tốt hơn; phân tích rõ các pros và cons. Response AI trả json gồm reasoning và string sql, có mơ hồ hay không, chat theo dạng session, nếu mơ hồ hỏi thêm câu hỏi follow up. Retry 3 lần như kiểu session... Vậy tạo user readonly cho LLM, nếu kết quả bảng trả về quá lớn thì sao, query bị treo, kẹt, db lỗi, chưa mở, llm api bị lỗi (hết quota, limit, chặn,...) xử lý ra sao?"*
* **AI thực hiện (Summary)**:
  * Thừa nhận và phân tích kỹ thuật lỗ hổng Multi-statement injection (`COMMIT; DROP TABLE...`) phá vỡ transaction.
  * Đưa ra giải pháp **Phòng thủ 3 tầng (Defense-in-Depth)**: Prompt Guard + Backend Sanitizer + PostgreSQL Role (`shop_readonly` với `default_transaction_read_only = on`).
  * Đề xuất phương án toàn diện cho các ca biên: statement_timeout 5s chống treo, hard-cap 100 dòng chống tràn RAM, phân loại lỗi Quota/Auth cho Gemini API, Health-check tự động.
* **Đánh giá của Ứng viên**: Thống nhất giải pháp tạo role DB riêng biệt và xử lý lỗi không bao giờ crash.

---

### Lượt 3: Chuẩn hóa Kiến trúc (Modular, Clean Code, Scalable) & Phong cách Giao diện
* **Ứng viên yêu cầu**:
  > *"Chốt lần cuối xem còn câu hỏi nào không, liên quan cách handle lỗi global, thiết kế phải modular, clean code, scaleable, maintainable,..."*
  > *"Cách 1 nhưng giao diện theme minimalism, không gradient/ai slop."*
* **AI thực hiện (Summary)**:
  * Đề xuất Kiến trúc 3 tầng (Controllers -> Services -> Infrastructure).
  * Chuẩn hóa Response Envelope `{ success, data, error }`.
  * Khóa phong cách giao diện: Vanilla CSS đơn sắc (monochromatic), đường viền mảnh 1px, typography hiện đại, từ chối mọi hiệu ứng lòe loẹt "AI slop".

---

### Lượt 4: Lập Kế hoạch Chi tiết, Setup Database & Kiểm thử Kết nối
* **Ứng viên yêu cầu**:
  > *"Chuẩn bị tạo plan.md chi tiết, file .env và env.example, khởi tạo git project, chạy db và test kết nối."*
* **AI thực hiện (Summary)**:
  * Tạo `plan.md`, `.env`, `.env.example`, `.gitignore` và khởi tạo git repository.
  * Kéo image `postgres:16`, khởi động container `shop-db`, nạp dữ liệu từ `candidate/seed.sql` (xác thực 700 orders).
  * Chạy script `scripts/setup-db.sql` tạo user `shop_readonly`.
  * Test thực tế lệnh `DELETE` và `DROP TABLE`: Postgres engine từ chối với lỗi `cannot execute in a read-only transaction`.

---

### Lượt 5: Yêu cầu Tuyệt đối Không Hardcode & Tách riêng System Prompt
* **Ứng viên yêu cầu**:
  > *"Các file cấu hình cần đặt riêng, không hard code các value, file chứa system prompt riêng."*
* **AI thực hiện (Summary)**:
  * Tách module cấu hình: `server/src/config/env.ts` (validate toàn bộ biến môi trường: port, timeouts, limits, session TTL) và `constants.ts`.
  * Tách biệt System Prompt: `server/src/prompts/systemPrompt.ts` và `server/src/prompts/retryPrompt.ts` hoàn toàn độc lập với code backend.

---

### Lượt 6: Ban hành Quy tắc Kiểm thử & Tính Chính trực của Test (Test Integrity)
* **Ứng viên yêu cầu**:
  > *"Thêm rule tạo unit test và integration test, không được cố tình làm cho test pass, viết app dễ test."*
* **AI thực hiện (Summary)**:
  * Tạo bộ quy tắc workspace rule: `.agents/rules/testing.md` và cập nhật vào `plan.md`.
  * Thiết kế theo Dependency Injection (DI) để Unit Test có thể mock PostgresPool và GeminiClient độc lập.
  * Cam kết "Zero Cheating / Red-Green": Không assert sáo rỗng (`expect(true).toBe(true)`), test phải fail khi logic sai, sửa code thực tế chứ không sửa kỳ vọng của test.

---

### Lượt 7: Thực thi Triển khai Toàn diện & Chạy Test Suite
* **Ứng viên yêu cầu**:
  > *"Execute đi."*
* **AI thực hiện (Summary)**:
  * Khởi tạo Monorepo, cài đặt dependencies cho root, server và client.
  * Hoàn thiện 3 tầng Backend: `GeminiClient`, `PostgresService`, `InMemorySessionStore`, `QueryExecutorService` (vòng lặp retry 3 lần), `ChatService`, Controllers.
  * Xây dựng Frontend React Minimalist với các component: `Header`, `SampleQuestions`, `SqlBlock`, `DataTable`, `ChatInput`.
  * Viết **26 Unit & Integration Tests** (chạy trên PostgreSQL container thật) — **100% Passed**.
  * Kiểm thử thành công cả 8 câu hỏi mẫu trong `candidate/README.md`.

---

### Lượt 8: Tinh chỉnh UI — Loại bỏ Nút Gợi ý Trùng lặp
* **Ứng viên phát hiện & yêu cầu**:
  > *"Câu trả lời gợi ý cho câu hỏi followup bị trùng với câu hỏi follow up, bỏ cái nút trả lời nhanh đi: Câu hỏi làm rõ tiếp theo... Bỏ cái nút trả lời nhanh đi."*
* **AI thực hiện (Summary)**:
  * Sửa `MessageItem.tsx`: Xóa nút `Trả lời: "..."` thừa thãi, chỉ giữ thông điệp câu hỏi làm rõ tinh tế.
  * Cập nhật `systemPrompt.ts`: Với câu hỏi đã rõ ràng cụ thể (câu 1, 2, 4), ép model đặt `followUpQuestion: null`.

---

### Lượt 9: Tách biệt Biến `reasoning` (Suy luận Kỹ thuật) và `answer` (Câu trả lời Thân thiện)
* **Ứng viên phát hiện & yêu cầu**:
  > *"Reasoning của AI và câu answer là 2 biến khác biệt, user không cần biết suy nghĩ của AI, cần một câu trả lời user friendly hơn giải thích ngắn gọn, trả lời thân thiện."*
* **AI thực hiện (Summary)**:
  * Tách đôi trường dữ liệu trong LLM Schema:
    - `reasoning`: Suy luận kỹ thuật (lưu log, phục vụ debug/chấm bài trong `<details>` thu gọn).
    - `answer`: Câu trả lời bằng tiếng Việt lịch sự, thân thiện gửi tới người dùng.
  * Cập nhật `geminiClient.ts`, `sessionStore.ts`, `chatService.ts` và `MessageItem.tsx`.

---

### Lượt 10: Xử lý Chuỗi `null` & Chống Sinh SQL Giả khi Nhập Chuỗi Vô nghĩa (`abcxyz`)
* **Ứng viên phát hiện & yêu cầu**:
  > *"Nếu null thì ẩn element; Câu hỏi làm rõ tiếp theo: null; nếu không có sql thì phải cho phép null hoặc ẩn đi: Câu hỏi 'abcxyz' là một chuỗi ký tự vô nghĩa, không thể ánh xạ tới bất kỳ bảng hay cột nào... PostgreSQL SELECT 1 WHERE 1 = 0..."*
* **AI thực hiện (Summary)**:
  * Khắc phục lỗi Gemini trả chuỗi `"null"` (truthy string): Chuẩn hóa `"null"` thành `null` nguyên thủy ở cả backend lẫn frontend.
  * Thêm quy tắc trong `systemPrompt.ts`: Khi gặp chuỗi vô nghĩa hoặc câu chào hỏi, cấm sinh `SELECT 1 WHERE 1 = 0`, bắt buộc đặt `sql: null`.
  * Cập nhật `MessageItem.tsx`: Nếu `sql` là null, ẩn hoàn toàn cả khối code `SqlBlock` và bảng dữ liệu `DataTable`.

---

### Lượt 11: Kiểm thử Bảo mật với Prompt Injection & Lệnh Xóa Ẩn
* **Ứng viên yêu cầu**:
  > *"Cho các câu prompt injection và raw sql delete, hidden delete để test trên UI."*
  > *"Cho prompt giả lập tình huống đau khổ xong kêu tạo html."*
* **AI thực hiện (Summary)**:
  * Cung cấp bộ test vector gồm: Raw SQL mutation (`DELETE`, `DROP`), Hidden delete (Multi-statement với `COMMIT`, CTE `WITH d AS (DELETE...) SELECT`), và Prompt Injection (Roleplay SuperAdmin, Format Spoofing).
  * Cung cấp 5 kịch bản "Sob Story / Emotional Appeal Jailbreak" (giả lập tình huống bi kịch, viện phí, nguy kịch y tế) để kiểm tra độ kiên định của AI trong việc từ chối sinh mã HTML ngoài phạm vi.

---

## 🎯 Tổng kết Điểm nhấn Kỹ thuật của Ứng viên
1. **Tư duy Bảo mật Chiều sâu (Defense-in-Depth)**: Không phó mặc an toàn cho LLM prompt, thiết lập cơ chế khóa cứng 3 tầng chặn đứng mọi hành vi xóa/sửa dữ liệu.
2. **Kỷ luật Kỹ thuật (Engineering Rigor)**: Đòi hỏi kiến trúc phân tầng rõ ràng, tuyệt đối không hardcode cấu hình, và ban hành quy tắc kiểm thử nghiêm ngặt không thỏa hiệp ("Zero Fake Passes").
3. **Mắt xích Đánh giá UX/UI Tinh tường**: Liên tục rà soát sản phẩm thực tế trên trình duyệt, phát hiện các hạt sạn nhỏ nhất (nút bấm trùng lặp, biến reasoning lộ cho user, render chữ "null", câu lệnh dummy `1=0`) và yêu cầu xử lý triệt để.
