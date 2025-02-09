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
const cards = require("./back/assets/cards.json");
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
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("Commandes enregistrées avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des commandes:", error);
  }
}
registerCommands();

// Gestion des interactions
client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const commandName = interaction.commandName;
    let isTradable = false;

    if (commandName === "add_cards_to_offer") {
      isTradable = true; // Les cartes offertes doivent être échangeables
    } else if (commandName === "add_cards_wanted") {
      isTradable = true;  // Les cartes offertes doivent être échangeables
    } else if (commandName === "showcard") {
      isTradable = false; // Les cartes recherchées ne doivent pas nécessairement être échangeables
    }

    await autocomplete(interaction, isTradable);
    return;
  }

  if (!interaction.isCommand()) return;

  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  // get user id
  const userId = interaction.user.id;
  try {
    // Vérifier si l'utilisateur est dans la base de données
    const response = await axios.get(API_URL + "users");
    const users = response.data;
    const user = users.find((user) => user.id_discord === userId);
    if (!user) {
      // Création des boutons de sélection de langue
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("lang_fr")
          .setLabel("Français")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("lang_en")
          .setLabel("English")
          .setStyle(ButtonStyle.Primary)
      );

      // Envoyer un message privé avec le choix de langue
      try {
        interaction.reply(
          "Vous n'êtes pas enregistré dans la base de données. Veuillez choisir votre langue."
        );
        const dmChannel = await interaction.user.createDM();
        await dmChannel.send({
          content: "Choisissez votre langue :",
          components: [row],
        });
      } catch (error) {
        console.error("Impossible d'envoyer un MP :", error);
        await interaction.reply({
          content:
            "Je ne peux pas t'envoyer de message privé. Vérifie tes paramètres de confidentialité.",
          ephemeral: true,
        });
      }

      return;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    await interaction.reply(
      "Une erreur est survenue lors de la récupération des utilisateurs."
    );
    return;
  }

  switch (commandName) {
    // fonction qui ajoute une carte à la collection (ajoute l'id de la carte dans la table cards_to_offer)
    case "add_cards_to_offer":
      await interaction.deferReply({ ephemeral: true });

      let cardsList = [];
      for (let i = 1; i <= 5; i++) {
        const cardId = options.getString(`id${i}`);
        if (!cardId) continue; // Si aucun ID n'est fourni, on passe

        const amount = options.getInteger(`amount${i}`) || 1; // Si amount n'est pas défini, mettre 1 par défaut
        cardsList.push({ id: cardId, amount });
      }

      if (cardsList.length === 0) {
        await interaction.editReply(
          "Tu dois sélectionner au moins une carte !"
        );
        return;
      }

      // Vérifier si les cartes existent
      const invalidCards = cardsList.filter(
        (c) => !cards.find((card) => card.id === c.id)
      );
      if (invalidCards.length > 0) {
        await interaction.editReply(
          `Cartes introuvables : ${invalidCards.map((c) => c.id).join(", ")}`
        );
        return;
      }

      // Récupérer l'ID de l'utilisateur
      const userId = interaction.user.id;

      try {
        const requests = cardsList.map(({ id, amount }) =>
          axios.post(`${API_URL}users/${userId}/card_to_offer/${id}`, {
            amount,
          })
        );

        await Promise.all(requests);
        const addedCards = cardsList
          .map(({ id, amount }) => `- Carte ${id} (x${amount})`)
          .join("\n");
        await interaction.editReply(
          `Cartes ajoutées à ta collection :\n${addedCards}`
        );
      } catch (error) {
        console.error(error);
        await interaction.editReply(
          "Une erreur est survenue lors de l'ajout des cartes."
        );
      }
      break;

    case "show_cards_to_give":
      await interaction.reply("Not implemented yet");
      break;
    case "init":
      await interaction.reply("Initialisation de ta collection en cours...");
      break;
    case "listcards":
      await interaction.reply("Affichage de ta collection en cours...");
      break;
    case "removecard":
      const removeCardId = options.getString("id");
      await interaction.reply(
        `Carte ${removeCardId} retirée de ta collection !`
      );
      break;
    case "reset":
      await interaction.reply("Réinitialisation de ta collection en cours...");
      break;
      case "showcard":
        const showCardId = options.getString("id");
        try {
          const response = await axios.get(API_URL + "cards/" + showCardId, { 
            params: { id_discord: interaction.user.id } 
          });
          const card = response.data; // Assurez-vous de récupérer `data`
      
          if (!card) {
            throw new Error("Carte introuvable");
          }
      
          let imageUrl;
          if (card.image.startsWith("http")) {
            imageUrl = card.image; // C'est une URL directe
          } else {
            imageUrl = path.join(currentRepository, "assets", "cards", card.image);
          }

          await interaction.reply({ 
            files: [imageUrl]
          });
      
        } catch (error) {
          console.error(error);
          await interaction.reply("Carte introuvable");
        }
        break;
    case "users":
      axios.get(API_URL + "users").then((response) => {
        const users = response.data;
        interaction.reply(
          `Liste des utilisateurs : ${users
            .map((user) => user.name)
            .join(", ")}`
        );
      });
      break;
    default:
      break;
  }
});

// Fonction d'autocomplétion
async function autocomplete(interaction, isTradable) {
  try {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name.startsWith("id")) {
      const response = await axios.get(API_URL + "cards/autocomplete", {
        params: {
          card_id: focusedOption.value,
          id_discord: interaction.user.id,
          isTradable: isTradable,
        },
      });
      await interaction.respond(
        response.data.map((card) => ({
          name: card.name + " " + card.id,
          value: card.id,
        }))
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'autocomplétion :", error);
  }
}

// Lancement du bot
client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  // write in the channel 1335930030622248983 that the bot is ready
  // client.channels.fetch('1335930030622248983').then(channel => {
  //     channel.send('Bot is ready');
  // });
});

client.login(process.env.TOKEN);
