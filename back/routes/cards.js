const express = require("express");
const router = express.Router();
const { getCard, getAllCards } = require("../services/cardsService");
const {
  getUserByDiscordId,
  getUserByIdBd,
} = require("../services/usersService");
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
const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

router.get("/autocomplete", async (req, res) => {
  try {
    let { search, id_discord, isTradable } = req.query;
    let user;
    if (!id_discord)
      return res.status(400).json({ error: "id_discord requis" });
    if (id_discord.length > 4) {
      user = await getUserByDiscordId(id_discord);
    } else {
      user = await getUserByIdBd(id_discord);
    }

    if (!user) {
      user = { language: "fr" };
    }

    search = search || "";
    isTradable = isTradable === "true"; // Convertir string en boolean

    const normalizedSearch = removeAccents(search.toLowerCase());

    const cards = await getAllCards();
    const filteredCards = cards
      .filter((card) => {
        // Vérifier si la recherche correspond à une partie du nom ou de l'id
        const matchesSearch = removeAccents(
          card[user.language].fullName.toLowerCase()
        ).includes(normalizedSearch);

        // Vérifier si la carte est tradable si nécessaire
        const matchesTradable = !isTradable || card.isTradable;

        // Retourne la carte si elle correspond à la recherche et, le cas échéant, si elle est tradable
        return matchesSearch && matchesTradable;
      })
      .slice(0, 10); // Limite à 10 résultats

    res.json(
      filteredCards.map((card) => ({
        id: card.id,
        name: card[user.language].name,
        fullName: card[user.language].fullName,
        rarity: card.rarity,
        setName: card[user.language].set_name,
      }))
    );
  } catch (error) {
    errorHandler(res, error);
  }
});

// Récupérer une carte spécifique
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_discord } = req.query;
    let user;

    if (!id_discord)
      return res.status(400).json({ error: "id_discord requis" });
    if (id_discord.length > 4) {
      user = await getUserByDiscordId(id_discord);
    } else {
      user = await getUserByIdBd(id_discord);
    }

    if (!user){
      user = { language: "fr" };
    }

    const card = await getCard(id);
    if (!card) return res.status(404).json({ error: "Carte non trouvée" });
    res.json({
      id: card.id,
      name: card[user.language].name,
      fullName: card[user.language].fullName,
      rarity: card.rarity,
      setName: card[user.language].set_name,
      image: card[user.language].image,
    });
  } catch (error) {
    errorHandler(res, error);
  }
});

module.exports = router;
