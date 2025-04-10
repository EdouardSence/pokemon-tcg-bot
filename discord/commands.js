const { SlashCommandBuilder } = require("discord.js");

/**
 * Génère une commande permettant d'ajouter une liste de cartes.
 * @param {string} name Nom de la commande
 * @param {string} description Description de la commande
 * @param {boolean} amountRequired Le premier "amount" doit-il être obligatoire ?
 * @returns {SlashCommandBuilder} Commande générée
 */
function createCardListCommand(name, description, amountRequired) {
  const command = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);

  for (let i = 1; i <= 5; i++) {
    command.addStringOption((option) =>
      option
        .setName(`search${i}`)
        .setDescription(`Recherche de la carte ${i}`)
        .setRequired(i === 1)
        .setAutocomplete(true)
    );
    command.addIntegerOption((option) =>
      option
        .setName(`amount${i}`)
        .setDescription("Nombre d'exemplaires (par défaut: 1)")
    );
  }

  return command;
}

// Liste des commandes optimisées
const commands = [
  createCardListCommand(
    "add_cards_to_offer",
    "Ajoute une liste de cartes à donner",
    false
  ),
  createCardListCommand(
    "add_cards_wanted",
    "Ajoute une liste de cartes recherchées",
    false
  ),
  createCardListCommand(
    "remove_cards_to_offer",
    "Retire une liste de cartes à donner",
    false
  ),
  createCardListCommand(
    "remove_cards_wanted",
    "Retire une liste de cartes recherchées",
    false
  ),
  new SlashCommandBuilder()
    .setName("show_cards_to_offer")
    .setDescription("Affiche la liste des cartes à donner")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Nom d'utilisateur")
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName("show_cards_wanted")
    .setDescription("Affiche la liste des cartes recherchées")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Nom d'utilisateur")
        .setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Réinitialise ta collection de cartes"),
  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Permet de se créer un compte"),
  new SlashCommandBuilder()
    .setName("delete_account")
    .setDescription("Suppression de votre compte"),
  new SlashCommandBuilder()
    .setName("showcard")
    .setDescription("Affiche une carte de ta collection")
    .addStringOption((option) =>
      option
        .setName("search")
        .setDescription("L'ID de la carte")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName("users")
    .setDescription("Récupère la liste des utilisateurs"),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche l'aide"),
];

module.exports = commands;
