const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import des routes
const cardsRoutes = require("./routes/cards");
const usersRoutes = require("./routes/users");
// const matchingsRoutes = require("./routes/matchings");
const assetsRoutes = require("./assets/assets");

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/cards", cardsRoutes);
app.use("/users", usersRoutes);
app.use("/assets", assetsRoutes);

// app.use("/matchings", matchingsRoutes);

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
