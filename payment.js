const QRCode = require("qrcode");

function createVietQR({ bankId, accountNo, accountName, amount, content }) {
  const url = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    content
  )}&accountName=${encodeURIComponent(accountName)}`;

  return url;
}

async function createQR(orderId, amount) {
  const bankId = "970422"; // MB Bank
  const accountNo = "123456789"; // 👉 sửa
  const accountName = "LE NGOC TAM";

  const content = `Thanh toan don ${orderId}`;

  const vietqrUrl = createVietQR({
    bankId,
    accountNo,
    accountName,
    amount,
    content,
  });

  // 👉 convert URL → QR buffer (IMPORTANT)
  const qrBuffer = await QRCode.toBuffer(vietqrUrl);

  return {
    link: vietqrUrl,
    qr: qrBuffer, // 🔥 buffer thay vì link
  };
}

module.exports = { createQR };