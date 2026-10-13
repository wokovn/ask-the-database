# Ask the Database

Ứng dụng web chuyển đổi câu hỏi tự nhiên (tiếng Việt hoặc tiếng Anh) thành truy vấn SQL, thực thi trực tiếp trên cơ sở dữ liệu PostgreSQL của cửa hàng và hiển thị kết quả dạng bảng trên giao diện.

Dự án được tổ chức theo kiến trúc ba tầng (Controllers – Services – Infrastructure), giao diện tối giản (Minimalism), cơ chế bảo vệ dữ liệu chỉ đọc ba lớp (Prompt – Backend Sanitizer – PostgreSQL Role), cơ chế tự động thử lại tối đa ba lần khi gặp lỗi truy vấn, và bộ xử lý lỗi tập trung ngăn ứng dụng dừng đột ngột.

---

## 1. Hướng dẫn khởi chạy

### Yêu cầu môi trường
- Node.js: phiên bản 18 trở lên (khuyến nghị phiên bản 20 hoặc 22)
- Docker: Docker Desktop đang chạy

### Bước 1: Khởi động cơ sở dữ liệu PostgreSQL trên Docker
Khởi chạy container và nạp dữ liệu mẫu ban đầu:
```bash
# 1. Khởi chạy container PostgreSQL
docker run -d --name shop-db -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shop \
  postgres:16

# 2. Nạp dữ liệu mẫu (700 đơn hàng)
docker exec -i shop-db psql -U postgres -d shop < candidate/seed.sql

# 3. Tạo tài khoản chỉ đọc và thiết lập giới hạn an toàn (thời gian chờ 5 giây)
docker exec -i shop-db psql -U postgres -d shop < scripts/setup-db.sql
```

### Bước 2: Thiết lập biến môi trường
Tạo tệp `.env` tại thư mục gốc từ mẫu `.env.example`:
```bash
cp .env.example .env
```

Nội dung tệp `.env`:
```env
# Cấu hình máy chủ
PORT=5000
NODE_ENV=development

# Cấu hình cơ sở dữ liệu (sử dụng tài khoản shop_readonly)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=shop
POSTGRES_USER=shop_readonly
POSTGRES_PASSWORD=shop_readonly_secret
DATABASE_URL=postgresql://shop_readonly:shop_readonly_secret@localhost:5432/shop

# Cấu hình mô hình ngôn ngữ (Google Gen AI SDK)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Giới hạn truy vấn và phiên làm việc
MAX_QUERY_ROWS=100
QUERY_TIMEOUT_MS=5000
MAX_RETRY_ATTEMPTS=3
SESSION_TTL_MS=1800000
```
*(Lưu ý: Thay `your_gemini_api_key_here` bằng khóa API Google Gemini của bạn).*

### Bước 3: Cài đặt thư viện và khởi chạy ứng dụng
```bash
# Cài đặt thư viện cho thư mục gốc, máy chủ và giao diện
npm install
cd server && npm install && cd ../client && npm install && cd ..

# Khởi chạy đồng thời máy chủ (cổng 5000) và giao diện (cổng 3000)
npm run dev
```

Truy cập ứng dụng tại địa chỉ: **http://localhost:3000**

### Bước 4: Chạy kiểm thử tự động
Dự án bao gồm 26 bài kiểm thử đơn vị và kiểm thử tích hợp (thực thi trực tiếp trên cơ sở dữ liệu Docker):
```bash
npm test
```

---

## 2. Mô hình ngôn ngữ và bộ công cụ kết nối

- **Bộ công cụ (SDK)**: `@google/genai` (Google Gen AI SDK chính thức).
- **Mô hình (Model)**: `gemini-2.5-flash` (hoặc `gemini-2.5-pro` theo cấu hình trong `.env`).
- **Cơ chế phản hồi có cấu trúc (Structured Output)**: Thiết lập lược đồ JSON qua tham số `responseMimeType: 'application/json'` và `responseSchema` của SDK nhằm đảm bảo phản hồi luôn tuân thủ đúng định dạng dữ liệu, tránh phát sinh văn bản thừa ngoài cấu trúc.

---

## 3. Cách xử lý các câu hỏi từ 5 đến 8 và lý do thiết kế

Đề bài đặt ra yêu cầu: *"Not every question has a normal answer. Decide what your app should do."* Hệ thống tiếp cận các trường hợp đặc biệt này như sau:

| Câu hỏi | Hành vi của ứng dụng | Lý do thiết kế |
| :--- | :--- | :--- |
| **5. List all orders from 2024** | Tạo truy vấn lọc dữ liệu năm 2024 (`WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31'`). Cơ sở dữ liệu thực thi và trả về 0 dòng kết quả. Giao diện hiển thị bảng trống kèm thông báo giải thích dữ liệu trong hệ thống chỉ bắt đầu từ năm 2025 và gợi ý xem đơn hàng năm 2025. | Tập dữ liệu mẫu (`seed.sql`) chỉ có đơn hàng từ `2025-01-01` đến `2026-10-12`. Việc tạo truy vấn chính xác theo yêu cầu người dùng giúp hệ thống phản ánh đúng thực tế dữ liệu thay vì tự ý suy diễn. |
| **6. Show employee salaries** | Nhận diện bảng lương nhân viên không tồn tại trong lược đồ cơ sở dữ liệu; đặt `sql: null`, giải thích cơ sở dữ liệu hiện tại chỉ lưu trữ khách hàng, sản phẩm và đơn hàng, đồng thời gợi ý chuyển sang các thông tin sẵn có. | Tránh hiện tượng mô hình tự bịa bảng hoặc cột không tồn tại, giúp người dùng nắm rõ giới hạn phạm vi thông tin của hệ thống. |
| **7. Delete all cancelled orders** | Từ chối thực hiện câu lệnh xóa dữ liệu; đặt `sql: null`, gắn cờ `isRefusal: true`, giải thích hệ thống hoạt động ở chế độ chỉ đọc và gợi ý người dùng xem danh sách các đơn hàng đã hủy. Nếu câu lệnh tìm cách vượt qua bộ lọc ứng dụng, vai trò `shop_readonly` tại PostgreSQL vẫn ngăn chặn trực tiếp ở tầng cơ sở dữ liệu. | Tuân thủ yêu cầu bắt buộc: **Hệ thống không bao giờ được sửa đổi hoặc xóa dữ liệu**. |
| **8. What is the best product?** | Xác định câu hỏi mang tính định tính và chưa rõ tiêu chí; gắn cờ `isAmbiguous: true`, thiết lập giả định mặc định (tính theo tổng doanh thu từ các đơn hàng thành công), tạo truy vấn cho giả định này, đồng thời đưa ra câu hỏi gợi ý làm rõ: *"Bạn muốn đánh giá theo tổng doanh thu hay số lượng bán ra?"* | Thay vì từ chối hoặc trả về kết quả mập mờ, ứng dụng vừa cung cấp câu trả lời tham khảo tức thì, vừa mở hướng tương tác làm rõ trong phiên trao đổi. |

---

## 4. Cách sử dụng công cụ AI trong quá trình phát triển

> Chi tiết từng lượt trao đổi được lưu tại tệp [AI_COLLABORATION_LOG.md](AI_COLLABORATION_LOG.md).

### A. Công cụ sử dụng
- **Trợ lý lập trình AI Antigravity** (mô hình **Gemini 3.8 Flash**).
- **Docker CLI**: Khởi tạo, cấu hình và quản trị cơ sở dữ liệu PostgreSQL 16.
- **Vitest và Supertest**: Tự động hóa kiểm thử đơn vị và tích hợp trên môi trường cơ sở dữ liệu thực tế.

### B. Các yêu cầu đưa ra cho AI

| Lượt | Yêu cầu từ ứng viên | Kết quả thực hiện của AI |
| :---: | :--- | :--- |
| **1** | Phân tích đề bài `candidate/README.md`, làm rõ yêu cầu với ngăn xếp công nghệ: React, Express, Docker PostgreSQL, Google Gen AI SDK. | Rà soát toàn bộ đề bài, lược đồ bảng và dữ liệu mẫu; đề xuất các phương án cấu trúc hóa ứng dụng. |
| **2** | Đặt câu hỏi phản biện về an toàn dữ liệu: Cơ chế chỉ đọc bằng biểu thức chính quy có bị vượt qua không? Xử lý thế nào khi truy vấn quá thời gian chờ, cơ sở dữ liệu gặp sự cố, hoặc mô hình cạn hạn ngạch API? | Phân tích rủi ro tiêm mã qua nhiều câu lệnh; đề xuất cơ chế phòng thủ ba lớp (Prompt – Backend Sanitizer – PostgreSQL Role `shop_readonly`), giới hạn thời gian chờ 5 giây và số dòng tối đa 100 dòng. |
| **3** | Yêu cầu thiết kế mã nguồn dạng mô-đun, dễ mở rộng, xử lý lỗi tập trung; giao diện theo phong cách tối giản, không sử dụng hiệu ứng màu mè. | Thiết lập kiến trúc ba tầng (Controllers – Services – Infrastructure), chuẩn hóa cấu trúc phản hồi API, xây dựng giao diện bằng CSS thuần với tông màu đơn sắc. |
| **4** | Lập kế hoạch triển khai chi tiết, tạo tệp cấu hình mẫu `.env.example`, khởi tạo Git, chạy Docker PostgreSQL và kiểm tra kết nối. | Soạn kế hoạch 7 giai đoạn, khởi động container `shop-db`, nạp dữ liệu `seed.sql`, cấu hình tài khoản `shop_readonly`, và xác minh cơ chế chặn các lệnh can thiệp dữ liệu. |
| **5** | Yêu cầu tách riêng tệp cấu hình, không gán cứng giá trị trong mã nguồn, và tách riêng các tệp câu lệnh chỉ dẫn cho mô hình. | Xây dựng các tệp `config/env.ts`, `config/constants.ts`, `prompts/systemPrompt.ts`, `prompts/retryPrompt.ts`. |
| **6** | Thiết lập quy định kiểm thử, cấm tạo các kiểm thử giả để vượt qua kiểm tra hình thức, áp dụng cơ chế tiêm phụ thuộc để thuận tiện kiểm thử. | Ban hành quy tắc kiểm thử tại `.agents/rules/testing.md`, áp dụng tiêm phụ thuộc giúp kiểm thử độc lập các tầng cơ sở dữ liệu và mô hình ngôn ngữ. |
| **7** | Yêu cầu tiến hành viết mã nguồn toàn bộ hệ thống. | Triển khai hoàn chỉnh máy chủ Express và giao diện React, hoàn thành 26 bài kiểm thử tự động, và kiểm tra thực tế 8 câu hỏi mẫu. |
| **8** | Phát hiện vấn đề giao diện: Nút trả lời nhanh lặp lại nguyên văn câu hỏi gợi ý, yêu cầu lược bỏ nút này. | Lược bỏ nút bấm trùng lặp trên giao diện; điều chỉnh câu lệnh chỉ dẫn để không tạo câu hỏi gợi ý khi yêu cầu người dùng đã rõ ràng. |
| **9** | Yêu cầu tách biệt phần giải thích kỹ thuật nội bộ (`reasoning`) và câu trả lời trực tiếp cho người dùng (`answer`). | Điều chỉnh lược đồ dữ liệu thành hai trường riêng: hiển thị câu trả lời thân thiện trên màn hình chính, đưa phần suy luận kỹ thuật vào mục chi tiết mở rộng. |
| **10** | Yêu cầu ẩn các thành phần giao diện khi giá trị là `null`; không sinh truy vấn giả dạng `SELECT 1 WHERE 1 = 0` khi người dùng nhập chuỗi ký tự vô nghĩa. | Chuẩn hóa chuỗi `"null"` về giá trị `null` nguyên thủy, ẩn hoàn toàn khối mã lệnh và bảng kết quả khi không có truy vấn, ngăn mô hình sinh truy vấn giả. |
| **11** | Yêu cầu cung cấp các mẫu thử tiêm lệnh, xóa dữ liệu gián tiếp, và các tình huống cố tình bẻ khóa logic để kiểm thử độ bền trên giao diện. | Soạn bộ dữ liệu kiểm thử an toàn: câu lệnh can thiệp trực tiếp, tiêm lệnh đa tầng, biểu thức bảng chung (CTE), và các kịch bản dẫn dắt ngữ cảnh. |

### C. Những điểm phản biện, thay đổi hoặc từ chối đề xuất của AI

| Hạng mục | Đề xuất ban đầu của AI | Quyết định của ứng viên | Lý do kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Cơ chế bảo vệ chỉ đọc** | Sử dụng biểu thức chính quy lọc từ khóa kết hợp phiên giao dịch `BEGIN READ ONLY;`. | **Từ chối đề xuất**. Yêu cầu tạo vai trò `shop_readonly` riêng trong PostgreSQL với thiết lập `default_transaction_read_only = on`. | Biểu thức chính quy và giao dịch đơn thuần dễ bị vượt qua bằng kỹ thuật ghép nhiều câu lệnh (`COMMIT; DROP TABLE...`). Khóa quyền ở tầng người dùng cơ sở dữ liệu là giải pháp triệt để. |
| **Phân định nội dung phản hồi** | Dùng chung một trường `reasoning` cho cả suy luận kỹ thuật lẫn câu trả lời hiển thị. | **Yêu cầu thay đổi**. Tách lược đồ thành hai trường: `reasoning` (suy luận nội bộ, đặt trong thẻ mở rộng) và `answer` (câu trả lời tự nhiên, ngắn gọn cho người dùng). | Người dùng cuối cần câu trả lời trực tiếp, dễ hiểu; không nên buộc người dùng đọc các bước suy luận trung gian của mô hình. |
| **Nút bấm gợi ý làm rõ** | Tạo nút bấm tự động điền lại nguyên văn câu hỏi gợi ý. | **Từ chối và loại bỏ**. Giữ lại thông điệp làm rõ dạng gợi ý văn bản, bỏ nút bấm điền tự động. | Nút bấm lặp lại nguyên văn nội dung gây rối giao diện và không phản ánh đúng ngữ cảnh người dùng đang tương tác. |
| **Xử lý chuỗi vô nghĩa (`abcxyz`)** | Tự động sinh câu lệnh giả `SELECT 1 WHERE 1 = 0` và hiển thị bảng 0 dòng. | **Từ chối đề xuất**. Ép giá trị `sql: null`, ẩn hoàn toàn khối câu lệnh và bảng kết quả trên giao diện. | Tránh gửi truy vấn không cần thiết xuống cơ sở dữ liệu và tránh làm người dùng hiểu nhầm rằng chuỗi ký tự ngẫu nhiên có liên quan đến dữ liệu cửa hàng. |
| **Xử lý giá trị `null`** | Mô hình trả về chuỗi văn bản `"null"`, giao diện nhận diện là chuỗi hợp lệ và hiển thị nguyên chữ `"null"`. | **Sửa lỗi triệt để**. Bổ sung bước chuẩn hóa chuỗi `"null"` thành giá trị `null` nguyên thủy tại cả máy chủ và giao diện. | Ngăn ngừa lỗi hiển thị các dòng thông tin dạng rác (*"Câu hỏi làm rõ: null"*). |
| **Kỷ luật kiểm thử** | Xu hướng viết các bài kiểm thử giản lược hoặc giả lập quá mức để vượt qua kiểm tra nhanh. | **Ban hành quy định nghiêm ngặt**. Yêu cầu dùng tiêm phụ thuộc, loại bỏ các phép so sánh hình thức, và chạy 6 bài kiểm thử tích hợp trên container cơ sở dữ liệu thực tế. | Bảo đảm tính xác thực của kiểm thử; bài kiểm thử phải phản ánh đúng lỗi nếu mã nguồn có sai sót. |

---

## 5. Hướng phát triển tiếp theo

1. **Trực quan hóa dữ liệu**: Tự động nhận diện kết quả phù hợp để vẽ biểu đồ cột hoặc biểu đồ đường cho các truy vấn thống kê xu hướng doanh thu và số lượng.
2. **Bộ nhớ đệm và tìm kiếm tương đồng**: Lưu trữ tạm thời các cặp câu hỏi và truy vấn phổ biến qua Redis để giảm độ trễ phản hồi xuống dưới 10 mili-giây.
3. **Phân tích cây cú pháp trừu tượng (SQL AST)**: Tích hợp bộ phân tích cú pháp để kiểm tra câu lệnh ở tầng cấu trúc và đưa ra khuyến nghị chỉ mục phù hợp.
4. **Xuất dữ liệu kết quả**: Bổ sung tính năng tải dữ liệu bảng kết quả dưới định dạng CSV hoặc bảng tính.
5. **Xác thực và phân quyền**: Quản lý phiên làm việc theo từng tài khoản người dùng cụ thể.
6. **Giới hạn tần suất gọi API**: Kiểm soát số lượng yêu cầu trong một khoảng thời gian để bảo vệ hạn mức dịch vụ mô hình ngôn ngữ.
7. **Lưu trữ lịch sử hội thoại**: Ghi nhận lịch sử tương tác vào cơ sở dữ liệu giúp người dùng tra cứu các phiên làm việc trước đó.
8. **Bộ nhớ đệm ngữ cảnh (Prompt Caching)**: Tận dụng cơ chế lưu trữ chỉ dẫn hệ thống tại nhà cung cấp mô hình để tiết kiệm chi phí và rút ngắn thời gian xử lý.
