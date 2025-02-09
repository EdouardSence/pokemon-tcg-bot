const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const postgres = require("postgres");
const cards = require("./assets/cards.json");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à Supabase
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { ssl: "require" }); // SSL requis pour Supabase

// Middleware
app.use(express.json());
app.use(cors());

async function getIdUserByDiscordId(id) {
  const users = await sql`SELECT id FROM "user" WHERE id_discord = ${id}`;
  return users[0].id;
}

async function getUser(id) {
  const users = await sql`SELECT * FROM "user" WHERE id_discord = ${id}`;
  return users[0];
}

// function who check if the card exists
async function getCard(id) {
  // parcours cards et check si id existe
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].id === id) {
      return cards[i];
    }
  }
  return false;
}

// 🔹 Récupérer toutes les carte
app.get("/cards", async (req, res) => {
  res.json(cards);
});

// 🔹 Récupérer une cart
app.get("/cards/:id", async (req, res) => {
  const { id } = req.params;
  const { id_discord } = req.query;

  if (!id_discord) {
    res.status(400).json({ error: "l'id_discord est requis" });
    return;
  }
  if (!id) {
    res.status(400).json({ error: "l'id est requis" });
    return;
  }
  let user = await getUser(id_discord);
  if (!user) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }
  try {
    const card = await getCard(id);
    if (!card) {
      res.status(404).json({ error: "Carte non trouvée" });
      return;
    }
    var json = {
      id: card.id,
      setId: card.setId,
      dupe_reward: card.dupe_reward,
      pack_point: card.pack_point,
      rarity: card.rarity,
      trade_cost: card.trade_cost,
      isTradable: card.isTradable,
      set_name: card[user.language].set_name,
      image: card[user.language].image,
      name: card[user.language].name,
      number: card.number,
    };
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// autocompletion pour trouver les cartes
app.get("/autocomplete/cards", async (req, res) => {
  let { id,id_discord, name, isTradable } = req.query;
  try {
    if (!id_discord) {
      res.status(400).json({ error: "l'id_discord est requis" });
      return;
    }
    let user = await getUser(id_discord);
    if (!user) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
    if (!name) {
      name = "";
    }
    if (!id) id = "";
    if (!isTradable) isTradable = false;

    let cardsFiltered = [];
    for (let i = 0; i < cards.length; i++) {
      if (cards[i][user.language].name.includes(name) && cards[i].id.includes(id)) {
        if (isTradable == true) {
          if (cards[i].isTradable) {
            cardsFiltered.push(cards[i]);
          }
        } else {
          cardsFiltered.push(cards[i]);
        }
        if (cardsFiltered.length === 10) {
          break;
        }
      }
    }
    let cardsReturn = [];
    for (let i = 0; i < cardsFiltered.length; i++) {
      cardsReturn.push({
        id: cardsFiltered[i].id,
        name: cardsFiltered[i][user.language].name,
      });
    }
    res.json(cardsReturn);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Récupérer tous les utilisateurs
app.get("/users", async (req, res) => {
  try {
    const users = await sql`SELECT * FROM "user"`;
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Ajouter un utilisateur besoin en parametre de id et de la language
app.post("/users", async (req, res) => {
  const { id, language } = req.body;

  if (!id) {
    res.status(400).json({ error: "l'id est requis" });
    return;
  }
  if (!language) {
    res.status(400).json({ error: "la language est requise" });
    return;
  }

  if (await getIdUserByDiscordId(id)) {
    res.status(400).json({ error: "Utilisateur déjà existant" });
    return;
  }

  language = language.toLowerCase();
  if (language !== "fr" && language !== "en") {
    res.status(400).json({ error: "la language doit être fr ou en" });
    return;
  }

  try {
    const user = await sql`
            INSERT INTO "user" (id_discord, language)
            VALUES (${id}, ${language})
            RETURNING *`;
    res.status(201).json(user[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Récupérer un utilisateur
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "l'id est requis" });
    return;
  }

  try {
    // Exécution de la requête SQL
    const users = await sql`
            SELECT 
                u.id_discord, 
                u.language,
                json_agg(DISTINCT gc.card_id) AS cards_to_offer,
                json_agg(DISTINCT rc.card_id) AS cards_wanted
            FROM 
                "user" u
            LEFT JOIN 
                cards_to_offer gc ON u.id = gc.id_user
            LEFT JOIN 
                cards_wanted rc ON u.id = rc.id_user
            WHERE 
                u.id_discord = ${id} 
            GROUP BY 
                u.id_discord, u.language;
        `;

    // Vérification si l'utilisateur existe
    if (users.length === 0) {
      res.status(404).json({ error: "Utilisateur non trouvé" });
      return;
    }

    // Renvoi des résultats sous le format JSON attendu
    var user = {
      id_discord: users[0].id_discord,
      language: users[0].language,
      cards_to_offer:
        users[0].cards_to_offer[0] === null ? [] : users[0].cards_to_offer,
      cards_wanted:
        users[0].cards_wanted[0] === null ? [] : users[0].cards_wanted,
    };
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Ajouter une cards_to_offer à un utilisateur. il faut en parametres l'id de la carte et l'id discord
// on peut avoir une quantite, si celle-ci n'est pas renseignée, elle est à 1
app.post("/users/:id/card_wanted/:card_id", async (req, res) => {
  const { id, card_id } = req.params;
  let { amount } = req.body;

  if (!amount || amount === 0) amount = 1;
  if (!id) {
    res.status(400).json({ error: "l'id est requis" });
    return;
  }
  if (!card_id) {
    res.status(400).json({ error: "l'id de la carte est requis" });
    return;
  }
  if (!(await getIdUserByDiscordId(id))) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }
  if (!(await getCard(card_id))) {
    res.status(404).json({ error: "Carte non trouvée" });
    return;
  }

  let id_bd = await getIdUserByDiscordId(id);
  
  try {
    const user = await sql`
            INSERT INTO card_wanted (id_user, card_id, amount)
            VALUES (${id_bd}, ${card_id}, ${amount})
            RETURNING *`;
    res.status(201).json(user[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Ajouter une cards_wanted à un utilisateur. il faut en parametres l'id de la carte et l'id discord
// on peut avoir une quantite, si celle-ci n'est pas renseignée, elle est à 1
app.post("/users/:id/card_to_offer/:card_id", async (req, res) => {
  const { id, card_id } = req.params;
  let { amount } = req.body;
  
  // if amount is null, not defined, or 0, set it to 1
  if (!amount || amount === 0) amount = 1;

  if (!id) {
    res.status(400).json({ error: "l'id est requis" });
    return;
  }
  if (!card_id) {
    res.status(400).json({ error: "l'id de la carte est requis" });
    return;
  }
  if (!(await getIdUserByDiscordId(id))) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }
  if (!(await getCard(card_id))) {
    res.status(404).json({ error: "Carte non trouvée" });
    return;
  }
  let id_bd = await getIdUserByDiscordId(id);
  try {
    const user = await sql`
            INSERT INTO card_to_offer (id_user, card_id, amount)
            VALUES (${id_bd}, ${card_id}, ${amount})
            RETURNING *`;
    res.status(201).json(user[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
