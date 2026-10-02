// ============================================================================
//  Rotas de AVALIACOES de produto.
//   [WSTG-INPV-02] XSS Armazenado: o comentario e salvo e depois renderizado.
//   A defesa correta e no OUTPUT (escapar ao exibir) — ver o frontend, que em
//   Low/Medium usa dangerouslySetInnerHTML e em High mostra como texto.
// ============================================================================
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/avaliacoes/:produtoId
router.get('/:produtoId', async (req, res, next) => {
  try {
    const [r] = await pool.execute(
      'SELECT * FROM avaliacoes WHERE produto_id = ? ORDER BY id DESC', [req.params.produtoId]);
    res.json(r);
  } catch (e) { next(e); }
});

// POST /api/avaliacoes/:produtoId  { autor, nota, comentario }
router.post('/:produtoId', async (req, res, next) => {
  try {
    let { autor = 'Anonimo', nota = 5, comentario = '' } = req.body || {};

    if (req.nivel === 'medium') {
      // Blacklist ingenua: remove blocos <script>...</script>.
      // BYPASS classico: <img src=x onerror=alert(document.cookie)>
      comentario = String(comentario).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    }
    // Low e High salvam o texto como veio; quem decide a seguranca e a RENDERIZACAO.

    const usuarioId = req.usuario ? req.usuario.id : null;
    await pool.execute(
      'INSERT INTO avaliacoes (produto_id, usuario_id, autor, nota, comentario) VALUES (?,?,?,?,?)',
      [req.params.produtoId, usuarioId, autor, Number(nota) || 0, comentario]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
