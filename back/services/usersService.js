const sql = require("./db");

// Récupère un utilisateur via son ID Discord ou son id en base de données
// c pas propre de fou mais vsy on aura jamais 2^10 utilisateurs
const getUserByDiscordId = async (discord_id) => {
  const users = await sql`
        SELECT 
            u.id,
            u.id_discord, 
            u.language,
            json_agg(DISTINCT jsonb_build_object('card_id', gc.card_id, 'amount', gc.amount)) AS cards_to_offer,
            json_agg(DISTINCT jsonb_build_object('card_id', rc.card_id, 'amount', rc.amount)) AS cards_wanted
        FROM 
            "user" u
        LEFT JOIN 
            cards_to_offer gc ON u.id = gc.id_user
        LEFT JOIN 
            cards_wanted rc ON u.id = rc.id_user
        WHERE 
            u.id_discord = ${discord_id}
        GROUP BY 
            u.id, u.id_discord, u.language;
      `;

  if (users.length === 0) {
    return null;
  }
  var user = {
    id: users[0].id,
    id_discord: users[0].id_discord,
    name: users[0]?.name || null,
    language: users[0].language.toLowerCase(),
    cards_to_offer: Array.isArray(users[0].cards_to_offer)
      ? users[0].cards_to_offer
          .filter((c) => c.card_id !== null) // Filtrer les entrées invalides
          .map((c) => ({ card_id: c.card_id, amount: c.amount || 1 })) // Assurer une structure correcte
      : [],
    cards_wanted: Array.isArray(users[0].cards_wanted)
      ? users[0].cards_wanted
          .filter((c) => c.card_id !== null)
          .map((c) => ({ card_id: c.card_id, amount: c.amount || 1 }))
      : [],
  };

  return user;
};


const getUserByIdBd = async (id_bd) => {
  const users = await sql`
        SELECT 
            u.id,
            u.id_discord, 
            u.language,
            json_agg(DISTINCT jsonb_build_object('card_id', gc.card_id, 'amount', gc.amount)) AS cards_to_offer,
            json_agg(DISTINCT jsonb_build_object('card_id', rc.card_id, 'amount', rc.amount)) AS cards_wanted
        FROM 
            "user" u
        LEFT JOIN 
            cards_to_offer gc ON u.id = gc.id_user
        LEFT JOIN 
            cards_wanted rc ON u.id = rc.id_user
        WHERE 
            u.id = ${id_bd}
        GROUP BY 
            u.id, u.id_discord, u.language;
      `;

  if (users.length === 0) {
    return null;
  }
  var user = {
    id: users[0].id,
    id_discord: users[0].id_discord,
    name: users[0]?.name || null,
    language: users[0].language.toLowerCase(),
    cards_to_offer: Array.isArray(users[0].cards_to_offer)
      ? users[0].cards_to_offer
          .filter((c) => c.card_id !== null) // Filtrer les entrées invalides
          .map((c) => ({ card_id: c.card_id, amount: c.amount || 1 })) // Assurer une structure correcte
      : [],
    cards_wanted: Array.isArray(users[0].cards_wanted)
      ? users[0].cards_wanted
          .filter((c) => c.card_id !== null)
          .map((c) => ({ card_id: c.card_id, amount: c.amount || 1 }))
      : [],
  };

  return user;
};

// Vérifie si un utilisateur existe
const userExists = async (id_discord) => {
  let user;
  if (id_discord.length <= 4) {
    getUserByIdBd(id_discord);
  }
  else {
    getUserByDiscordId(id_discord);
  }
  return user !== null;
};

// Ajoute un utilisateur
const createUser = async (id_discord, language, name,id_friend) => {
  return await sql`
      INSERT INTO "user" (id_discord, language, name, id_friend)
      VALUES (${id_discord}, ${language.toLowerCase()}, ${name}, ${id_friend})
      RETURNING *`;
};

module.exports = { getUserByDiscordId,getUserByIdBd, userExists, createUser };