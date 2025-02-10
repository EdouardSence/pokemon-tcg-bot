const express = require("express");
const router = express.Router();
const path = require('path');

// Servir le répertoire des images statiques
router.use('/', express.static(path.join(__dirname, 'cards')));

module.exports = router;
