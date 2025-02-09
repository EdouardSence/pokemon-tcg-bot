const cards = require("../assets/cards.json");

// Vérifie si une carte existe
const getCard = async (id) => {
  return cards.find((card) => card.id === id) || false;
};

// Récupère toutes les cartes
const getAllCards = async () => {
  return cards;
};

module.exports = { getCard, getAllCards };
