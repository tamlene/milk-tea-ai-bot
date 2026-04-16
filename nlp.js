function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractOrderLocal(text, menu) {
  const rawText = text;
  text = normalize(text);

  let items = [];

  for (let m of menu) {
    if (m.category === "Topping") continue;

    const nameNorm = normalize(m.name);

    if (
      text.includes(nameNorm) ||
      nameNorm.includes(text)
    ) {
      // 👉 số lượng (gần tên món)
      let quantity = 1;
      const regex = new RegExp(`(\\d+)\\s*${nameNorm}`);
      const qtyMatch = text.match(regex);
      if (qtyMatch) quantity = parseInt(qtyMatch[1]);

      // 👉 size
      let size = "M";
      if (/size\s*l|ly\s*l|lớn/i.test(rawText)) size = "L";

      // 👉 topping
      let toppings = [];

      for (let t of menu) {
        if (t.category === "Topping") {
          const tNorm = normalize(t.name);
          if (text.includes(tNorm)) {
            toppings.push(t.name);
          }
        }
      }

      items.push({
        name: m.name,
        quantity,
        size,
        toppings,
      });
    }
  }

  return { items };
}

module.exports = { extractOrderLocal };