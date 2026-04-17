require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { loadMenu } = require("./menu");
const { extractOrder } = require("./openai");
const { extractOrderLocal } = require("./nlp");
const { calculateTotal } = require("./order");
const { createQR } = require("./payment");
const { saveOrder } = require("./db");

const userState = {};

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

let menu = [];

// load menu
(async () => {
  menu = await loadMenu();
  console.log("Menu loaded:", menu);
})();

// 👉 /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Chào bạn 🥰 shop bán trà sữa nè\nGõ 'menu' để xem món nha!"
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text) return;

  const text = msg.text.toLowerCase();

  // 👉 xem menu
  if (text.includes("menu")) {
    let drinks = "Menu đồ uống 🥤\n\n";
    let toppings = "\nTopping thêm 🍡\n\n";
    menu.forEach((m) => {
      if (m.category === "Topping") {
        toppings += `- ${m.name} (+${m.price_m}đ)\n`;
       } else {
        drinks += `- ${m.name} (${m.price_m}đ / ${m.price_l}đ)\n`;
       }
      });

    bot.sendMessage(chatId, drinks + toppings);
    return;
  }

  // 👉 đang chờ thanh toán
  if (userState[chatId]?.waitingPayment) {
    if (text.includes("done")) {
      bot.sendMessage(chatId, "shop nhận được rồi 😍 Đang làm món cho bạn nha!");
      delete userState[chatId];
    } else {
      bot.sendMessage(
        chatId,
        'bạn đang thanh toán rồi nè 😆\nXong thì nhắn "done" cho shop nha ❤️'
      );
    }
    return;
  }

  // 👉 confirm đơn
  if (userState[chatId]?.pendingOrder) {
    // ✔️ xác nhận
    if (/(yes|ok|ừ|oke|đồng ý|xác nhận)/.test(text)) {
      const order = userState[chatId].pendingOrder;
      const orderId = Date.now();

      // 👉 lưu DB
      saveOrder({
        chatId,
        ...order,
        orderId,
        status: "pending",
      });

      const payment = await createQR(orderId, order.total);

      await bot.sendMessage(
        chatId,
        `shop gửi QR thanh toán nè bạn 🥰\n💰 ${order.total.toLocaleString()}đ`
      );

      await bot.sendPhoto(chatId, payment.qr);

      await bot.sendMessage(
        chatId,
        `👉 Thanh toán: ${payment.link}\n\nXong nhắn "done" cho shop nha ❤️`
      );

      // 🔥 FIX: reset state (xoá pendingOrder)
      userState[chatId] = {
        waitingPayment: true,
      };

      return;
    }

    // ❌ huỷ đơn
    if (/(no|không|hủy)/.test(text)) {
      bot.sendMessage(chatId, "Ok bạn, chọn lại món giúp shop nha 🥰");
      delete userState[chatId];
      return;
    }

    // 👉 nếu chưa trả lời rõ
    bot.sendMessage(chatId, "bạn xác nhận giúp shop (yes/no) nha 🥰");
    return;
  }

  try {
    let order;

    // 👉 AI + fallback
    if (!process.env.OPENAI_API_KEY) {
      order = extractOrderLocal(text, menu);
    } else {
      try {
        order = await extractOrder(text, menu);
      } catch (err) {
        console.log("Fallback to local NLP...");
        order = extractOrderLocal(text, menu);
      }
    }

    // 👉 không hiểu
    if (!order || !order.items || order.items.length === 0) {
      bot.sendMessage(
        chatId,
        "shop chưa hiểu 😢\nCon thử lại hoặc gõ 'menu' nha 🥰"
      );
      return;
    }

    const result = calculateTotal(order, menu);

    if (result.details.length === 0) {
      bot.sendMessage(chatId, "Món này shop chưa có nha 😢");
      return;
    }

    // 👉 lưu state chờ confirm
    userState[chatId] = {
      pendingOrder: result,
    };

    const response = `
shop nhận đơn nè bạn 🥰

${result.details.join("\n")}

💰 Tổng: ${result.total.toLocaleString()}đ

👉 Xác nhận giúp shop (yes/no)
`;

    bot.sendMessage(chatId, response);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "shop hơi lú rồi 😢 thử lại nha");
  }
});
