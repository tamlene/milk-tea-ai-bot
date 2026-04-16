const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 👉 lấy JSON từ text
function extractJSON(text) {
  const match = text.match(/```json([\s\S]*?)```/);
  if (match) return match[1].trim();

  const objMatch = text.match(/{[\s\S]*}/);
  if (objMatch) return objMatch[0].trim();

  return text.trim();
}

// 👉 parse an toàn
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.log("❌ JSON parse error:", text);
    throw err;
  }
}

// 👉 tìm món gần đúng (fallback nhẹ)
function findClosestItem(name, menu) {
  const lower = name.toLowerCase();

  return menu.find((m) =>
    lower.includes(m.name.toLowerCase()) ||
    m.name.toLowerCase().includes(lower)
  );
}

// 👉 normalize + validate
function normalizeOrder(order, menu) {
  if (!order || !order.items) return { items: [] };

  let cleaned = [];

  for (let item of order.items) {
    let match = menu.find(
      (m) => m.name.toLowerCase() === item.name?.toLowerCase()
    );

    // 👉 nếu không match → tìm gần đúng
    if (!match) {
      match = findClosestItem(item.name || "", menu);
    }

    if (!match || match.category === "Topping") continue;

    // 👉 lọc topping hợp lệ
    let validToppings = [];
    if (item.toppings && item.toppings.length > 0) {
      for (let t of item.toppings) {
        const top = menu.find(
          (m) =>
            m.category === "Topping" &&
            m.name.toLowerCase().includes(t.toLowerCase())
        );
        if (top) validToppings.push(top.name);
      }
    }

    cleaned.push({
      name: match.name,
      quantity: item.quantity || 1,
      size: item.size === "L" ? "L" : "M",
      toppings: validToppings,
    });
  }

  return { items: cleaned };
}

// 👉 merge item trùng
function mergeItems(items) {
  const map = {};

  for (let item of items) {
    const key = item.name + "_" + item.size;

    if (!map[key]) {
      map[key] = { ...item };
    } else {
      map[key].quantity += item.quantity;

      // merge topping
      map[key].toppings = [
        ...new Set([...map[key].toppings, ...item.toppings]),
      ];
    }
  }

  return Object.values(map);
}

async function extractOrder(text, menu) {
  const prompt = `
Bạn là bot bán trà sữa.

Menu:
${menu.map((m) => `- ${m.name}`).join("\n")}

QUY TẮC:
- GIỮ NGUYÊN số lượng người dùng nói (ví dụ "2" thì phải là 2)
- GIỮ NGUYÊN size (L hoặc M)
- Không có size → mặc định M
- Không có số lượng → mặc định 1
- Không được tự giảm số lượng
- Không được tự đổi size
- Không được tự bỏ item
- Viết tắt phải hiểu:
  + ts = trà sữa
  + cf = cà phê
- Sai chính tả → chọn món gần nhất trong menu
- Không chắc → bỏ qua item đó

- Chỉ chọn món có trong menu
- Không tự tạo món mới
- Không chắc → bỏ qua
- Không có size → M
- Không có số lượng → 1
- Sai chính tả → chọn món gần nhất
- Topping phải đúng menu

Chỉ trả JSON.

Format:
{
  "items": [
    {
      "name": "...",
      "quantity": 1,
      "size": "M",
      "toppings": []
    }
  ]
}

Câu khách:
"${text}"
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Chỉ trả JSON hợp lệ. Không thêm text.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2, // 👉 giảm random
  });

  const raw = res.choices[0].message.content;
  console.log("🤖 AI RAW:", raw);

  try {
    const clean = extractJSON(raw);
    let parsed = safeParseJSON(clean);

    parsed = normalizeOrder(parsed, menu);
    parsed.items = mergeItems(parsed.items);
    parsed.items = enforceFromText(text, parsed.items); // 🔥 FIX CỨNG

    if (!parsed.items.length) throw new Error("Empty");

    return parsed;
  } catch (err) {
    console.log("⚠️ Parse fail → fallback local NLP");
    throw err;
  }
}

module.exports = { extractOrder };

function enforceFromText(text, items) {
  const lines = text.split("\n");

  return items.map((item) => {
    let quantity = item.quantity;
    let size = item.size;

    for (let line of lines) {
      const lower = line.toLowerCase();

      if (lower.includes(item.name.toLowerCase())) {
        // 👉 quantity
        const qtyMatch = line.match(/(\d+)/);
        if (qtyMatch) quantity = parseInt(qtyMatch[1]);

        // 👉 size
        if (/(size\s*l|\bl\b)/i.test(line)) size = "L";
      }
    }

    return {
      ...item,
      quantity,
      size,
    };
  });
}