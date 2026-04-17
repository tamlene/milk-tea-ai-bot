1. Giới thiệu: Milk Tea AI Bot là chatbot bán hàng thông minh hoạt động trên Telegram, mô phỏng cách giao tiếp của "mẹ bán trà sữa". Bot sử dụng AI để hiểu yêu cầu của khách hàng, hỗ trợ đặt món, tính tiền và tạo QR thanh toán.
2. Tính năng chính
  - Chat tự nhiên bằng tiếng Việt (AI hiểu đơn hàng)
  - Xem menu trực tiếp trong chat
  - Trích xuất đơn hàng bằng: 
       + OpenAI (nếu có API key)
       + NLP local (fallback)
  - Tính tiền tự động
  - Tạo QR thanh toán
  - Lưu đơn hàng
  - Xác nhận đơn & trạng thái thanh toán
3. Kiến trúc hệ thống

   User (Telegram)
        ↓
   Bot (node-telegram-bot-api)
        ↓
   Xử lý ngôn ngữ (AI / NLP)
        ↓
   Xử lý đơn hàng (order.js)
        ↓
   Thanh toán (payment.js)
        ↓
   Lưu dữ liệu (db.js)

4.Cấu trúc project
 

 milk-tea-bot/
│
├── bot.js          # File chính chạy bot
├── menu.js         # Load menu từ CSV
├── Menu.csv        # Dữ liệu menu
├── openai.js       # Gọi OpenAI API
├── nlp.js          # Xử lý NLP local
├── order.js        # Tính toán đơn hàng
├── payment.js      # Tạo QR thanh toán
├── db.js           # Lưu đơn hàng (RAM/JSON)
├── .env            # Biến môi trường
├── package.json
└── README.md

5.Cài đặt
b1: clone project
Bash:
git clone https://github.com/tamlene/milk-tea-ai-bot.git
cd milk-tea-ai-bot

b2: Cài dependencies
Bash:
npm install

b3: Tạo file .env

TELEGRAM_BOT_TOKEN=your_telegram_token
OPENAI_API_KEY=your_openai_key (optional)

b4: chạy bot
bash: 
node bot.js

6. Deploy
Bot có thể deploy trên:
- Railway (khuyên dùng)
- Render
- VPS

7. Cách sử dụng

vào telegram tìm @milktea_tam_bot
bấm /start để bắt đầu

xem menu: vd:menu
đặt món: vd: cho mẹ 2 trà sữa trân châu size L
xác nhận: yes/no
        - yes đơn hàng sẽ chuyển qua phần thanh toán, thanh toán xong rồi mắt bắt đầu làm
        - no quay lại lựa chon menu
Sau khi thanh toán: nhấn done để hoàn thành đơn hàng 

8. Thanh toán
Hiện tại bot:

Tạo QR code thanh toán (mock / PayOS / VietQR)
Xác nhận thanh toán thủ công ("done")

9.Hướng phát triển

🔗 Tích hợp PayOS thật (auto xác nhận)
🧠 Fine-tune AI hiểu tiếng Việt tốt hơn
🗄️ Lưu database (MongoDB / MySQL)
📊 Dashboard quản lý đơn
📱 Mở rộng sang Zalo bot

10.Công nghệ sử dụng
Node.js
node-telegram-bot-api
OpenAI API
CSV Parser
QRCode