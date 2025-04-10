const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const axios = require("axios");
const dotenv = require("dotenv");

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
    return "★".repeat(rarity - 4); // Étoile
  } else if (rarity >= 8 && rarity <= 9) {
    return "✧".repeat(rarity - 7); // Shiny
  } else if (rarity === 10) {
    return "👑"; // Couronne
  }
  return "";
};

// commande pour ajouter des cartes à offrir
async function handleAddCardsToOffer(interaction, options, authorCommandId) {
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

  const failedCards = [];

  try {
    const requests = cardsList.map(({ id, amount }) =>
      axios
        .post(`${API_URL}users/${authorCommandId}/card_to_offer/${id}`, {
          amount,
        })
        .catch((error) => {
          failedCards.push({ id, amount, error: error.response?.data?.error });
        })
    );
    await Promise.all(requests);

    const addedCards = cardsList
      .filter(({ id }) => !failedCards.some((failed) => failed.id === id))
      .map(({ id, amount }) => `- Carte ${id} (x${amount ? amount : 1})`)
      .join("\n");

    let replyMessage = `Cartes ajoutées à ta collection :\n${addedCards}`;
    if (failedCards.length > 0) {
      const failedCardsList = failedCards
        .map(
          ({ id, amount, error }) =>
            `- Carte ${id} (x${amount ? amount : 1}) : ${
              error || "Erreur inconnue"
            }`
        )
        .join("\n");
      replyMessage += `\n\nCartes non ajoutées :\n${failedCardsList}`;
    }

    await interaction.editReply(replyMessage);
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "Une erreur inattendue est survenue lors de l'ajout des cartes."
    );
  }
}

// commande pour ajouter des cartes recherchées
async function handleAddCardsWanted(interaction, options, authorCommandId) {
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

  const failedCards = [];

  try {
    const requests = cardsList.map(({ id, amount }) =>
      axios
        .post(`${API_URL}users/${authorCommandId}/card_wanted/${id}`, {
          amount,
        })
        .catch((error) => {
          failedCards.push({ id, amount, error: error.response?.data?.error });
        })
    );
    await Promise.all(requests);

    const addedCards = cardsList
      .filter(({ id }) => !failedCards.some((failed) => failed.id === id))
      .map(({ id, amount }) => `- Carte ${id} (x${amount ? amount : 1})`)
      .join("\n");

    let replyMessage = `Cartes ajoutées à ta collection :\n${addedCards}`;
    if (failedCards.length > 0) {
      const failedCardsList = failedCards
        .map(
          ({ id, amount, error }) =>
            `- Carte ${id} (x${amount ? amount : 1}) : ${
              error || "Erreur inconnue"
            }`
        )
        .join("\n");
      replyMessage += `\n\nCartes non ajoutées :\n${failedCardsList}`;
    }

    await interaction.editReply(replyMessage);
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "Une erreur inattendue est survenue lors de l'ajout des cartes."
    );
  }
}

async function handleRemoveCardsToOffer(interaction, options, authorCommandId) {
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
      axios.delete(`${API_URL}users/${authorCommandId}/card_to_offer/${id}`, {
        params: { amount: amount },
      })
    );
    await Promise.all(requests);

    const removedCards = cardsList
      .map(({ id, amount }) => `- Carte ${id} (x${amount ? amount : 1})`)
      .join("\n");
    await interaction.editReply(
      `Cartes retirées de ta collection :\n${removedCards}`
    );
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      error.response?.data?.error || "Erreur lors de la suppression des cartes."
    );
  }
}

async function handleRemoveCardsWanted(interaction, options, authorCommandId) {
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
      axios.delete(`${API_URL}users/${authorCommandId}/card_wanted/${id}`, {
        amount,
      })
    );
    await Promise.all(requests);

    const removedCards = cardsList
      .map(({ id, amount }) => `- Carte ${id} (x${amount ? amount : 1})`)
      .join("\n");
    await interaction.editReply(
      `Cartes retirées de ta collection :\n${removedCards}`
    );
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      error.response?.data?.error || "Erreur lors de la suppression des cartes."
    );
  }
}

async function handleShowCardToOffer(
  client,
  interaction,
  options,
  authorCommandId
) {
  try {
    // get the discord_id by the interaction
    await interaction.deferReply({ ephemeral: false }); // On peut désactiver ephemeral pour que tout le monde voie
    const username = options.getString("username");

    let response;
    let user;

    // SI il n'y a pas d'arugement
    if (username === null) {
      user = await client.users.fetch(authorCommandId);
      response = await getUserFromDb(authorCommandId);
    } else {
      response = await getUserFromDb(username);
      user = await client.users.fetch(response.id_discord);
    }
    const cards_to_offer = response.cards_to_offer;

    if (!cards_to_offer || cards_to_offer.length === 0) {
      return await interaction.editReply("Tu n'as aucune carte à offrir.");
    }

    const cards = await Promise.all(
      cards_to_offer.map(async (card) => {
        const res = await axios.get(`${API_URL}cards/${card.card_id}`, {
          params: { id_discord: authorCommandId },
        });
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
        .setDescription(
          `Voici la liste des cartes que ${user.username} a à offrir.`
        )
        .setColor("#FF5555")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields({
          name: "Name",
          value: `${card.fullName} x${cards_to_offer[index].amount} ${raritySymbols}`,
          inline: true,
        })
        .setImage(card.image)
        .setFooter({
          text: `Carte ${index + 1}/${cards.length} - ${card.setName}`,
        });

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
      filter: (i) =>
        i.customId.startsWith("prev_") || i.customId.startsWith("next_"),
      time: 60000, // 60 secondes
    });

    collector.on("collect", async (i) => {
      if (i.customId === `prev_${interaction.id}` && index > 0) index--;
      if (i.customId === `next_${interaction.id}` && index < cards.length - 1)
        index++;

      await i.update(createMessagePayload()); // Moins de latence que editReply()
    });

    collector.on("end", async () => {
      await message.edit({ components: [] }); // Désactiver les boutons après expiration
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "Erreur lors de la récupération des cartes à offrir."
    );
  }
}

async function handleShowCardWanted(
  client,
  interaction,
  options,
  authorCommandId
) {
  try {
    await interaction.deferReply({ ephemeral: false }); // On peut désactiver ephemeral pour que tout le monde voie
    const username = options.getString("username");

    let response;
    let user;
    if (username === null) {
      // SI il n'y a pas d'arugement :
      // dans ce cas on recupere toutes les infos du mec qui fait la commande SI il n'y a pas de parametre
      user = await client.users.fetch(authorCommandId);
      // on va prendre ses cartes à offrir
      response = await getUserFromDb(authorCommandId);
    } else {
      // SINON SI il cherche les cartes de quelqu'un d'autre,
      // on recupere les infos de la personne recherchée
      response = await getUserFromDb(username);
      user = await client.users.fetch(response.id_discord);
    }
    const cards_wanted = response.cards_wanted;

    if (!cards_wanted || cards_wanted.length === 0) {
      return await interaction.editReply("Tu n'as pas demandé de carte.");
    }

    const cards = await Promise.all(
      cards_wanted.map(async (card) => {
        const res = await axios.get(`${API_URL}cards/${card.card_id}`, {
          params: { id_discord: authorCommandId },
        });
        return res.data;
      })
    );

    let index = 0;

    // Fonction pour créer l'embed et les boutons
    const createMessagePayload = () => {
      const card = cards[index];
      const raritySymbols = getRaritySymbols(card.rarity);

      const embed = new EmbedBuilder()
        .setTitle("Cartes voulues")
        .setDescription(`Voici la liste des cartes que ${user.username} veut.`)
        .setColor("#FF5555")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields({
          name: "Name",
          value: `${card.fullName} x${cards_wanted[index].amount} ${raritySymbols}`,
          inline: true,
        })
        .setImage(card.image)
        .setFooter({
          text: `Carte ${index + 1}/${cards.length} - ${card.setName}`,
        });

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
      filter: (i) =>
        i.customId.startsWith("prev_") || i.customId.startsWith("next_"),
      time: 60000, // 60 secondes
    });

    collector.on("collect", async (i) => {
      if (i.customId === `prev_${interaction.id}` && index > 0) index--;
      if (i.customId === `next_${interaction.id}` && index < cards.length - 1)
        index++;

      await i.update(createMessagePayload()); // Moins de latence que editReply()
    });

    collector.on("end", async () => {
      await message.edit({ components: [] }); // Désactiver les boutons après expiration
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "Erreur lors de la récupération des cartes demandées."
    );
  }
}

// commande pour afficher une carte
async function handleShowCard(interaction, options) {
  const showCardId = options.getString("search");
  try {
    const response = await axios.get(`${API_URL}cards/${showCardId}`, {
      params: { id_discord: interaction.user.id },
    });
    const card = response.data;

    if (!card) {
      throw new Error("Carte introuvable");
    }

    await interaction.reply({ files: [card.image] });
  } catch (error) {
    console.error(error);
    await interaction.reply(
      error.response?.data?.error ||
        "Erreur lors de la récupération de la carte."
    );
  }
}

// commande pour lister les utilisateurs
async function handleUsersList(interaction) {
  try {
    const response = await axios.get(`${API_URL}users`);
    const users = response.data;
    await interaction.reply(
      `Liste des utilisateurs : ${users.map((user) => user.name).join(", ")}`
    );
  } catch (error) {
    console.error(error);
    await interaction.reply(
      error.response?.data?.error ||
        "Erreur lors de la récupération des utilisateurs."
    );
  }
}

// commande pour supprimer son compte TODO faudra peut etre renforcer la sécurité un jour
async function handleDeleteAccount(interaction) {
  try {
    const userId = interaction.user.id;

    // Fetch user data to determine language
    const user = await getUserFromDb(userId);
    const isFrench = user.language === "fr";

    const embed = new EmbedBuilder()
      .setTitle(isFrench ? "❓ Confirmation" : "❓ Confirmation")
      .setDescription(
        isFrench
          ? "Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible."
          : "Are you sure you want to delete your account? This action is irreversible."
      )
      .setColor("#FF5555");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_delete_account")
        .setLabel(isFrench ? "Oui, supprimer" : "Yes, delete")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_delete_account")
        .setLabel(isFrench ? "Non, annuler" : "No, cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) =>
        i.customId === "confirm_delete_account" ||
        i.customId === "cancel_delete_account",
      time: 30000, // 30 seconds
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== userId) {
        return await i.reply({
          content: isFrench
            ? "❌ Tu ne peux pas interagir avec cette confirmation."
            : "❌ You cannot interact with this confirmation.",
          ephemeral: true,
        });
      }

      if (i.customId === "confirm_delete_account") {
        try {
          await axios.delete(`${API_URL}users/${userId}`);
          await i.update({
            content: isFrench
              ? "✅ Ton compte a été supprimé avec succès."
              : "✅ Your account has been successfully deleted.",
            embeds: [],
            components: [],
          });
        } catch (error) {
          console.error(error);
          await i.update({
            content:
              error.response?.data?.error ||
              (isFrench
                ? "❌ Erreur lors de la suppression du compte."
                : "❌ Error while deleting the account."),
            embeds: [],
            components: [],
          });
        }
      } else if (i.customId === "cancel_delete_account") {
        await i.update({
          content: isFrench
            ? "❌ Suppression du compte annulée."
            : "❌ Account deletion canceled.",
          embeds: [],
          components: [],
        });
      }
      collector.stop();
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        await interaction.editReply({
          content: isFrench
            ? "⏰ Temps écoulé. Suppression du compte annulée."
            : "⏰ Time expired. Account deletion canceled.",
          embeds: [],
          components: [],
        });
      }
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        error.response?.data?.error ||
        (isFrench
          ? "❌ Une erreur est survenue. Veuillez réessayer plus tard."
          : "❌ An error occurred. Please try again later."),
      ephemeral: true,
    });
  }
}

async function handleResetAccount(interaction) {
  try {
    const userId = interaction.user.id;

    // Fetch user data to determine language
    const user = await getUserFromDb(userId);
    const isFrench = user.language === "fr";

    const embed = new EmbedBuilder()
      .setTitle(isFrench ? "❓ Confirmation" : "❓ Confirmation")
      .setDescription(
        isFrench
          ? "Es-tu sûr de vouloir supprimer ta collection ? Cette action est irréversible."
          : "Are you sure you want to delete your collection? This action is irreversible."
      )
      .setColor("#FF5555");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_reset_account")
        .setLabel(isFrench ? "Oui, supprimer" : "Yes, delete")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_reset_account")
        .setLabel(isFrench ? "Non, annuler" : "No, cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) =>
        i.customId === "confirm_reset_account" ||
        i.customId === "cancel_reset_account",
      time: 30000, // 30 seconds
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== userId) {
        return await i.reply({
          content: isFrench
            ? "❌ Tu ne peux pas interagir avec cette confirmation."
            : "❌ You cannot interact with this confirmation.",
          ephemeral: true,
        });
      }

      if (i.customId === "confirm_reset_account") {
        try {
          await axios.post(`${API_URL}users/${userId}/reset`);
          await i.update({
            content: isFrench
              ? "✅ Ta collection a été supprimée avec succès."
              : "✅ Your collection has been successfully deleted.",
            embeds: [],
            components: [],
          });
        } catch (error) {
          console.error(error);
          await i.update({
            content:
              error.response?.data?.error ||
              (isFrench
                ? "❌ Erreur lors de la suppression de la collection."
                : "❌ Error while deleting the collection."),
            embeds: [],
            components: [],
          });
        }
      } else if (i.customId === "cancel_reset_account") {
        await i.update({
          content: isFrench
            ? "❌ Suppression de la collection annulée."
            : "❌ Collection deletion canceled.",
          embeds: [],
          components: [],
        });
      }
      collector.stop();
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        await interaction.editReply({
          content: isFrench
            ? "⏰ Temps écoulé. Suppression de la collection annulée."
            : "⏰ Time expired. Collection deletion canceled.",
          embeds: [],
          components: [],
        });
      }
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        error.response?.data?.error ||
        (isFrench
          ? "❌ Une erreur est survenue. Veuillez réessayer plus tard."
          : "❌ An error occurred. Please try again later."),
      ephemeral: true,
    });
  }
}

// se declenche si l'utilisateur n'est pas enregistré
async function handleUserNotRegistered(interaction) {
  try {
    const createMessagePayload = () => {
      const embed = new EmbedBuilder()
        .setTitle("🌍 Choisis ta langue")
        .setDescription(
          "Tu n'es pas enregistré dans la base de données. Choisis ta langue pour continuer."
        )
        .setColor("#FF5555");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("lang_fr")
          .setLabel("🇫🇷 Français")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("lang_en")
          .setLabel("🇬🇧 English")
          .setStyle(ButtonStyle.Primary)
      );

      return { embeds: [embed], components: [row] };
    };

    // Envoie le message et récupère la référence du message
    const sentMessage = await interaction.reply({
      ...createMessagePayload(),
      fetchReply: true,
      ephemeral: true,
    });

    const collector = sentMessage.createMessageComponentCollector({
      filter: (i) => i.customId === "lang_fr" || i.customId === "lang_en",
      time: 60000,
    });

    collector.on("collect", async (i) => {
      try {
        // Ajout d'un try/catch ici
        if (i.customId === "lang_fr") {
          await i.reply({
            content:
              "Tu as choisi le français.\n\n📩 Envoie-moi ton code ami pour t'enregistrer !",
            ephemeral: true,
          });
        } else {
          await i.reply({
            content:
              "You chose English.\n\n📩 Send me your friend code to register!",
            ephemeral: true,
          });
        }

        const filter = (response) => response.author.id === i.user.id;
        // Remove the max: 1 to allow multiple attempts
        const messageCollector = i.channel.createMessageCollector({
          filter,
          time: 120000, // Extended time to 2 minutes to give more time for retries
        });

        messageCollector.on("collect", async (message) => {
          try {
            if (message.author.id !== i.user.id) return;
            const messageContent = message.content.toString();

            try {
              await message.delete();
            } catch (deleteError) {
              console.error(
                "Erreur lors de la suppression du message: ",
                deleteError
              );
            }

            // Option pour quitter
            if (messageContent.toLowerCase() === "exit") {
              await i.followUp({
                content:
                  i.customId === "lang_fr"
                    ? "👋 Processus d'enregistrement annulé."
                    : "👋 Registration process cancelled.",
                ephemeral: true,
              });
              messageCollector.stop("exit");
              return;
            }

            const friendCode = messageContent.replace(/[-\s]/g, "");

            if (!/^\d{16}$/.test(friendCode)) {
              await i.followUp({
                content:
                  i.customId === "lang_fr"
                    ? "❌ Le code ami doit contenir 16 chiffres. Veuillez réessayer ou tapez 'exit' pour annuler."
                    : "❌ Friend code must contain 16 digits. Please try again or type 'exit' to cancel.",
                ephemeral: true,
              });
              // No return here allows the collector to continue listening
              return;
            }

            try {
              const response = await axios.post(`${API_URL}users`, {
                id_discord: message.author.id,
                name: message.author.username,
                id_friend: friendCode,
                language: i.customId === "lang_fr" ? "fr" : "en",
              });

              if (response.data.error) {
                console.error("API Error:", response.data.error);
                if (
                  response.data.error.data &&
                  response.data.error.data.error
                ) {
                  console.error(
                    "Detailed error:",
                    response.data.error.data.error
                  );
                }

                await i.followUp({
                  content:
                    i.customId === "lang_fr"
                      ? "❌ Une erreur est survenue lors de l'enregistrement. Veuillez réessayer ou tapez 'exit' pour annuler."
                      : "❌ An error occurred during registration. Please try again or type 'exit' to cancel.",
                  ephemeral: true,
                });
                // Continue listening for more attempts
                return;
              }

              // Succès - on informe l'utilisateur et on arrête le collecteur
              await i.followUp({
                content:
                  i.customId === "lang_fr"
                    ? "✅ Ton compte a été enregistré avec succès!"
                    : "✅ Your account has been successfully registered!",
                ephemeral: true,
              });

              messageCollector.stop("success");
            } catch (apiError) {
              console.error("Erreur lors de l'appel API:", apiError);

              await i.followUp({
                content:
                  i.customId === "lang_fr"
                    ? `❌ Erreur: ${
                        apiError.response?.data?.error ||
                        "Problème de communication avec le serveur"
                      }. Veuillez réessayer ou tapez 'exit' pour annuler.`
                    : `❌ Error: ${
                        apiError.response?.data?.error ||
                        "Communication issue with the server"
                      }. Please try again or type 'exit' to cancel.`,
                ephemeral: true,
              });
              // Continue listening for more attempts
            }
          } catch (collectorError) {
            console.error(
              "Erreur dans le collector de messages:",
              collectorError
            );
          }
        });

        // Modifier le gestionnaire d'événement "end" pour préciser quand le collecteur s'arrête
        messageCollector.on("end", (collected, reason) => {
          if (reason === "time") {
            try {
              i.followUp({
                content:
                  i.customId === "lang_fr"
                    ? "⏰ Délai d'attente expiré. Veuillez réessayer la commande."
                    : "⏰ Timeout expired. Please try the command again.",
                ephemeral: true,
              });
            } catch (timeoutError) {
              console.error(
                "Erreur lors de l'envoi du message d'expiration:",
                timeoutError
              );
            }
          }
        });
      } catch (buttonError) {
        console.error("Erreur lors du traitement du bouton:", buttonError);
        try {
          i.reply({
            content: "❌ Une erreur est survenue. Veuillez réessayer.",
            ephemeral: true,
          });
        } catch (replyError) {
          console.error("Impossible de répondre à l'interaction:", replyError);
        }
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        try {
          interaction.followUp({
            content:
              "⏰ Délai d'attente expiré pour la sélection de langue. Veuillez réessayer la commande.",
            ephemeral: true,
          });
        } catch (error) {
          console.error(
            "Erreur lors de l'envoi du message d'expiration:",
            error
          );
        }
      }
    });
  } catch (error) {
    console.error("Erreur principale dans handleUserNotRegistered:", error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            "❌ Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer plus tard.",
          ephemeral: true,
        });
      } else {
        await interaction.followUp({
          content:
            "❌ Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer plus tard.",
          ephemeral: true,
        });
      }
    } catch (replyError) {
      console.error(
        "Impossible de répondre à l'interaction après une erreur:",
        replyError
      );
    }
  }
}

// permet de faire une autocomplétion sur la recherche de carte
async function handleAutocompleteCard(interaction) {
  try {
    const focusedOption = interaction.options.getFocused(true);
    const { name, value } = focusedOption;

    let isTradable = false;
    const commandName = interaction.commandName;

    if (
      commandName === "add_cards_to_offer" ||
      commandName === "add_cards_wanted"
    ) {
      isTradable = true;
    } else if (commandName === "showcard") {
      isTradable = false;
    }

    if (name.startsWith("search")) {
      const response = await axios.get(`${API_URL}cards/autocomplete`, {
        params: { search: value, id_discord: interaction.user.id, isTradable },
      });
      await interaction.respond(
        response.data.map((card) => ({
          name: card.fullName + " " + getRaritySymbols(card.rarity),
          value: card.id,
        }))
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'autocomplétion :", error);
  }
}

// permet de faire une autocomplétion sur la recherche de carte
async function handleAutocompleteUser(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  const { name, value } = focusedOption;

  if (name.startsWith("username")) {
    try {
      const response = await axios.get(`${API_URL}users/autocomplete`, {
        params: { name: value },
      });
      await interaction.respond(
        response.data.map((user) => ({
          name: user.name,
          value: user.id.toString(),
        }))
      );
    } catch (error) {
      console.error("Erreur lors de l'autocomplétion :", error);
    }
  }
}

async function handleAutocompleteCardsToOffer(interaction) {
  try {
    const focusedOption = interaction.options.getFocused(true);
    const { name, value } = focusedOption;

    if (name.startsWith("search")) {
      const response = await axios.get(
        `${API_URL}users/${interaction.user.id}/cards_to_offer/autocomplete`,
        {
          params: { search: value },
        }
      );
      await interaction.respond(
        response.data.map((card) => ({
          name:
            " x" +
            card.amount +
            " " +
            card.fullName +
            " " +
            getRaritySymbols(card.rarity),
          value: card.id,
        }))
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'autocomplétion :", error);
  }
}

async function handleAutocompleteCardsWanted(interaction) {
  try {
    const focusedOption = interaction.options.getFocused(true);
    const { name, value } = focusedOption;
    if (name.startsWith("search")) {
      const response = await axios.get(
        `${API_URL}users/${interaction.user.id}/cards_wanted/autocomplete`,
        {
          params: { search: value },
        }
      );
      await interaction.respond(
        response.data.map((card) => ({
          name:
            " x" +
            card.amount +
            " " +
            card.fullName +
            " " +
            getRaritySymbols(card.rarity),
          value: card.id,
        }))
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'autocomplétion :", error);
  }
}

// // permet d'envoyer la notifcation de trade en message privé
// async function sendPrivateMessageForTrade(
//   client,
//   user1,
//   user2,
//   cardUser1,
//   cardUser2
// ) {
//   try {
//     const user1Discord = await client.users.fetch(user1.id_discord);
//     const user2Discord = await client.users.fetch(user2.id_discord);
//     const idFriend = user2.id_friend;

//     const embedToSend = new EmbedBuilder()
//       .setTitle("📤 Tu dois envoyer cette carte")
//       .setDescription(
//         `Tu dois envoyer la carte ${cardUser1.fullName} à **${user2Discord.username}**.`
//       )
//       .setColor("#FF5555")
//       .setThumbnail(user1Discord.displayAvatarURL({ dynamic: true }))
//       .setImage(cardUser1.image)
//       .setFooter({ text: "Assure-toi de bien envoyer cette carte !" });

//     const embedToReceive = new EmbedBuilder()
//       .setTitle("📥 Tu vas recevoir cette carte")
//       .setDescription(
//         `En échange, tu vas recevoir la carte ${cardUser2.fullName} de **${user2Discord.username}**.`
//       )
//       .setColor("#55FF55")
//       .setThumbnail(user2Discord.displayAvatarURL({ dynamic: true }))
//       .setImage(cardUser2.image)
//       .setFooter({ text: "L'échange est en attente de confirmation." });

//     const friendCodeMessage = `Le code ami de **${user2Discord.username}** est : \`${idFriend}\``;

//     const row = new ActionRowBuilder().addComponents(
//       new ButtonBuilder()
//         .setCustomId("copy_friend_code")
//         .setLabel("Copier le code ami")
//         .setStyle(ButtonStyle.Secondary)
//     );

//     await user1Discord.send({ embeds: [embedToSend] });
//     await user1Discord.send({ embeds: [embedToReceive] });

//     const messageWithButton = await user1Discord.send({
//       content: friendCodeMessage,
//       components: [row],
//     });

//     const collector = messageWithButton.createMessageComponentCollector({
//       filter: (i) => i.customId === "copy_friend_code",
//       time: 60000, // 60 secondes
//     });

//     collector.on("collect", async (i) => {
//       await i.reply({
//         content: `Code ami copié : \`${idFriend}\``,
//         ephemeral: true,
//       });
//     });
//   } catch (error) {
//     console.error("Erreur lors de l'envoi du message d'échange :", error);
//   }
// }

async function handleHelp(interaction) {
  try {
    // Récupérer les données de l'utilisateur pour déterminer la langue
    const userId = interaction.user.id;
    let isFrench = true; // Par défaut en français

    try {
      const user = await getUserFromDb(userId);
      isFrench = user.language === "fr";
    } catch (error) {
      // Si l'utilisateur n'est pas enregistré, on utilise le français par défaut
      console.log(
        "Utilisateur non enregistré, utilisation du français par défaut"
      );
    }

    // Créer l'embed
    const helpEmbed = new EmbedBuilder()
      .setTitle(isFrench ? "📚 Guide des Commandes" : "📚 Commands Guide")
      .setDescription(
        isFrench
          ? "Voici la liste des commandes disponibles pour le bot de trading de cartes."
          : "Here is the list of available commands for the card trading bot."
      )
      .setColor("#FF5555")
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: isFrench ? "🔹 Commandes de Base" : "🔹 Basic Commands",
          value: isFrench
            ? "• `/register` - Crée ton compte pour commencer à utiliser le bot.\n• `/showcard [search]` - Affiche une carte spécifique.\n• `/users` - Affiche la liste des utilisateurs enregistrés."
            : "• `/register` - Create your account to start using the bot.\n• `/showcard [search]` - Display a specific card.\n• `/users` - Display the list of registered users.",
        },
        {
          name: isFrench
            ? "🔹 Gestion des Cartes à Offrir"
            : "🔹 Managing Cards to Offer",
          value: isFrench
            ? "• `/add_cards_to_offer [search1-5] [amount1-5]` - Ajoute des cartes que tu veux offrir.\n• `/remove_cards_to_offer [search1-5] [amount1-5]` - Retire des cartes de ta liste d'offres.\n• `/show_cards_to_offer [username]` - Affiche tes cartes à offrir ou celles d'un autre utilisateur."
            : "• `/add_cards_to_offer [search1-5] [amount1-5]` - Add cards you want to offer.\n• `/remove_cards_to_offer [search1-5] [amount1-5]` - Remove cards from your offer list.\n• `/show_cards_to_offer [username]` - Display your cards to offer or those of another user.",
        },
        {
          name: isFrench
            ? "🔹 Gestion des Cartes Recherchées"
            : "🔹 Managing Wanted Cards",
          value: isFrench
            ? "• `/add_cards_wanted [search1-5] [amount1-5]` - Ajoute des cartes que tu recherches.\n• `/remove_cards_wanted [search1-5] [amount1-5]` - Retire des cartes de ta liste de recherche.\n• `/show_cards_wanted [username]` - Affiche tes cartes recherchées ou celles d'un autre utilisateur."
            : "• `/add_cards_wanted [search1-5] [amount1-5]` - Add cards you are looking for.\n• `/remove_cards_wanted [search1-5] [amount1-5]` - Remove cards from your wanted list.\n• `/show_cards_wanted [username]` - Display your wanted cards or those of another user.",
        },
        {
          name: isFrench ? "🔹 Gestion de Compte" : "🔹 Account Management",
          value: isFrench
            ? "• `/reset` - Réinitialise ta collection (supprime toutes tes cartes).\n• `/delete_account` - Supprime complètement ton compte."
            : "• `/reset` - Reset your collection (delete all your cards).\n• `/delete_account` - Completely delete your account.",
        },
        {
          name: isFrench ? "🔹 Aide" : "🔹 Help",
          value: isFrench
            ? "• `/help` - Affiche ce guide des commandes.\n\nUtilise l'autocomplétion pour faciliter la recherche de cartes et d'utilisateurs !"
            : "• `/help` - Display this command guide.\n\nUse autocomplete to easily search for cards and users!",
        }
      )
      .setFooter({
        text: isFrench
          ? "Pour plus d'informations, contactez un administrateur."
          : "For more information, contact an administrator.",
      })
      .setTimestamp();

    // Envoi de l'embed
    await interaction.reply({ embeds: [helpEmbed], ephemeral: false });
  } catch (error) {
    console.error("Erreur lors de l'affichage de l'aide :", error);
    await interaction.reply({
      content: "Une erreur est survenue lors de l'affichage de l'aide.",
      ephemeral: true,
    });
  }
}

// fonction principale pour gérer les interactions
async function handleInteraction(client, interaction) {
  if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

  const authorCommandId = interaction.user.id;

  try {
    const user = await getUserFromDb(authorCommandId);

    // ✅ Gérer les interactions d'autocomplétion
    if (interaction.isAutocomplete()) {
      const commandName = interaction.commandName;

      switch (commandName) {
        case "add_cards_to_offer":
          await handleAutocompleteCard(interaction);
        case "add_cards_wanted":
          await handleAutocompleteCard(interaction);
        case "remove_cards_to_offer":
          await handleAutocompleteCardsToOffer(interaction);
        case "remove_cards_wanted":
          await handleAutocompleteCardsWanted(interaction);
        case "showcard":
          await handleAutocompleteCard(interaction);
          break;
        case "show_cards_to_offer":
          await handleAutocompleteUser(interaction);
          break;
        case "show_cards_wanted":
          await handleAutocompleteUser(interaction);
          break;
        default:
          console.warn(
            `Aucune autocomplétion définie pour la commande: ${commandName}`
          );
          break;
      }
      return; // On s'arrête ici pour les autocomplétions, PAS pour les commandes
    }

    // ✅ Gérer les commandes normales

    const { commandName, options } = interaction;

    switch (commandName) {
      case "add_cards_to_offer":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleAddCardsToOffer(interaction, options, authorCommandId);
        break;

      case "add_cards_wanted":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleAddCardsWanted(interaction, options, authorCommandId);
        break;

      case "remove_cards_to_offer":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleRemoveCardsToOffer(interaction, options, authorCommandId);
        break;

      case "remove_cards_wanted":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleRemoveCardsWanted(interaction, options, authorCommandId);
        break;

      case "show_cards_to_offer":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleShowCardToOffer(
          client,
          interaction,
          options,
          authorCommandId
        );
        break;

      case "show_cards_wanted":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleShowCardWanted(
          client,
          interaction,
          options,
          authorCommandId
        );
        break;
      case "reset":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleResetAccount(interaction, options, authorCommandId);
        break;
      case "register":
        if (user) {
          return await interaction.reply("Tu es déjà enregistré !");
        }
        await handleUserNotRegistered(interaction);
        break;
      case "delete_account":
        if (!user) {
          return await handleUserNotRegistered(interaction);
        }
        await handleDeleteAccount(interaction);
        break;
      case "showcard":
        await handleShowCard(interaction, options);
        break;
      case "users":
        await handleUsersList(interaction);
        break;
      case "help":
        await handleHelp(interaction);
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
  getUserFromDb,
};
