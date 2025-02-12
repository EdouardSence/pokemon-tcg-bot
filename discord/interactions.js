const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL;


async function getUserFromDb(userId) {
  try {
    const response = await axios.get(`${process.env.API_URL}users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    throw new Error("Impossible de récupérer les utilisateurs");
  }
}

    // Fonction pour convertir la rareté en symboles
  const getRaritySymbols = (rarity) => {
      if (rarity >= 1 && rarity <= 4) {
        return "♦".repeat(rarity); // Losange
      } else if (rarity >= 5 && rarity <= 7) {
        return "★".repeat(rarity - 3); // Étoile
      } else if (rarity === 8) {
        return "👑"; // Couronne
      }
      return "";
    };

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

async function handleShowCardToOffer(client, interaction, userId) {
  try {
    await interaction.deferReply({ ephemeral: false }); // On peut désactiver ephemeral pour que tout le monde voie

    const user = await client.users.fetch(userId);
    const response = await axios.get(`${API_URL}users/${userId}`);
    const cards_to_offer = response.data.cards_to_offer;

    if (!cards_to_offer || cards_to_offer.length === 0) {
      return await interaction.editReply("Tu n'as aucune carte à offrir.");
    }

    const cards = await Promise.all(
      cards_to_offer.map(async (card) => {
        const res = await axios.get(`${API_URL}cards/${card.card_id}`, { params: { id_discord: userId } });
        return res.data;
      })
    );

    let index = 0;

    // Fonction pour créer l'embed et les boutons
    const createMessagePayload = () => {
      const card = cards[index];
      const raritySymbols = getRaritySymbols(card.rarity);

      const embed = new EmbedBuilder()
        .setTitle("Cartes à offrir")
        .setDescription(`Voici la liste des cartes que ${user.username} a à offrir.`)
        .setColor("#FF5555")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "Name", value: `${card.fullName} x${cards_to_offer[index].amount} ${raritySymbols}`, inline: true },
        )
        .setImage(card.image)
        .setFooter({ text: `Carte ${index + 1}/${cards.length} - ${card.setName}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`prev_${interaction.id}`) // ID unique pour éviter les conflits
          .setLabel("⬅️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(index === 0),
        new ButtonBuilder()
          .setCustomId(`next_${interaction.id}`)
          .setLabel("➡️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(index === cards.length - 1)
      );

      return { embeds: [embed], components: [row] };
    };

    // Envoyer un nouveau message pour chaque interaction
    const message = await interaction.followUp(createMessagePayload());

    // Création d'un collecteur pour interagir avec les boutons
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.customId.startsWith("prev_") || i.customId.startsWith("next_"),
      time: 60000, // 60 secondes
    });

    collector.on("collect", async (i) => {
      if (i.customId === `prev_${interaction.id}` && index > 0) index--;
      if (i.customId === `next_${interaction.id}` && index < cards.length - 1) index++;

      await i.update(createMessagePayload()); // Moins de latence que editReply()
    });

    collector.on("end", async () => {
      await message.edit({ components: [] }); // Désactiver les boutons après expiration
    });

  } catch (error) {
    console.error(error);
    await interaction.editReply("Erreur lors de la récupération des cartes à offrir.");
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

    await interaction.reply({ files: [card.image] });
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
  // reply pas implémenté

  console.log("pas implétementé");

  // const row = new ActionRowBuilder().addComponents(
  //   new ButtonBuilder().setCustomId("lang_fr").setLabel("Français").setStyle(ButtonStyle.Primary),
  //   new ButtonBuilder().setCustomId("lang_en").setLabel("English").setStyle(ButtonStyle.Primary)
  // );

  // try {
  //   await interaction.reply("Vous n'êtes pas enregistré dans la base de données. Veuillez choisir votre langue.");
  //   const dmChannel = await interaction.user.createDM();
  //   await dmChannel.send({ content: "Choisissez votre langue :", components: [row] });
  // } catch (error) {
  //   console.error("Impossible d'envoyer un MP :", error);
  //   await interaction.reply({ content: "Je ne peux pas t'envoyer de message privé. Vérifie tes paramètres de confidentialité.", ephemeral: true });
  // }
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
          name: card.fullName + " " + getRaritySymbols(card.rarity),
          value: card.id,
        }))
      );
    } catch (error) {
      console.error("Erreur lors de l'autocomplétion :", error);
    }
  }
}

// permet d'envoyer la notifcation de trade en message privé
async function sendPrivateMessageForTrade(client, user1, user2, cardUser1, cardUser2) {
  try {
    const user1Discord = await client.users.fetch(user1.id_discord);
    const user2Discord = await client.users.fetch(user2.id_discord);
    const idFriend = 1213141516; // Remplacer par le vrai code ami

    const embedToSend = new EmbedBuilder()
      .setTitle("📤 Tu dois envoyer cette carte")
      .setDescription(`Tu dois envoyer la carte ${cardUser1.fullName} à **${user2Discord.username}**.`)
      .setColor("#FF5555")
      .setThumbnail(user1Discord.displayAvatarURL({ dynamic: true }))
      .setImage(cardUser1.image)
      .setFooter({ text: "Assure-toi de bien envoyer cette carte !" });

    const embedToReceive = new EmbedBuilder()
      .setTitle("📥 Tu vas recevoir cette carte")
      .setDescription(`En échange, tu vas recevoir la carte ${cardUser2.fullName} de **${user2Discord.username}**.`)
      .setColor("#55FF55")
      .setThumbnail(user2Discord.displayAvatarURL({ dynamic: true }))
      .setImage(cardUser2.image)
      .setFooter({ text: "L'échange est en attente de confirmation." });

    const friendCodeMessage = `Le code ami de **${user2Discord.username}** est : \`${idFriend}\``;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('copy_friend_code')
        .setLabel('Copier le code ami')
        .setStyle(ButtonStyle.Secondary)
    );

    await user1Discord.send({ embeds: [embedToSend] });
    await user1Discord.send({ embeds: [embedToReceive] });

    const messageWithButton = await user1Discord.send({
      content: friendCodeMessage,
      components: [row],
    });

    const collector = messageWithButton.createMessageComponentCollector({
      filter: (i) => i.customId === 'copy_friend_code',
      time: 60000, // 60 secondes
    });

    collector.on('collect', async (i) => {
      await i.reply({ content: `Code ami copié : \`${idFriend}\``, ephemeral: true });

      
    });

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
        await handleShowCardToOffer(client,interaction, userId);
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
