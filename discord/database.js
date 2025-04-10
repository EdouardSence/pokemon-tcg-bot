const { Client: PgClient } = require("pg");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");
const dotenv = require("dotenv");
const { getUserFromDb } = require("./interactions");
const API_URL = process.env.API_URL;

dotenv.config();

const pgClient = new PgClient({
  connectionString: process.env.DATABASE_URL,
});

pgClient.connect();

// Fonction pour envoyer les messages privés avec boutons d'acceptation
async function sendPrivateMessageForTrade(
  client,
  user1,
  user2,
  cardUser1Envoi,
  cardUser2Envoi,
) {
  try {
    const user1Discord = await client.users.fetch(user1.id_discord);
    const user2Discord = await client.users.fetch(user2.id_discord);
    const idFriend = user2.id_friend;

    // Création des embeds
    const embedToSend = new EmbedBuilder()
      .setTitle("📤 Tu dois envoyer cette carte")
      .setDescription(
        `Tu dois envoyer la carte ${cardUser1Envoi.fullName} à **${user2Discord.username}**.`
      )
      .setColor("#FF5555")
      .setThumbnail(user1Discord.displayAvatarURL({ dynamic: true }))
      .setImage(cardUser1Envoi.image)
      .setFooter({ text: "Assure-toi de bien envoyer cette carte !" });

    const embedToReceive = new EmbedBuilder()
      .setTitle("📥 Tu vas recevoir cette carte")
      .setDescription(
        `En échange, tu vas recevoir la carte ${cardUser2Envoi.fullName} de **${user2Discord.username}**.`
      )
      .setColor("#55FF55")
      .setThumbnail(user2Discord.displayAvatarURL({ dynamic: true }))
      .setImage(cardUser2Envoi.image)
      .setFooter({ text: "L'échange est en attente de confirmation." });

    // Message informant du code ami
    const friendCodeInfoMessage = `Le code ami de **${user2Discord.username}** est :`;
    
    // Code ami envoyé seul pour faciliter la copie
    const friendCodeMessage = `${idFriend}`;

    // Envoi des messages
    await user1Discord.send({ embeds: [embedToSend] });
    await user1Discord.send({ embeds: [embedToReceive] });
    await user1Discord.send({ content: friendCodeInfoMessage });
    await user1Discord.send({ content: friendCodeMessage });
  } catch (error) {
    console.error("Erreur lors de l'envoi du message d'échange :", error);
  }
}

// Fonction pour envoyer une demande de validation d'échange
async function sendTradeValidationRequest(client, user1, user2, matchingId) {
  try {
    const user1Discord = await client.users.fetch(user1.id_discord);
    const user2Discord = await client.users.fetch(user2.id_discord);

    // Création du message de validation
    const validationEmbed = new EmbedBuilder()
      .setTitle("✅ Échange trouvé !")
      .setDescription("Merci de confirmer la réception de la carte.")
      .setColor("#FFAA00");

    const rowValidation = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`validate_trade_${matchingId}`)
        .setLabel("J'ai bien reçu la carte")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`report_trade_${matchingId}`)
        .setLabel("Je n'ai pas reçu la carte")
        .setStyle(ButtonStyle.Danger)
    );

    // Envoi des messages de validation aux deux utilisateurs
    const user1Message = await user1Discord.send({
      embeds: [validationEmbed],
      components: [rowValidation],
    });
    
    const user2Message = await user2Discord.send({
      embeds: [validationEmbed],
      components: [rowValidation],
    });
    
    // Stocker les IDs des messages pour pouvoir les retrouver plus tard
    try {
      await axios.put(`${API_URL}matchings/${matchingId}/messages`, {
        user1_message_id: user1Message.id,
        user2_message_id: user2Message.id,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des IDs de message :", error);
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande de validation :", error);
  }
}

// Fonction pour mettre à jour les embeds pour les deux utilisateurs
async function updateEmbedsForBothUsers(client, matchingId, embedData) {
  try {
    // Récupérer les informations du matching
    const matchingResult = await axios.get(`${API_URL}matchings/${matchingId}`);
    
    if (!matchingResult.data || matchingResult.data.length === 0) {
      console.error("Matching non trouvé pour mettre à jour les embeds:", matchingId);
      return;
    }
    
    const matchingData = matchingResult.data[0];
    const { id_user1, id_user2, user1_message_id, user2_message_id } = matchingData;
    
    // Récupérer les utilisateurs Discord
    const user1 = await getUserFromDb(id_user1);
    const user2 = await getUserFromDb(id_user2);
    
    if (!user1 || !user2) {
      console.error("Utilisateurs non trouvés pour mettre à jour les embeds");
      return;
    }
    
    const user1Discord = await client.users.fetch(user1.id_discord);
    const user2Discord = await client.users.fetch(user2.id_discord);
    
    // Créer une rangée de boutons désactivés
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`validate_trade_${matchingId}_disabled`)
        .setLabel("J'ai bien reçu la carte")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`report_trade_${matchingId}_disabled`)
        .setLabel("Je n'ai pas reçu la carte")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );
    
    // Créer l'embed avec les données fournies
    const updatedEmbed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setDescription(embedData.description)
      .setColor(embedData.color)
      .setTimestamp();
    
    // Essayer de récupérer et mettre à jour les messages originaux
    console.error("LE TRADE A REUSSI !");
    try {
      if (user1_message_id) {
        const dmChannel = await user1Discord.createDM();
        const messages = await dmChannel.messages.fetch();
        const message = messages.get(user1_message_id);
        if (message) {
          console.error("Message trouvé pour user1, mise à jour en cours...");
          await message.edit({
            embeds: [updatedEmbed],
            components: [disabledRow]
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du message pour l'user1:", error);
    }
    
    try {
      if (user2_message_id) {
        const dmChannel = await user2Discord.createDM();
        const messages = await dmChannel.messages.fetch();
        const message = messages.get(user2_message_id);
        if (message) {
          await message.edit({
            embeds: [updatedEmbed],
            components: [disabledRow]
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du message pour l'user2:", error);
    }
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour des embeds pour les deux utilisateurs:", error);
  }
}

// Fonction pour mettre à jour la validation dans la base de données
async function updateTradeValidation(matchingId, userId, validated, client) {
  try {
    // Vérifier si l'utilisateur est user1 ou user2
    let matchingResult = await axios.get(`${API_URL}matchings/${matchingId}`);

    if (!matchingResult.data || matchingResult.data.length === 0) {
      console.error("Matching non trouvé:", matchingId);
      return { success: false, status: "matching_not_found" };
    }

    matchingResult = matchingResult.data[0];
    let isUser1 = false;

    if (userId === matchingResult.id_user1) {
      isUser1 = true;
    }
    const endpoint = `${API_URL}matchings/${matchingId}/${
      isUser1 ? "user1" : "user2"
    }`;

    // Si l'utilisateur signale un problème (validated = false), annuler l'échange immédiatement
    if (!validated) {
      try {
        await axios.put(endpoint, { validated });
        // Marquer le trade comme annulé
        await axios.put(`${API_URL}matchings/${matchingId}/cancel`, {
          error_raison: "echange refuse",
        });
        
        // Récupérer les informations des utilisateurs pour les notifications
        const user1 = await getUserFromDb(matchingResult.id_user1);
        const user2 = await getUserFromDb(matchingResult.id_user2);
        
        const user1Discord = await client.users.fetch(user1.id_discord);
        const user2Discord = await client.users.fetch(user2.id_discord);
        
        // Informer l'autre utilisateur
        const cancellerDiscord = isUser1 ? user1Discord : user2Discord;
        
        // Mettre à jour les embeds pour indiquer que l'échange est refusé
        const refusedEmbedData = {
          title: "❌ Échange refusé",
          description: `**${cancellerDiscord.username}** a refusé l'échange.`,
          color: "#FF0000"
        };
        
        await updateEmbedsForBothUsers(client, matchingId, refusedEmbedData);
        
        return { success: true, status: "trade_canceled" };
      } catch (error) {
        console.error("Erreur lors de l'annulation du trade:", error);
        return { success: false, status: "cancel_error" };
      }
    }
    
    let updatedMatchingResult = await axios.put(endpoint, { validated });
    
    // Vérifier si les deux utilisateurs ont validé
    const bothValidated =
      updatedMatchingResult.data.user1_validate_trade &&
      updatedMatchingResult.data.user2_validate_trade;

    // Si seulement un utilisateur a validé
    if (!bothValidated) {
      return { success: true, status: "waiting_other_user" };
    }

    // Si les deux ont validé, finaliser l'échange
    if (bothValidated) {
      const cardUser1Envoi = updatedMatchingResult.data.id_card_user2_receive;
      const cardUser2Envoi = updatedMatchingResult.data.id_card_user1_receive;

      try {
        await axios.put(`${API_URL}matchings/${matchingId}/success`);

        await axios.delete(
          `${API_URL}users/${matchingResult.id_user1}/card_to_offer/${cardUser1Envoi}`
        );
        await axios.delete(
          `${API_URL}users/${matchingResult.id_user2}/card_to_offer/${cardUser2Envoi}`
        );
        await axios.delete(
          `${API_URL}users/${matchingResult.id_user1}/card_wanted/${cardUser2Envoi}`
        );
        await axios.delete(
          `${API_URL}users/${matchingResult.id_user2}/card_wanted/${cardUser1Envoi}`
        );
        
        // Mettre à jour les embeds pour indiquer que l'échange est terminé
        const successEmbedData = {
          title: "🎉 Échange réussi",
          description: "Les deux joueurs ont confirmé avoir reçu leur carte. L'échange est terminé avec succès!",
          color: "#00FF00"
        };
        
        await updateEmbedsForBothUsers(client, matchingId, successEmbedData);
        
        return { success: true, status: "trade_completed" };
      } catch (error) {
        console.error("Erreur lors de la finalisation de l'échange:", error);
        return { success: false, status: "completion_error" };
      }
    }

    return { success: true, status: "updated" };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la validation:", error);
    return { success: false, status: "update_error" };
  }
}

// Fonction pour gérer les interactions des boutons
async function handleTradeButtonInteraction(interaction, client) {
  try {
    const customId = interaction.customId;

    // Si le bouton est déjà désactivé
    if (customId.endsWith("_disabled")) {
      await interaction.reply({
        content: "Cet échange n'est plus disponible.",
        ephemeral: true
      });
      return;
    }

    // Extraire l'ID du matching du customId
    const matchingId = customId.split("_").pop();

    // Vérifier si le matching existe toujours
    const matchingResult = await axios.get(`${API_URL}matchings/${matchingId}`);
    if (!matchingResult.data || matchingResult.data.length === 0 || matchingResult.data[0].trade_canceled) {
      await interaction.reply({
        content: "Cet échange a été annulé ou n'existe plus.",
        ephemeral: true
      });
      return;
    }

    const user = await getUserFromDb(interaction.user.id);
    if (!user) {
      await interaction.reply({
        content: "Utilisateur non trouvé dans la base de données.",
        ephemeral: true
      });
      return;
    }

    // Indiquer que le traitement a commencé
    await interaction.deferUpdate();

    // Validation de réception de carte
    if (customId.startsWith("validate_trade_")) {
      // Appeler la fonction de mise à jour mais ne pas modifier le message ici
      // updateTradeValidation s'occupera de mettre à jour tous les messages via updateEmbedsForBothUsers
      const result = await updateTradeValidation(matchingId, user.id, true, client);
      
      // Si l'échange n'est pas complet (en attente de l'autre utilisateur),
      // mettre à jour uniquement ce message avec le statut d'attente
      if (result.status === "waiting_other_user") {
        const waitingEmbed = new EmbedBuilder()
          .setTitle("⏳ En attente")
          .setDescription("Tu as confirmé avoir reçu la carte. En attente de la confirmation de l'autre utilisateur.")
          .setColor("#FFAA00")
          .setTimestamp();
        
        // Désactiver les boutons
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`validate_trade_${matchingId}_disabled`)
            .setLabel("J'ai bien reçu la carte")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`report_trade_${matchingId}_disabled`)
            .setLabel("Je n'ai pas reçu la carte")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );
        
        await interaction.message.edit({
          embeds: [waitingEmbed],
          components: [disabledRow]
        });
      }
      // Pour les autres cas (trade_completed, etc.), la mise à jour sera faite par updateEmbedsForBothUsers
    }

    // Signalement de problème
    else if (customId.startsWith("report_trade_")) {
      // Appeler la fonction de mise à jour mais ne pas modifier le message ici
      // updateTradeValidation s'occupera de mettre à jour tous les messages via updateEmbedsForBothUsers
      await updateTradeValidation(matchingId, user.id, false, client);
      
      // Pas besoin de mettre à jour le message ici car updateEmbedsForBothUsers le fera
    }
  } catch (error) {
    console.error("Erreur lors du traitement de l'interaction:", error);
    
    try {
      // Si l'interaction n'a pas encore été répondue
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Une erreur est survenue lors du traitement de votre demande.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "Une erreur est survenue lors du traitement de votre demande.",
          ephemeral: true
        });
      }
    } catch (followUpError) {
      console.error("Erreur lors de la tentative de réponse à l'erreur:", followUpError);
    }
  }
}

// Fonction pour écouter les notifications de la base de données
async function listenToDatabase(client) {
  pgClient.query("LISTEN matching_created");
  pgClient.query("LISTEN matching_canceled");
  pgClient.query("LISTEN test");

  pgClient.on("notification", async (msg) => {
    try {
      if (msg.channel === "matching_created") {
        const data = JSON.parse(msg.payload);
        const user1 = await getUserFromDb(data.id_user1);
        const user2 = await getUserFromDb(data.id_user2);

        const matchingId = data.id_matching;

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
            cardUser2.data,
          );

          await sendPrivateMessageForTrade(
            client,
            user2,
            user1,
            cardUser2.data,
            cardUser1.data,
          );

          await sendTradeValidationRequest(client, user1, user2, matchingId);
        }
      }

      if (msg.channel === "matching_canceled") {
        // Récupérer les informations du matching
        const data = JSON.parse(msg.payload);
        const matchingId = data.id_matching;
        const user1 = await getUserFromDb(data.id_user1);
        const user2 = await getUserFromDb(data.id_user2);
        
        if (!user1 || !user2) {
          console.error("Utilisateur(s) non trouvé(s) pour matching_canceled");
          return;
        }
        
        // Déterminer l'utilisateur fautif et l'autre utilisateur
        const userFautifId = data.userFautif;
        // const otherUser = userFautifId === user1.id_discord ? user1 : user2;
        const userFautif = userFautifId === user1.id_discord ? user2 : user1;

        // Récupérer les objets Discord
        const userFautifDiscord = await client.users.fetch(userFautif.id_discord);
        
        // Mettre à jour les embeds pour indiquer que la carte a été retirée
        const cancelEmbedData = {
          title: "❌ Échange annulé",
          description: `**${userFautifDiscord.username}** a retiré sa carte de l'échange. L'échange a été annulé.`,
          color: "#FF5555"
        };
        
        await updateEmbedsForBothUsers(client, matchingId, cancelEmbedData);
      }
    } catch (error) {
      console.error("Erreur lors de la réception du matching :", error);
    }
  });
}

// Fonction qui va vérifier si le message est un bouton lié au système d'échange
function setupInteractionHandler(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    // Vérifier si c'est un bouton lié au système d'échange
    if (
      customId.startsWith("validate_trade_") ||
      customId.startsWith("report_trade_")
    ) {
      await handleTradeButtonInteraction(interaction, client);
    }
  });
}

module.exports = {
  listenToDatabase,
  setupInteractionHandler,
};