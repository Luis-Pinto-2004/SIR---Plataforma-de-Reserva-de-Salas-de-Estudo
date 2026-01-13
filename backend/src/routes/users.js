const express = require('express');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Endpoint simples para obter o utilizador autenticado.
// Mantém compatibilidade caso o frontend (ou testes) use /api/users/me.
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
