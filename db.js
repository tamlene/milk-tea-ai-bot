const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "orders.json");

// 👉 load dữ liệu từ file (nếu có)
function loadOrders() {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.log("❌ Load file error:", err);
    return [];
  }
}

// 👉 ghi lại file
function saveToFile(orders) {
  fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
}

// 👉 lưu đơn
function saveOrder(order) {
  const orders = loadOrders();
  orders.push(order);
  saveToFile(orders);
  console.log("✅ Saved order:", order);
}

// 👉 update trạng thái
function updateOrderStatus(orderId, status) {
  const orders = loadOrders();

  const index = orders.findIndex((o) => o.orderId === orderId);
  if (index !== -1) {
    orders[index].status = status;
    saveToFile(orders);
    console.log(`🔄 Updated order ${orderId} → ${status}`);
  } else {
    console.log("❌ Order not found");
  }
}

// 👉 debug xem tất cả đơn
function getAllOrders() {
  return loadOrders();
}

module.exports = {
  saveOrder,
  updateOrderStatus,
  getAllOrders,
};