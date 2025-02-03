// Import des modules nécessaires
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

// Création du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Liste des commandes disponibles
const commands = [
    {
        name: 'addcard',
        description: 'Ajoute une carte à ta collection',
        options: [{
            name: 'id',
            type: 3, // STRING
            description: "L'ID de la carte",
            required: true,
        }]
    },
    {
        name: 'init',
        description: 'Initialise ta collection de cartes'
    }
];

// Enregistrement des commandes
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log('Enregistrement des commandes...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Commandes enregistrées avec succès');
    } catch (error) {
        console.error(error);
    }
})();

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
