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
const cards = require("./assets/cards.json");
const axios = require("axios");
const API_URL = "http://localhost:3000/";

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
const commands = [
    new SlashCommandBuilder()
        .setName("cards_to_give")
        .setDescription("Ajoute une liste de cartes à donner")
        .addStringOption((option) =>
            option
                .setName("id1")
                .setDescription("L'ID de la carte")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount1")
                .setDescription("Le nombre de cartes")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("id2")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount2")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("id3")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount3")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("id4")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount4")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("id5")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount5")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName("cards_wanted")
        .setDescription("Ajoute une liste de cartes recherchées")
        .addStringOption((option) =>
            option
                .setName("id1")
                .setDescription("L'ID de la carte")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount1")
                .setDescription("Le nombre de cartes")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("id2")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount2")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("id3")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount3")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("id4")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount4")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("id5")
                .setDescription("L'ID de la carte")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount5")
                .setDescription("Le nombre de cartes")
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName("init")
        .setDescription("Initialise ta collection de cartes"),
    new SlashCommandBuilder()
        .setName("listcards")
        .setDescription("Affiche la liste de tes cartes"),
    new SlashCommandBuilder()
        .setName("removecard")
        .setDescription("Retire une carte de ta collection")
        .addStringOption((option) =>
            option
                .setName("id")
                .setDescription("L'ID de la carte")
                .setRequired(true)
                .setAutocomplete(true)
        ),
    new SlashCommandBuilder()
        .setName("reset")
        .setDescription("Réinitialise ta collection de cartes"),
    new SlashCommandBuilder()
        .setName("showcard")
        .setDescription("Affiche une carte de ta collection")
        .addStringOption((option) =>
            option
                .setName("id")
                .setDescription("L'ID de la carte")
                .setRequired(true)
                .setAutocomplete(true)
        ),
    new SlashCommandBuilder()
        .setName("users")
        .setDescription("Récupère la liste des utilisateurs"),
];

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
        await autocomplete(interaction);
        return;
    }

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
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('lang_fr')
                        .setLabel('Français')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('lang_en')
                        .setLabel('English')
                        .setStyle(ButtonStyle.Primary)
                );

            // Envoyer un message privé avec le choix de langue
            try {
                interaction.reply("Vous n'êtes pas enregistré dans la base de données. Veuillez choisir votre langue.");
                const dmChannel = await interaction.user.createDM();
                await dmChannel.send({
                    content: "Choisissez votre langue :",
                    components: [row]
                });
            } catch (error) {
                console.error("Impossible d'envoyer un MP :", error);
                await interaction.reply({
                    content: "Je ne peux pas t'envoyer de message privé. Vérifie tes paramètres de confidentialité.",
                    ephemeral: true
                });
            }

            return;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
        await interaction.reply("Une erreur est survenue lors de la récupération des utilisateurs.");
        return;
    }



    switch (commandName) {
        // fonction qui ajoute une carte à la collection (ajoute l'id de la carte dans la table given_cards)
        case "cards_to_give":
            // obtenir le nombre de paramètres saisis par l'utilisateur
            const params = options.data;
            for (let i = 1; i <= params.length / 2; i++) {
                // verifier si l'id de la carte est valide
                const addCardId = options.getString("id" + i);
                if (!cards.find((card) => card.id === addCardId)) {
                    await interaction.reply("Carte introuvable");
                    return;
                }
                await interaction.reply(
                    `Carte ${addCardId} ajoutée à ta collection !`
                );
                axios.post(API_URL + `users/${userId}/given_card/${addCardId}`, {
                    amount: options.getInteger("amount" + i)
                });
            }
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
                const card = cards.find((card) => card.id === showCardId);
                if (!card) {
                    throw new Error("Carte introuvable");
                }

                await interaction.reply({ files: [filePath] });
            }
            catch (error) {
                console.error(error);
                await interaction.reply("Carte introuvable");
            }
            break;
        case "users":
            axios.get(API_URL + "users").then((response) => {
                const users = response.data;
                interaction.reply(
                    `Liste des utilisateurs : ${users.map((user) => user.name).join(", ")}`
                );
            });
            break;
        default:
            break;
    }
});

// Fonction d'autocomplétion
async function autocomplete(interaction) {
    try {
        const cardIds = cards.map((card) => card.id);

        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === "id" || focusedOption.name.startsWith("id")) {
            const filtered = cardIds.filter((id) =>
                id.startsWith(focusedOption.value)
            );
            await interaction.respond(
                filtered.map((id) => ({ name: id, value: id }))
            );
        }
    } catch (error) {
        //console.error(error);
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
