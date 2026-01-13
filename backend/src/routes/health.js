const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export "router" diretamente (compatível com app.use(..., require('./health')))
// e também como propriedade para compatibilidade com imports do tipo { healthRouter }.
module.exports = router;
module.exports.healthRouter = router;
