# Ask the Database

Ứng dụng web tự động chuyển đổi câu hỏi ngôn ngữ tự nhiên (tiếng Việt/tiếng Anh) thành truy vấn SQL an toàn, thực thi trực tiếp trên cơ sở dữ liệu PostgreSQL của cửa hàng và hiển thị kết quả trực quan.

Dự án được xây dựng theo kiến trúc phân tầng (3-Layer Architecture), giao diện **Minimalism** hiện đại, cơ chế phòng thủ **Read-Only 3 tầng**, tự động **Retry 3 lần** khi gặp lỗi cú pháp SQL và cam kết **hệ thống không bao giờ crash**.

---

## 1. Hướng dẫn Khởi chạy (How to Run)

### Yêu cầu Tiền đề (Prerequisites)
- **Node.js**: v18+ (khuyên dùng v20 hoặc v22)
- **Docker**: Docker Desktop đang hoạt động

### Bước 1: Khởi động Database PostgreSQL trên Docker
Chạy container và nạp dữ liệu mẫu ban đầu:
```bash
# 1. Khởi chạy PostgreSQL container
docker run -d --name shop-db -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shop \
  postgres:16

# 2. Nạp dữ liệu mẫu (seed data)
docker exec -i shop-db psql -U postgres -d shop < candidate/seed.sql

# 3. Tạo tài khoản Read-Only và thiết lập giới hạn bảo mật (timeout 5s)
docker exec -i shop-db psql -U postgres -d shop < scripts/setup-db.sql
```

### Bước 2: Cấu hình Biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc từ mẫu `.env.example`:
```bash
cp .env.example .env
```
Nội dung file `.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (Sử dụng user shop_readonly an toàn)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=shop
POSTGRES_USER=shop_readonly
POSTGRES_PASSWORD=shop_readonly_secret
DATABASE_URL=postgresql://shop_readonly:shop_readonly_secret@localhost:5432/shop

# LLM Configuration (Google Gen AI SDK)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Query Constraints & Session
MAX_QUERY_ROWS=100
QUERY_TIMEOUT_MS=5000
MAX_RETRY_ATTEMPTS=3
SESSION_TTL_MS=1800000
```
*(Ghi chú: Thay `your_gemini_api_key_here` bằng Google Gemini API Key của bạn).*

### Bước 3: Cài đặt Dependencies & Khởi chạy Ứng dụng
```bash
# Cài đặt toàn bộ dependencies cho root, server và client
npm install
cd server && npm install && cd ../client && npm install && cd ..

# Chạy đồng thời Server (cổng 5000) và Client (cổng 3000)
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

### Bước 4: Chạy Toàn bộ Test Suite
Dự án có đầy đủ **26 Unit & Integration Tests** (chạy trên PostgreSQL Docker thật):
```bash
npm test
```

---

## 2. LLM & SDK Sử dụng

- **SDK**: `@google/genai` (Google Gen AI SDK chính thức phiên bản mới nhất).
- **Mô hình (Model)**: `gemini-2.5-flash` (hoặc `gemini-2.5-pro` tùy cấu hình trong `.env`).
- **Cơ chế Structured Output**: Sử dụng JSON Schema của SDK (`responseMimeType: 'application/json'`, `responseSchema`) để đảm bảo Gemini trả về đúng cấu trúc dữ liệu 100%, không bị vướng markdown thừa.

---

## 3. Cách Ứng dụng Xử lý các Câu hỏi 5–8 và Lý do (Questions 5–8)

Đề bài nêu rõ: *"Not every question has a normal answer. Decide what your app should do."* Hệ thống xử lý các trường hợp đặc biệt như sau:

| Câu hỏi | Hành vi của Ứng dụng | Lý do thiết kế |
| :--- | :--- | :--- |
| **5. List all orders from 2024** | Sinh câu lệnh SQL lọc năm 2024 chuẩn xác (`WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31'`). Database thực thi và trả về **0 dòng**. Giao diện hiển thị bảng trống kèm thông báo thân thiện và gợi ý xem đơn hàng năm 2025. | Tập dữ liệu mẫu (`seed.sql`) chỉ có dữ liệu từ `2025-01-01` đến `2026-10-12`. Việc sinh SQL đúng thời gian lọc giúp hệ thống hoạt động tự nhiên, không phỏng đoán bừa bãi. |
| **6. Show employee salaries** | Mô hình AI phát hiện bảng không tồn tại trong schema, đặt `sql: null`, và giải thích rõ ràng: *"Cơ sở dữ liệu chỉ chứa thông tin khách hàng, sản phẩm và đơn hàng, không có bảng lưu lương nhân viên."* Kèm câu hỏi gợi ý chuyển hướng. | Ngăn chặn hiện tượng ảo giác (Hallucination) tự bịa bảng hoặc cột không có thật, giúp người dùng hiểu rõ phạm vi dữ liệu hiện có. |
| **7. Delete all cancelled orders** | Từ chối ngay lập tức: đặt `sql: null`, bật cờ `isRefusal: true`, và giải thích: *"Yêu cầu bị từ chối vì hệ thống hoạt động ở chế độ Chỉ đọc (Read-Only)."* Đồng thời gợi ý người dùng xem danh sách đơn hủy thay vì xóa. Nếu có cố tình bypass, PostgreSQL role `shop_readonly` và bộ lọc an toàn đa tầng sẽ chặn đứng. | Tuân thủ tuyệt đối quy tắc cốt lõi: **Ứng dụng không bao giờ được thay đổi hay xóa dữ liệu**. |
| **8. What is the best product?** | Nhận diện câu hỏi có tính chủ quan/mơ hồ: bật cờ `isAmbiguous: true`, đưa ra giả định mặc định (tính theo tổng doanh thu từ các đơn hàng đã thanh toán), sinh SQL cho giả định này, đồng thời đưa ra **Câu hỏi làm rõ (Follow-up Question)**: *"Bạn muốn đánh giá theo tổng doanh thu hay số lượng bán ra?"* | Thay vì từ chối hoặc trả về kết quả mập mờ, ứng dụng vừa cung cấp câu trả lời hữu ích tức thì, vừa mở ra hướng tương tác follow-up trong session hội thoại. |

---

## 4. Cách sử dụng Công cụ AI Coding (AI Tools Usage)

- **Công cụ sử dụng**: Antigravity AI Coding Assistant (mô hình Gemini 3.8 Flash).
- **Quy trình tương tác & Giám sát**:
  - *Giai đoạn Phân tích*: Đọc kỹ tài liệu đề bài, đặt các câu hỏi làm rõ các điểm mơ hồ (cơ chế Read-only, cách xử lý câu hỏi 5–8, vòng lặp retry 3 lần).
  - *Kiểm soát An toàn & Phản biện*: 
    - Ban đầu cân nhắc dùng Regex blacklist đơn thuần; nhận thấy dễ bị bypass qua multi-statement (`COMMIT; DROP TABLE`), quyết định chuyển sang **Phòng thủ 3 tầng**: AI prompt + Sanitizer + PostgreSQL `shop_readonly` role với `default_transaction_read_only = on`.
    - Phát hiện và sửa kịp thời lỗi tham chiếu biến trong module JSON parser (`parseAndValidateResponse`) nhờ quy trình test tự động.
  - *Bộ quy tắc Test Integrity*: Áp dụng quy tắc "Zero Cheating / No Fake Passes", bắt buộc viết unit test và integration test thực thụ với PostgreSQL container, từ chối mọi hình thức test pass giả tạo.

---

## 5. Những Cải tiến nếu có Thêm Thời gian (Future Improvements)

1. **Trực quan hóa Dữ liệu (Data Visualization)**: Tự động vẽ biểu đồ cột/đường (Bar/Line Chart) cho các câu hỏi dạng thống kê xu hướng như doanh thu theo tháng hoặc top khách hàng.
2. **Cơ chế Caching & Vector Semantic Search**: Cache lại các cặp câu hỏi - SQL phổ biến qua Redis để phản hồi tức thì trong < 10ms mà không cần gọi lại LLM.
3. **Phân tích Cú pháp SQL AST Nâng cao**: Tích hợp thư viện parse AST (`node-sql-parser`) để kiểm tra câu lệnh ở tầng trừu tượng sâu hơn, hỗ trợ tối ưu hóa index gợi ý.
4. **Hỗ trợ Export Dữ liệu**: Cho phép người dùng tải kết quả bảng truy vấn dưới dạng CSV hoặc Excel với một click chuột.
5. Authencation
6. Ratelimit
7. Lưu lịch sử trò chuyện
8. 
