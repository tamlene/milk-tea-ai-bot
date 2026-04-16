const userMemory = {};

function saveOrder(chatId, order) {
  if (!userMemory[chatId]) {
    userMemory[chatId] = [];
  }

  userMemory[chatId].push(order);
}

function getLastOrder(chatId) {
  if (!userMemory[chatId]) return null;
  return userMemory[chatId][userMemory[chatId].length - 1];
}

module.exports = { saveOrder, getLastOrder };