const express = require("express");
const router = express.Router();
const { getUserByDiscordId, getUserByIdBd,getUserByIdFriend, createUser,deleteUser, getAllUsers } = require("../services/usersService");
const { getCard, getAllCards } = require("../services/cardsService");
const errorHandler = require("../utils/errorHandler");
const sql = require("../services/db");

// Récupérer tous les utilisateurs
router.get("/", async (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    errorHandler(res, error);
  }
});

// Ajouter un utilisateur
router.post("/", async (req, res) => {
  let { id_discord, language, name, id_friend } = req.body;
  try {
    if (!id_discord) return res.status(400).json({ error: "id_discord est requis" });
    if (!id_friend) return res.status(400).json({ error: "id_friend est requis" });
    if (!language) return res.status(400).json({ error: "language est requis" });
    if (!["fr", "en"].includes(language)) return res.status(400).json({ error: "language doit être 'fr' ou 'en'" });

    const existingUser = await getUserByDiscordId(id_discord);
    if (existingUser) return res.status(409).json({ error: "Cet utilisateur existe déjà" });

    name = name || null;

    // Verifier que l'id Friend fasse 16 caracteres apres avoir enlever tous les - présent a l'intérieur
    id_friend = id_friend.replace(/-/g, "");
    if (id_friend.length !== 16) return res.status(400).json({ error: "L'id_friend doit faire 16 caractères" });

    const user = await createUser(id_discord, language, name, id_friend);
    res.status(201).json(user[0]);
  } catch (error) {
    if (error.code === "23505") {
      let voleurDeCodeAmi = await getUserByIdFriend(id_friend);
      if (voleurDeCodeAmi) {
        return res.status(409).json({ error: `Impossible de créer le compte car ce code amis est déjà utilisé par <@${voleurDeCodeAmi.id_discord}> 🫵` });
      } else {
        return res.status(409).json({ error: "Ce code amis est déjà utilisé par un utilisateur inconnu" });
      }
        }
    errorHandler(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id_discord = req.params.id;
    console.log(id_discord);
    if (!id_discord) return res.status(400).json({ error: "id_discord est requis" });
    const user = await getUserByDiscordId(id_discord);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    await deleteUser(id_discord);
    res.status(204).send();
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({ error: "Impossible de supprimer cet utilisateur car il est référencé dans d'autres tables" });
    }
    errorHandler(res, error);
  }
});

router.get("/autocomplete", async (req, res) => {
  try {
    let { name } = req.query;

    let users = await getAllUsers();

    const filteredUsers = users.filter(user => {
      // Vérifier si la recherche correspond à une partie du nom ou de l'id
      const matchesSearch = user.name.toLowerCase().includes(name.toLowerCase())
      // Retourne la carte si elle correspond à la recherche et, le cas échéant, si elle est tradable
      return matchesSearch;
    }).slice(0, 10); // Limite à 10 résultats
    res.json(filteredUsers);
  } catch (error) {
    errorHandler(res, error);
  }
});

// Récupérer un utilisateur
router.get("/:id", async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ error: "l'id est requis" });
    let user;
    if (req.params.id.length <= 4) {
      user = await getUserByIdBd(req.params.id);
    } else {
      user = await getUserByDiscordId(req.params.id);
    }
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

    let user;
    if (id.length <= 4) {
      user = await getUserByIdBd(id);
    }
    else {
      user = await getUserByDiscordId(id);
    }
    const card = await getCard(card_id);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    if (!card) return res.status(404).json({ error: "Carte non trouvée" })

    if (!card.isTradable) return res.status(400).json({ error: "Carte non échangeable" });
    if (user.cards_wanted.some(c => c.card_id === card_id)) {
      return res.status(400).json({ error: "Tu ne peux pas donner une carte que tu veux" });
    }

    const addedCard = await sql`
      INSERT INTO cards_wanted (id_user, card_id, amount)
      VALUES (${user.id}, ${card_id}, ${amount})
      ON CONFLICT (id_user, card_id)
      DO UPDATE SET amount = COALESCE(cards_wanted.amount, 0) + COALESCE(EXCLUDED.amount, 1)
      RETURNING *`;

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

    let user;
    if (id.length <= 4) {
      user = await getUserByIdBd(id);
    }
    else {
      user = await getUserByDiscordId(id);
    }
    const card = await getCard(card_id);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    if (!card) return res.status(404).json({ error: "Carte non trouvée" })

    if (!card.isTradable) return res.status(400).json({ error: "Carte non échangeable" });
    if (user.cards_wanted.some(c => c.card_id === card_id)) {
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
