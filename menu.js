const fs = require("fs");
const csv = require("csv-parser");

function loadMenu() {
  return new Promise((resolve) => {
    const results = [];

    fs.createReadStream("menu.csv")
      .pipe(csv())
      .on("data", (data) => {
        results.push({
          category: data.category,
          name: data.name,
          description: data.description,
          price_m: parseInt(data.price_m),
          price_l: parseInt(data.price_l),
          available: data.available?.trim().toUpperCase() === "TRUE",
        });
      })
      .on("end", () => resolve(results));
  });
}

module.exports = { loadMenu };