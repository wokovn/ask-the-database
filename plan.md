# Kế hoạch Triển khai Chi tiết: Ask the Database

## 1. Mục tiêu Dự án
Xây dựng ứng dụng web tương tác (React + Express + PostgreSQL + Google Gen AI SDK) cho phép người dùng đặt câu hỏi bằng ngôn ngữ tự nhiên, hệ thống tự động sinh SQL, thực thi an toàn trên PostgreSQL, và hiển thị kết quả trực quan.

Đáp ứng đầy đủ các tiêu chí cốt lõi:
1. **Chế độ Read-only an toàn tuyệt đối**: Không bao giờ thay đổi hoặc xóa dữ liệu (bảo vệ 3 lớp: AI validation + backend guard + Postgres role permissions).
2. **Hệ thống không bao giờ crash**: Xử lý toàn bộ lỗi ngoại lệ (DB mất kết nối, timeout, LLM quota/auth, SQL lỗi, bảng không tồn tại) với thông báo thân thiện.
3. **Cơ chế tự động Retry 3 lần**: Khi SQL bị lỗi cú pháp, tự động gửi lỗi về cho Gemini sửa tối đa 3 lần.
4. **Hỗ trợ hội thoại & Follow-up**: Quản lý session giúp làm rõ các câu hỏi mơ hồ (như "sản phẩm tốt nhất").
5. **Giao diện Minimalism**: Tinh tế, đơn sắc (monochromatic), không gradient lòe loẹt ("no AI-slop"), bảng dữ liệu sạch sẽ, rõ ràng.

---

## 2. Các giai đoạn triển khai (Roadmap)

### Giai đoạn 1: Môi trường & Cơ sở dữ liệu (Database Setup)
- [x] Khởi tạo Git repository và cấu hình `.gitignore`.
- [x] Cấu hình file `.env` và `.env.example`.
- [x] Khởi chạy container PostgreSQL 16 qua Docker.
- [x] Nạp `seed.sql` (100 khách hàng, 20 sản phẩm, 700 đơn hàng).
- [x] Thiết lập Role `shop_readonly` (quyền SELECT duy nhất, statement timeout 5s).
- [x] Kiểm thử kết nối và kiểm thử quyền từ chối lệnh DELETE/UPDATE.

### Giai đoạn 2: Khởi tạo Cấu trúc Monorepo & Dependencies
- [ ] Tạo root `package.json` với script điều phối (`concurrently`).
- [ ] Thiết lập thư mục `server/`:
  - Cài đặt `express`, `cors`, `dotenv`, `pg`, `@google/genai`, `typescript`, `@types/node`, `@types/express`, `@types/cors`, `@types/pg`, `tsx`.
  - Cấu hình `tsconfig.json`.
- [ ] Thiết lập thư mục `client/`:
  - Khởi tạo React + Vite + TypeScript.
  - Cấu hình Vanilla CSS Design System (Minimalism theme).

### Giai đoạn 3: Xây dựng Backend (3-Layer Modular Architecture)
- [ ] **Infrastructure Layer**:
  - `infrastructure/db/postgres.ts`: Quản lý `pg.Pool`, cấu hình timeout, hàm kiểm tra health-check.
  - `infrastructure/llm/geminiClient.ts`: Kết nối `@google/genai`, cấu hình Structured JSON schema, xử lý lỗi API (quota, auth, safety).
  - `infrastructure/session/sessionStore.ts`: Interface trừu tượng `SessionStore` + implementation `InMemorySessionStore`.
  - `infrastructure/errors/appError.ts`: Hệ thống phân cấp lỗi và middleware xử lý lỗi toàn cục (Global Error Middleware).
- [ ] **Service Layer**:
  - `services/schemaService.ts`: Cung cấp schema metadata và business rules cho prompt.
  - `services/queryExecutor.ts`: Thực thi query trên DB với giới hạn 100 dòng, timeout 5s, và vòng lặp Retry 3 lần khi SQL lỗi.
  - `services/chatService.ts`: Điều phối luồng xử lý: kiểm tra câu hỏi -> sinh SQL qua Gemini -> thực thi / retry -> phản hồi follow-up.
- [ ] **Controller & Route Layer**:
  - `controllers/chatController.ts`: Endpoint `POST /api/chat`.
  - `controllers/healthController.ts`: Endpoint `GET /api/health` kiểm tra kết nối DB và trạng thái API Key.

### Giai đoạn 4: Xây dựng Frontend React (Minimalist UI)
- [ ] Thiết lập Design System Vanilla CSS (Variables, Dark mode dịu mắt, border 1px tinh tế, monospace font).
- [ ] Xây dựng Components:
  - `Header`: Tiêu đề & Status Badge kết nối Database (🟢 / 🔴).
  - `ChatWindow`: Danh sách tin nhắn hội thoại mượt mà.
  - `SqlViewer`: Hộp hiển thị SQL code tối giản có nút Copy nhanh.
  - `DataTable`: Bảng dữ liệu sạch sẽ, format số tiền VND rõ ràng, cảnh báo giới hạn 100 dòng.
  - `StatusNotification`: Thông báo trạng thái retry (lần 1/3, 2/3...) và cảnh báo.
  - `PromptInput`: Ô nhập câu hỏi kèm các gợi ý câu hỏi mẫu (Test questions 1-8).
- [ ] Tích hợp Custom Hooks:
  - `useChatSession`: Quản lý state hội thoại, loading, gửi tin nhắn, nhận follow-up.
  - `useHealth`: Kiểm tra trạng thái server & DB.

### Giai đoạn 5: Kiểm thử Toàn diện & Xử lý Edge Cases
- [ ] Kiểm thử 8 câu hỏi mẫu trong `README.md`:
  1. *How many customers are there?* (Kiểm tra count = 100)
  2. *Top 3 customers by total spending* (Kiểm tra điều kiện `status = 'paid'`)
  3. *Customers who never placed an order* (Kiểm tra `NOT EXISTS` / `LEFT JOIN IS NULL`)
  4. *Monthly revenue in 2025* (Kiểm tra gom nhóm theo tháng, lọc `paid`)
  5. *List all orders from 2024* (Dữ liệu rỗng -> thông báo thân thiện)
  6. *Show employee salaries* (Không có bảng -> LLM giải thích rõ ràng)
  7. *Delete all cancelled orders* (Thao tác bị chặn ngay lập tức)
  8. *What is the best product?* (Câu hỏi mơ hồ -> đưa ra câu hỏi follow-up làm rõ)
- [ ] Kiểm thử các trường hợp lỗi:
  - Tắt Docker DB xem giao diện phản ứng thế nào.
  - Nhập câu lệnh SQL timeout (> 5s).
  - Nhập câu hỏi ngẫu nhiên không liên quan.

### Giai đoạn 6: Hoàn thiện Tài liệu (Submit README)
- [ ] Tạo file `README.md` chính ở root:
  - Hướng dẫn chạy (Docker, cài đặt, biến môi trường).
  - Model và SDK đã sử dụng.
  - Giải thích cách xử lý các câu 5–8 và lý do.
  - Những cải tiến nếu có thêm thời gian.
