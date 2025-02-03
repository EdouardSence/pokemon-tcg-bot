const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const { token } = process.env;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Mock database (replace with a real database later)
const users = new Map();

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Slash Commands (example: /register)
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, user } = interaction;

    if (commandName === 'register') {
        if (users.has(user.id)) {
            await interaction.reply('You are already registered!');
            return;
        }

        users.set(user.id, {
            id: user.id,
            friendCode: '',
            cards: [],
            trades: [],
        });

        await interaction.reply('Successfully registered! Use `/addcard` to add your cards.');
    }
});

const commands = [
    {
        name: 'register',
        description: 'Register to start trading!',
    },
    {
        name: 'addcard',
        description: 'Add a card to your collection',
        options: [
            {
                name: 'card_name',
                description: 'Name of the card (e.g., Pikachu)',
                type: 3, // STRING type
                required: true,
            },
        ],
    },
    {
        name: 'trade',
        description: 'List a card for trade',
        options: [
            {
                name: 'card_offered',
                description: 'Card you want to trade (e.g., Pikachu)',
                type: 3,
                required: true,
            },
            {
                name: 'card_wanted',
                description: 'Card you want in return (e.g., Venusaur)',
                type: 3,
                required: true,
            },
        ],
    },
];

// Register commands globally
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering commands...');
        await rest.put(Routes.applicationCommands('YOUR_APPLICATION_ID'), { body: commands });
        console.log('Commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

const cardsData = require('./getcards.json');

// Transform the card data into a lookup object
const cardNames = cardsData.data.map((cardArray) => {
    const card = {};
    cardsData.names.forEach((field, index) => {
        card[field] = cardArray[index];
    });
    return card.name.toLowerCase(); // Normalize for case-insensitive checks
});

// Function to validate card names
function isValidCard(cardName) {
    return cardNames.includes(cardName.toLowerCase());
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, user, options } = interaction;

    // Get or create user profile
    const userProfile = users.get(user.id) || {
        id: user.id,
        friendCode: '',
        cards: [],
        trades: [],
    };

    if (commandName === 'register') {
        // ... existing registration logic ...
    }

    if (commandName === 'addcard') {
        const cardName = options.getString('card_name');

        if (!isValidCard(cardName)) {
            await interaction.reply(`Invalid card: ${cardName}. Use a valid card name.`);
            return;
        }

        userProfile.cards.push(cardName);
        users.set(user.id, userProfile);
        await interaction.reply(`Added **${cardName}** to your collection!`);
    }

    if (commandName === 'trade') {
        const cardOffered = options.getString('card_offered');
        const cardWanted = options.getString('card_wanted');

        if (!isValidCard(cardOffered) || !isValidCard(cardWanted)) {
            await interaction.reply('Invalid card name(s).');
            return;
        }

        userProfile.trades.push({ offered: cardOffered, wanted: cardWanted });
        users.set(user.id, userProfile);
        await interaction.reply(`Trade listed: **${cardOffered}** for **${cardWanted}**!`);
    }
});

// Add to the commands array:
{
    name: 'matches',
        description: 'Check your trade matches',
  }

// Handle the /matches command:
if (commandName === 'matches') {
    const userTrades = userProfile.trades;
    let matches = [];

    // Loop through all users and trades
    users.forEach((otherUser) => {
        if (otherUser.id === user.id) return;

        otherUser.trades.forEach((otherTrade) => {
            userTrades.forEach((userTrade) => {
                if (
                    userTrade.offered === otherTrade.wanted &&
                    userTrade.wanted === otherTrade.offered
                ) {
                    matches.push({
                        user: otherUser.id,
                        offered: otherTrade.offered,
                        wanted: otherTrade.wanted,
                    });
                }
            });
        });
    });

    if (matches.length === 0) {
        await interaction.reply('No trade matches found.');
        return;
    }

    const matchList = matches.map(
        (match) => `Match with <@${match.user}>: **${match.offered}** for **${match.wanted}**`
    ).join('\n');

    await interaction.reply(`Your trade matches:\n${matchList}`);
}

client.login(process.env.DISCORD_TOKEN);