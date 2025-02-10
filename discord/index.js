const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const { listenToDatabase } = require('./database');
const { handleInteraction } = require('./interactions');
const commands = require('./commands');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

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

client.on("interactionCreate", (interaction) => handleInteraction(client, interaction));

client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  listenToDatabase(client);
});

client.login(process.env.TOKEN);

registerCommands();
