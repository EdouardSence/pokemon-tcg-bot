const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');

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
        .setName('addcard')
        .setDescription('Ajoute une carte à ta collection')
        .addStringOption(option =>
            option.setName('id')
                .setDescription("L'ID de la carte")
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('init')
        .setDescription('Initialise ta collection de cartes')
];

// Enregistrement des commandes
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
async function registerCommands() {
    try {
        console.log('Enregistrement des commandes...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID
        ), { body: commands });
        console.log('Commandes enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
}
registerCommands();

// Gestion des interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'addcard') {
        const cardId = options.getString('id');
        await interaction.reply(`Carte ${cardId} ajoutée à ta collection !`);
    } else if (commandName === 'init') {
        await interaction.reply('Initialisation de ta collection en cours...');
    }
});

// Lancement du bot
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
    // write in the channel 1335930030622248983 that the bot is ready
    client.channels.fetch('1335930030622248983').then(channel => {
        channel.send('Bot is ready');
    });
});

client.login(process.env.TOKEN);
