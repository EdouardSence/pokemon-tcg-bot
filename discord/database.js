const { Client: PgClient } = require("pg");
const axios = require("axios");
const dotenv = require("dotenv");
const { sendPrivateMessageForTrade, getUserFromDb } = require("./interactions");

dotenv.config();

const pgClient = new PgClient({
  connectionString: process.env.DATABASE_URL,
});

pgClient.connect();

// penser a mettre un switch case pour chaque trigger de la base de données ( pas géré encore )
async function listenToDatabase(client) {
  pgClient.query("LISTEN matching_created");

  pgClient.on("notification", async (msg) => {
    try {
      const data = JSON.parse(msg.payload);
      const user1 = await getUserFromDb(data.id_user1);
      const user2 = await getUserFromDb(data.id_user2);
      const cardUser1 = await axios.get(
        `${process.env.API_URL}cards/${data.id_card_user2_receive}`,
        { params: { id_discord: user1.id_discord } }
      );
      const cardUser2 = await axios.get(
        `${process.env.API_URL}cards/${data.id_card_user1_receive}`,
        { params: { id_discord: user2.id_discord } }
      );

      if (user1 && user2) {
        await sendPrivateMessageForTrade(
          client,
          user1,
          user2,
          cardUser1.data,
          cardUser2.data
        );
        await sendPrivateMessageForTrade(
          client,
          user2,
          user1,
          cardUser2.data,
          cardUser1.data
        );
      }
    } catch (error) {
      console.error("Erreur lors de la réception du matching :", error);
    }
  });
}

module.exports = {
  listenToDatabase,
};
