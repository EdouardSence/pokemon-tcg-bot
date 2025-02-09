const express = require("express");
const router = express.Router();
const { getCard, getAllCards } = require("../services/cardsService");
const { getUserByDiscordId } = require("../services/usersService");
const errorHandler = require("../utils/errorHandler");

// Récupérer toutes les cartes
router.get("/", async (req, res) => {
  try {
    res.json(await getAllCards());
  } catch (error) {
    errorHandler(res, error);
  }
});

// Autocompletion pour trouver les cartes
router.get("/autocomplete", async (req, res) => {
  try {
    let { search, id_discord, isTradable } = req.query;
    if (!id_discord) return res.status(400).json({ error: "id_discord requis" });

    const user = await getUserByDiscordId(id_discord);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    search = search || "";
    isTradable = isTradable === "true"; // Convertir string en boolean

    const cards = await getAllCards();
    const filteredCards = cards.filter(card => {
      // Vérifier si la recherche correspond à une partie du nom ou de l'id
      const matchesSearch = card[user.language].fullName.toLowerCase().includes(search.toLowerCase())
    
      // Vérifier si la carte est tradable si nécessaire
      const matchesTradable = !isTradable || card.isTradable;
    
      // Retourne la carte si elle correspond à la recherche et, le cas échéant, si elle est tradable
      return matchesSearch && matchesTradable;
    }).slice(0, 10); // Limite à 10 résultats

    res.json(filteredCards.map(card => ({
      id: card.id,
      name: card[user.language].name,
      fullName: card[user.language].fullName,
    })));
  } catch (error) {
    errorHandler(res, error);
  }
});

// Récupérer une carte spécifique
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_discord } = req.query;

    if (!id_discord) return res.status(400).json({ error: "id_discord requis" });

    const user = await getUserByDiscordId(id_discord);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const card = await getCard(id);
    if (!card) return res.status(404).json({ error: "Carte non trouvée" });

    res.json({
      id: card.id,
      name: card[user.language].name,
      image: card[user.language].image,
    });
  } catch (error) {
    errorHandler(res, error);
  }
});



module.exports = router;
