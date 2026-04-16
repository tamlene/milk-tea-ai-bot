function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function calculateTotal(order, menu) {
  let total = 0;
  let details = [];

  for (let item of order.items) {
    // 👉 match tên mềm hơn
    const menuItem = menu.find(
      (m) =>
        normalize(m.name).includes(normalize(item.name)) ||
        normalize(item.name).includes(normalize(m.name))
    );

    if (!menuItem) continue;

    const size = item.size === "L" ? "L" : "M";
    const price = size === "L" ? menuItem.price_l : menuItem.price_m;

    const subtotal = price * item.quantity;
    total += subtotal;

    details.push(
      `- ${menuItem.name} (${size}) x${item.quantity} = ${subtotal.toLocaleString()}đ`
    );

    // 👉 topping
    if (item.toppings && item.toppings.length > 0) {
      for (let topping of item.toppings) {
        const top = menu.find(
          (m) =>
            m.category === "Topping" &&
            normalize(m.name).includes(normalize(topping))
        );

        if (top) {
          const topPrice = top.price_m * item.quantity;
          total += topPrice;

          details.push(
            `  + ${top.name} x${item.quantity} = ${topPrice.toLocaleString()}đ`
          );
        }
      }
    }
  }

  return { total, details };
}

module.exports = { calculateTotal };
// 👉 trích xuất JSON từ text trả về của OpenAI
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
// 👉 trích xuất JSON từ text trả về của OpenAI
function similarity(a, b) {
  a = normalize(a);
  b = normalize(b);

  if (a === b) return 1;

  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / Math.max(a.length, b.length);
}