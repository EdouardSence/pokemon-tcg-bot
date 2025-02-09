const errorHandler = (res, error, statusCode = 500) => {
    console.error(error);
    res.status(statusCode).json({ error: error.message || "Erreur serveur", code: error.code });
  };
  
  module.exports = errorHandler;
  