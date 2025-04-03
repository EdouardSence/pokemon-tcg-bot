const sql = require("./db");

// Récupère un utilisateur via son ID Discord ou son id en base de données
// c pas propre de fou mais vsy on aura jamais 2^10 utilisateurs
const getUserByDiscordId = async (discord_id) => {
  const users = await sql`
        SELECT 
            u.id,
            u.id_discord, 
            u.language,
            u.name,
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
            u.name,
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

const getUserByIdFriend = async (id_friend) => {
  const users = await sql`
        SELECT 
            u.id,
            u.id_discord, 
            u.language,
            u.name,
            json_agg(DISTINCT jsonb_build_object('card_id', gc.card_id, 'amount', gc.amount)) AS cards_to_offer,
            json_agg(DISTINCT jsonb_build_object('card_id', rc.card_id, 'amount', rc.amount)) AS cards_wanted
        FROM 
            "user" u
        LEFT JOIN 
            cards_to_offer gc ON u.id = gc.id_user
        LEFT JOIN 
            cards_wanted rc ON u.id = rc.id_user
        WHERE 
            u.id_friend = ${id_friend}
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
}

// recupere une liste de User par le name
const getUsersByName = async (name) => {
  const users = await sql`
        SELECT * FROM "user" WHERE name LIKE ${name};
      `;
  return users;
};

// recupere tous les users
const getAllUsers = async () => {
  const users = await sql`
        SELECT * FROM "user";
      `;
  return users;
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
const createUser = async (id_discord, language, name, id_friend) => {
  try {
    return await sql`
      INSERT INTO "user" (id_discord, language, name, id_friend)
      VALUES (${id_discord}, ${language.toLowerCase()}, ${name}, ${id_friend})
      RETURNING *`;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

const deleteUser = async (id_discord) => {
  try {
    return await sql`
      DELETE FROM "user" WHERE id_discord = ${id_discord}`;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

module.exports = { getUserByDiscordId,getUserByIdBd,getUserByIdFriend, userExists, createUser,deleteUser, getUsersByName, getAllUsers};