// ============================================================================
//  Rota do seletor de nivel de seguranca.
//   GET  /api/nivel        -> retorna o nivel atual
//   POST /api/nivel {nivel} -> grava o cookie que define o nivel
// ============================================================================
const express = require('express');
const router = express.Router();
const { NIVEIS } = require('../middleware/nivelSeguranca');

router.get('/', (req, res) => {
  res.json({ nivel: req.nivel, niveis: NIVEIS });
});

router.post('/', (req, res) => {
  const { nivel } = req.body || {};
  if (!NIVEIS.includes(nivel)) {
    return res.status(400).json({ erro: 'nivel invalido', niveis: NIVEIS });
  }
  // Observacao didatica: este cookie e proposital e intencionalmente "solto"
  // (sem HttpOnly) para que voce possa inspeciona-lo/troca-lo pelo DevTools
  // durante os exercicios. Atributos inseguros de cookie de SESSAO serao
  // explorados na Fase 1 (WSTG-SESS-02).
  res.cookie('vulnshop_nivel', nivel, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });
  res.json({ ok: true, nivel });
});

module.exports = router;
