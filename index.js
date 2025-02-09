const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const dotenv = require("dotenv");
const axios = require("axios");
const path = require("path");
const API_URL = "http://localhost:3000/";
const currentRepository = __dirname; // Chemin du dossier où le script s'exécute

// Chargement des variables d'environnement
dotenv.config();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Liste des commandes disponibles
const commands = require("./commands"); // Importer les commandes

// Enregistrement des commandes
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
async function registerCommands() {
  try {
    console.log("Enregistrement des commandes...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log("Commandes enregistrées avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des commandes:", error);
  }
}
registerCommands();

// Fonction pour récupérer l'utilisateur de la base de données
async function getUserFromDb(userId) {
  try {
    const response = await axios.get(`${API_URL}users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    throw new Error("Impossible de récupérer les utilisateurs");
  }
}

// Gestion des interactions
client.on("interactionCreate", async (interaction) => {
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

      case "show_cards_to_give":
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
});

// Fonction pour gérer un utilisateur non enregistré
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

// Fonction d'autocomplétion
async function handleAutocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  const { name, value } = focusedOption;

  // Déterminer si les cartes doivent être échangeables ou non en fonction de la commande
  let isTradable = false;
  const commandName = interaction.commandName;

  if (commandName === "add_cards_to_offer" || commandName === "add_cards_wanted") {
    isTradable = true;  // Les cartes ajoutées doivent être échangeables
  } else if (commandName === "showcard") {
    isTradable = false; // Les cartes recherchées ne doivent pas nécessairement être échangeables
  }

  // Vérifier si le champ de recherche est celui attendu
  if (name.startsWith("search")) {
    try {
      const response = await axios.get(`${API_URL}cards/autocomplete`, {
        params: { search: value, id_discord: interaction.user.id, isTradable }
      });
      
      // Répondre avec les données obtenues
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


// Gestion de l'ajout de cartes à la collection
async function handleAddCardsToOffer(interaction, options, userId) {
  await interaction.deferReply({ ephemeral: true });

  const cardsList = [];
  for (let i = 1; i <= 5; i++) {
    const cardId = options.getString(`search${i}`);
    console.log(cardId);
    if (!cardId) continue;

    const amount = options.getInteger(`amount${i}`);
    cardsList.push({ id: cardId, amount });
  }
  console.log(cardsList);
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
    await interaction.editReply("Une erreur est survenue lors de l'ajout des cartes.");
  }
}

// Gestion de la commande 'showcard'
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
    await interaction.reply("Carte introuvable");
  }
}

// Liste des utilisateurs
async function handleUsersList(interaction) {
  try {
    const response = await axios.get(`${API_URL}users`);
    const users = response.data;
    await interaction.reply(`Liste des utilisateurs : ${users.map(user => user.name).join(", ")}`);
  } catch (error) {
    console.error(error);
    await interaction.reply("Erreur lors de la récupération des utilisateurs.");
  }
}

// Lancement du bot
client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.login(process.env.TOKEN);
