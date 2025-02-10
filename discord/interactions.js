const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL;
const currentRepository = __dirname;


async function getUserFromDb(userId) {
  try {
    const response = await axios.get(`${process.env.API_URL}users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    throw new Error("Impossible de récupérer les utilisateurs");
  }
}

// commande pour ajouter des cartes à offrir  
async function handleAddCardsToOffer(interaction, options, userId) {
  await interaction.deferReply({ ephemeral: true });

  const cardsList = [];
  for (let i = 1; i <= 5; i++) {
    const cardId = options.getString(`search${i}`);
    if (!cardId) continue;

    const amount = options.getInteger(`amount${i}`);
    cardsList.push({ id: cardId, amount });
  }
  if (cardsList.length === 0) {
    await interaction.editReply("Tu dois sélectionner au moins une carte !");
    return;
  }

  try {
    const requests = cardsList.map(({ id, amount }) =>
      axios.post(`${API_URL}users/${userId}/card_to_offer/${id}`, { amount })
    );
    await Promise.all(requests);

    const addedCards = cardsList.map(({ id, amount }) => `- Carte ${id} (x${amount ? amount : 1})`).join("\n");
    await interaction.editReply(`Cartes ajoutées à ta collection :\n${addedCards}`);
  } catch (error) {
    console.error(error);
    await interaction.editReply(error.response?.data?.error || "Erreur lors de l'ajout des cartes.");
  }
}

// commande pour ajouter des cartes recherchées
async function handleAddCardsWanted(interaction, options, userId) {
  await interaction.deferReply({ ephemeral: true });

  const cardsList = [];
  for (let i = 1; i <= 5; i++) {
    const cardId = options.getString(`search${i}`);
    if (!cardId) continue;

    const amount = options.getInteger(`amount${i}`);
    cardsList.push({ id: cardId, amount });
  }
  if (cardsList.length === 0) {
    await interaction.editReply("Tu dois sélectionner au moins une carte !");
    return;
  }

  try {
    const requests = cardsList.map(({ id, amount }) =>
      axios.post(`${API_URL}users/${userId}/card_wanted/${id}`, { amount })
    );
    await Promise.all(requests);

    const addedCards = cardsList.map(({ id, amount }) => `- Carte ${id} (x${amount ? amount : 1})`).join("\n");
    await interaction.editReply(`Cartes ajoutées à ta collection :\n${addedCards}`);
  } catch (error) {
    console.error(error);
    await interaction.editReply(error.response?.data?.error || "Erreur lors de l'ajout des cartes.");
  }
}

// commande pour afficher une carte
async function handleShowCard(interaction, options) {
  const showCardId = options.getString("search");
  try {
    const response = await axios.get(`${API_URL}cards/${showCardId}`, { params: { id_discord: interaction.user.id } });
    const card = response.data;

    if (!card) {
      throw new Error("Carte introuvable");
    }

    const imageUrl = card.image.startsWith("http") ? card.image : path.join(currentRepository, "assets", "cards", card.image);
    await interaction.reply({ files: [imageUrl] });
  } catch (error) {
    console.error(error);
    await interaction.reply(error.response?.data?.error || "Erreur lors de la récupération de la carte.");
  }
}

// commande pour lister les utilisateurs
async function handleUsersList(interaction) {
  try {
    const response = await axios.get(`${API_URL}users`);
    const users = response.data;
    await interaction.reply(`Liste des utilisateurs : ${users.map(user => user.name).join(", ")}`);
  } catch (error) {
    console.error(error);
    await interaction.reply(error.response?.data?.error || "Erreur lors de la récupération des utilisateurs.");
  }
}

// se declenche si l'utilisateur n'est pas enregistré
async function handleUserNotRegistered(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("lang_fr").setLabel("Français").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("lang_en").setLabel("English").setStyle(ButtonStyle.Primary)
  );

  try {
    await interaction.reply("Vous n'êtes pas enregistré dans la base de données. Veuillez choisir votre langue.");
    const dmChannel = await interaction.user.createDM();
    await dmChannel.send({ content: "Choisissez votre langue :", components: [row] });
  } catch (error) {
    console.error("Impossible d'envoyer un MP :", error);
    await interaction.reply({ content: "Je ne peux pas t'envoyer de message privé. Vérifie tes paramètres de confidentialité.", ephemeral: true });
  }
}

// permet de faire une autocomplétion sur la recherche de carte
async function handleAutocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  const { name, value } = focusedOption;

  let isTradable = false;
  const commandName = interaction.commandName;

  if (commandName === "add_cards_to_offer" || commandName === "add_cards_wanted") {
    isTradable = true;
  } else if (commandName === "showcard") {
    isTradable = false;
  }

  if (name.startsWith("search")) {
    try {
      const response = await axios.get(`${API_URL}cards/autocomplete`, {
        params: { search: value, id_discord: interaction.user.id, isTradable }
      });

      await interaction.respond(
        response.data.map(card => ({
          name: card.fullName,
          value: card.id,
        }))
      );
    } catch (error) {
      console.error("Erreur lors de l'autocomplétion :", error);
    }
  }
}

// permet d'envoyer la notifcation de trade en message privé
async function sendPrivateMessageForTrade(client,idUser1, idUser2, cardUser1, cardUser2) {
  try {
    const user1 = await client.users.fetch(idUser1);
    const user2 = await client.users.fetch(idUser2);

    const imageUrl1 = cardUser1.image.startsWith("http") ? cardUser1.image : `${API_URL}assets/${cardUser1.image}`;
    const imageUrl2 = cardUser2.image.startsWith("http") ? cardUser2.image : `${API_URL}assets/${cardUser2.image}`;

    const embedToSend = new EmbedBuilder()
      .setTitle("📤 Tu dois envoyer cette carte")
      .setDescription(`Tu dois envoyer la carte ${cardUser1.fullName} à **${user2.username}**.`)
      .setColor("#FF5555")
      .setThumbnail(user1.displayAvatarURL({ dynamic: true }))
      .setImage(imageUrl1)
      .setFooter({ text: "Assure-toi de bien envoyer cette carte !" });

    const embedToReceive = new EmbedBuilder()
      .setTitle("📥 Tu vas recevoir cette carte")
      .setDescription(`En échange, tu vas recevoir la carte ${cardUser2.fullName} de **${user2.username}**.`)
      .setColor("#55FF55")
      .setThumbnail(user2.displayAvatarURL({ dynamic: true }))
      .setImage(imageUrl2)
      .setFooter({ text: "L'échange est en attente de confirmation." });

    await user1.send({ embeds: [embedToSend] });
    await user1.send({ embeds: [embedToReceive] });

  } catch (error) {
    console.error("Erreur lors de l'envoi du message d'échange :", error);
  }
}

// fonction principale pour gérer les interactions
async function handleInteraction(client, interaction) {
  if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

  const userId = interaction.user.id;

  try {
    const user = await getUserFromDb(userId);
    if (!user) {
      return handleUserNotRegistered(interaction);
    }

    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction);
      return;
    }

    const { commandName, options } = interaction;

    switch (commandName) {
      case "add_cards_to_offer":
        await handleAddCardsToOffer(interaction, options, userId);
        break;

      case "add_cards_wanted":
        await handleAddCardsWanted(interaction, options, userId);
        break;

      case "show_cards_to_offer":
        await interaction.reply("Not implemented yet");
        break;

      case "init":
      case "reset":
        await interaction.reply(`${commandName.charAt(0).toUpperCase() + commandName.slice(1)} de ta collection en cours...`);
        break;

      case "listcards":
        await interaction.reply("Affichage de ta collection en cours...");
        break;

      case "removecard":
        const removeCardId = options.getString("id");
        await interaction.reply(`Carte ${removeCardId} retirée de ta collection !`);
        break;

      case "showcard":
        await handleShowCard(interaction, options);
        break;

      case "users":
        await handleUsersList(interaction);
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(error);
    await interaction.reply("Une erreur est survenue, réessaye plus tard.");
  }
}

module.exports = {
  handleInteraction,
  sendPrivateMessageForTrade,
  getUserFromDb,
};
