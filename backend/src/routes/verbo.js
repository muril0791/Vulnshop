// ============================================================================
//  [WSTG-INPV-03] HTTP Verb Tampering.
//  A autorização é checada em ALGUNS métodos mas "esquecida" em outros.
//   - POST /api/verbo/promover/:id  -> protegido (requerAdmin)
//   - PUT  /api/verbo/promover/:id  -> em Low/Medium NÃO é protegido (bypass!)
//   - Em High, todos os métodos exigem admin.
//  Combine com o `X-HTTP-Method-Override` (server.js) para transformar um POST
//  em PUT e furar a checagem.
// ============================================================================
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requerAdmin } = require('../middleware/autorizacao');

async function promover(req, res, next) {
  try {
    await pool.execute("UPDATE usuarios SET papel = 'admin' WHERE id = ?", [req.params.id]);
    res.json({ ok: true, promovido_id: req.params.id, via_metodo: req.method });
  } catch (e) { next(e); }
}

// GET e POST são protegidos.
router.get('/promover/:id', requerAdmin, (req, res) =>
  res.json({ dica: 'Use POST (protegido) — ou tente PUT, que em Low/Medium NAO checa autorizacao.' }));
router.post('/promover/:id', requerAdmin, promover);

// PUT: só protege no High (em Low/Medium passa direto = verb tampering).
router.put('/promover/:id', (req, res, next) => {
  if (req.nivel === 'high') return requerAdmin(req, res, next);
  next();
}, promover);

module.exports = router;
