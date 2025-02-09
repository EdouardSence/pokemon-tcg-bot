const express = require("express");
const router = express.Router();
const { getUserByDiscordId, createUser } = require("../services/usersService");
const { getCard, getAllCards } = require("../services/cardsService");
const errorHandler = require("../utils/errorHandler");
const sql = require("../services/db");

// Récupérer tous les utilisateurs
router.get("/", async (req, res) => {
  try {
    const users = await sql`SELECT * FROM "user"`;
    res.json(users);
  } catch (error) {
    errorHandler(res, error);
  }
});

// Ajouter un utilisateur
router.post("/", async (req, res) => {
  try {
    let { id_discord, language, name } = req.body;
    if (!id_discord || !language) return res.status(400).json({ error: "Paramètres requis" });
    name = name || null;

    const user = await createUser(id_discord, language, name);
    res.status(201).json(user[0]);
  } catch (error) {
    errorHandler(res, error);
  }
});

// Récupérer un utilisateur
router.get("/:id", async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ error: "l'id est requis" });
    const user = await getUserByDiscordId(req.params.id);
    res.json(user);
  } catch (error) {
    errorHandler(res, error);
  }
});

// 🔹 Ajouter une cards_to_offer à un utilisateur. il faut en parametres l'id de la carte et l'id discord
// on peut avoir une quantite, si celle-ci n'est pas renseignée, elle est à 1
router.post("/:id/card_wanted/:card_id", async (req, res) => {
  try {
    const { id, card_id } = req.params;
    let { amount } = req.body;
    amount = amount && amount > 0 ? amount : 1;
    const user = await getUserByDiscordId(id);
    const card = await getCard(card_id);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    if (!card) return res.status(404).json({ error: "Carte non trouvée" });
    if (!card.isTradable) return res.status(400).json({ error: "Carte non échangeable" });
    if (user.cards_to_offer.some(c => c.card_id === card_id)) {
      console.log(user);
      return res.status(400).json({ error: "Tu ne peux pas vouloir une carte que tu veux donner" });
    }

    const addedCard = await sql`
      INSERT INTO cards_wanted (id_user, card_id, amount)
      VALUES (${user.id}, ${card_id}, ${amount})
      ON CONFLICT (id_user, card_id)
      DO UPDATE SET amount = COALESCE(cards_wanted.amount, 0) + COALESCE(EXCLUDED.amount, 1)
      RETURNING *`;
    console.log(addedCard);
    res.status(201).json(addedCard[0]);
  } catch (error) {
    errorHandler(res, error);
  }
});

// 🔹 Ajouter une cards_wanted à un utilisateur. il faut en parametres l'id de la carte et l'id discord
// on peut avoir une quantite, si celle-ci n'est pas renseignée, elle est à 1
router.post("/:id/card_to_offer/:card_id", async (req, res) => {
  try {
    const { id, card_id } = req.params;
    let { amount } = req.body;
    amount = amount && amount > 0 ? amount : 1;
    const user = await getUserByDiscordId(id);
    const card = await getCard(card_id);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    if (!card) return res.status(404).json({ error: "Carte non trouvée" });
    if (!card.isTradable) return res.status(400).json({ error: "Carte non échangeable" });
    if (user.cards_wanted.some(c => c.card_id === card_id)) {
      console.log(user);
      return res.status(400).json({ error: "Tu ne peux pas donner une carte que tu veux" });
    }
    
    const addedCard = await sql`
      INSERT INTO cards_to_offer (id_user, card_id, amount)
      VALUES (${user.id}, ${card_id}, ${amount})
      ON CONFLICT (id_user, card_id)
      DO UPDATE SET amount = COALESCE(cards_to_offer.amount, 0) + COALESCE(EXCLUDED.amount, 1)
      RETURNING *`;

    res.status(201).json(addedCard[0]);
  } catch (error) {
    errorHandler(res, error);
  }
});

module.exports = router;
