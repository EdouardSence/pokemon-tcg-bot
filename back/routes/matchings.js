const express = require("express");
const router = express.Router();
const errorHandler = require("../utils/errorHandler");

const {
  getAllMatchings,
  deleteMatching,
  getMatchingById,
  updateMatchingSuccess,
  updateMatchingError,
  updateMatchingValidateUser1,
  updateMatchingValidateUser2,
  updateMatchingMessages,
} = require("../services/matchingsService.js");

router.get("/", async (req, res) => {
  try {
    const matchings = await getAllMatchings();
    res.json(matchings);
  } catch (error) {
    errorHandler(res, error);
  }
});

// Récupérer un matching par son ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const matching = await getMatchingById(id);
    if (!matching) {
      return res.status(404).json({ error: "Matching non trouvé" });
    }
    res.json(matching);
  } catch (error) {
    errorHandler(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const matching = await deleteMatching(id);
    if (!matching) {
      return res.status(404).json({ error: "Matching non trouvé" });
    }
    res.json(matching);
  } catch (error) {
    errorHandler(res, error);
  }
});

// mettre user1_valide_trade à true ou false
router.put("/:id/user1", async (req, res) => {
  try {
    const { id } = req.params;
    const { validated } = req.body;
    const matching = await updateMatchingValidateUser1(id, validated);
    if (!matching) {
      return res.status(404).json({ error: "Matching non trouvé" });
    }
    res.json(matching);
  } catch (error) {
    errorHandler(res, error);
  }
});
// mettre user2_valide_trade à true ou false
router.put("/:id/user2", async (req, res) => {
  try {
    const { id } = req.params;
    const { validated } = req.body;
    console.log("validated", validated);
    const matching = await updateMatchingValidateUser2(id, validated);
    if (!matching) {
      return res.status(404).json({ error: "Matching non trouvé" });
    }
    res.json(matching);
  } catch (error) {
    errorHandler(res, error);
  }
});
router.put("/:id/success", async (req, res) => {
  try {
    const { id } = req.params;
    const matching = await updateMatchingSuccess(id);
    if (!matching) {
      return res.status(404).json({ error: "Matching non trouvé" });
    }
    res.json(matching);
  } catch (error) {
    errorHandler(res, error);
  }
});

router.put("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { error_raison } = req.body;
    const matching = await updateMatchingError(id, error_raison);
    if (!matching) {
      return res.status(404).json({ error: "Matching non trouvé" });
    }
    res.json(matching);
  } catch (error) {
    errorHandler(res, error);
  }
});

router.put("/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { user1_message_id, user2_message_id } = req.body;
    const matching = await updateMatchingMessages(
      id,
      user1_message_id,
      user2_message_id
    );
    if (!matching) {
      return res.status(404).json({ error: "Matching non trouvé" });
    }
    res.json(matching);
  } catch (error) {
    errorHandler(res, error);
  }
});

module.exports = router;
