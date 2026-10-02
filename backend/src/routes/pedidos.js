// ============================================================================
//  ROTAS DE PEDIDOS (Fase 1)
//   [WSTG-ATHZ-04] IDOR: ver pedido de outro usuario trocando o :id.
// ============================================================================
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requerLogin } = require('../middleware/autorizacao');

// GET /api/pedidos — lista os pedidos do usuario logado (isto e o correto).
router.get('/', requerLogin, async (req, res, next) => {
  try {
    const [rs] = await pool.execute(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC', [req.usuario.id]);
    res.json(rs);
  } catch (e) { next(e); }
});

// GET /api/pedidos/:id — detalhe do pedido.
router.get('/:id', requerLogin, async (req, res, next) => {
  try {
    const [rs] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (!rs.length) return res.status(404).json({ erro: 'pedido nao encontrado' });
    const pedido = rs[0];

    // A UNICA diferenca entre vulneravel e seguro e a checagem de DONO:
    if (req.nivel === 'high' && pedido.usuario_id !== req.usuario.id) {
      // Correto: o recurso existe, mas nao e seu -> 403 (idealmente 404 p/ nao vazar).
      return res.status(403).json({ erro: 'este pedido nao pertence a voce' });
    }
    // [WSTG-ATHZ-04] Low/Medium: NAO conferem o dono. Troque o :id na URL
    // (ex.: /api/pedidos/2) e voce ve o pedido de outra pessoa.
    const [itens] = await pool.execute('SELECT * FROM itens_pedido WHERE pedido_id = ?', [pedido.id]);
    res.json({ ...pedido, itens });
  } catch (e) { next(e); }
});

module.exports = router;
