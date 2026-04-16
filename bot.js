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
    "Chào con 🥰 Mẹ bán trà sữa nè\nGõ 'menu' để xem món nha!"
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text) return;

  const text = msg.text.toLowerCase();

  // 👉 xem menu
  if (text.includes("menu")) {
    let msgMenu = "Menu của mẹ đây nè 🥰\n\n";

    menu.forEach((m) => {
      if (m.category !== "Topping") {
        msgMenu += `- ${m.name} (${m.price_m}đ / ${m.price_l}đ)\n`;
      }
    });

    bot.sendMessage(chatId, msgMenu);
    return;
  }

  // 👉 đang chờ thanh toán
  if (userState[chatId]?.waitingPayment) {
    if (text.includes("done")) {
      bot.sendMessage(chatId, "Mẹ nhận được rồi 😍 Đang làm món cho con nha!");
      delete userState[chatId];
    } else {
      bot.sendMessage(
        chatId,
        'Con đang thanh toán rồi nè 😆\nXong thì nhắn "done" cho mẹ nha ❤️'
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
        `Mẹ gửi QR thanh toán nè con 🥰\n💰 ${order.total.toLocaleString()}đ`
      );

      await bot.sendPhoto(chatId, payment.qr);

      await bot.sendMessage(
        chatId,
        `👉 Thanh toán: ${payment.link}\n\nXong nhắn "done" cho mẹ nha ❤️`
      );

      // 🔥 FIX: reset state (xoá pendingOrder)
      userState[chatId] = {
        waitingPayment: true,
      };

      return;
    }

    // ❌ huỷ đơn
    if (/(no|không|hủy)/.test(text)) {
      bot.sendMessage(chatId, "Ok con, chọn lại món giúp mẹ nha 🥰");
      delete userState[chatId];
      return;
    }

    // 👉 nếu chưa trả lời rõ
    bot.sendMessage(chatId, "Con xác nhận giúp mẹ (yes/no) nha 🥰");
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
        "Mẹ chưa hiểu 😢\nCon thử lại hoặc gõ 'menu' nha 🥰"
      );
      return;
    }

    const result = calculateTotal(order, menu);

    if (result.details.length === 0) {
      bot.sendMessage(chatId, "Món này mẹ chưa có nha 😢");
      return;
    }

    // 👉 lưu state chờ confirm
    userState[chatId] = {
      pendingOrder: result,
    };

    const response = `
Mẹ nhận đơn nè con 🥰

${result.details.join("\n")}

💰 Tổng: ${result.total.toLocaleString()}đ

👉 Xác nhận giúp mẹ (yes/no)
`;

    bot.sendMessage(chatId, response);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Mẹ hơi lú rồi 😢 thử lại nha");
  }
});