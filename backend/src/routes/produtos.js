// ============================================================================
//  Rotas de PRODUTOS (catalogo + busca).
//   [WSTG-INPV-05] SQL Injection na busca
//   [WSTG-INPV-01] XSS Refletido (o termo pesquisado volta e e renderizado)
// ============================================================================
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/produtos — catalogo completo.
router.get('/', async (req, res, next) => {
  try {
    const [linhas] = await pool.query('SELECT * FROM produtos ORDER BY id');
    res.json(linhas);
  } catch (e) { next(e); }
});

// GET /api/produtos/busca?q=...  (precisa vir ANTES de /:id)
router.get('/busca', async (req, res, next) => {
  try {
    const q = req.query.q != null ? String(req.query.q) : '';
    let resultados;
    switch (req.nivel) {
      case 'high': {
        // [WSTG-INPV-05] CORRIGIDO: prepared statement com LIKE.
        const like = `%${q}%`;
        const [r] = await pool.execute(
          'SELECT * FROM produtos WHERE nome LIKE ? OR descricao LIKE ?', [like, like]);
        resultados = r; break;
      }
      case 'medium': {
        // Blacklist fraca (remove aspas). Ainda concatena -> contornavel.
        const s = q.replace(/'/g, '');
        const [r] = await pool.query(
          `SELECT * FROM produtos WHERE nome LIKE '%${s}%' OR descricao LIKE '%${s}%'`);
        resultados = r; break;
      }
      case 'low':
      default: {
        // [WSTG-INPV-05] SQLi crua. Ex. de payload (produtos tem 8 colunas):
        //  x%' UNION SELECT id,usuario,senha,papel,email,1,1,NOW() FROM usuarios --
        const [r] = await pool.query(
          `SELECT * FROM produtos WHERE nome LIKE '%${q}%' OR descricao LIKE '%${q}%'`);
        resultados = r; break;
      }
    }
    // Devolvemos o termo pesquisado. Se o front renderizar sem escapar (Low/Medium)
    // -> XSS refletido. Ex.: q = <img src=x onerror=alert(document.cookie)>
    res.json({ termo: q, total: resultados.length, resultados });
  } catch (e) { next(e); }
});

// GET /api/produtos/:id — detalhe.
router.get('/:id', async (req, res, next) => {
  try {
    const [linhas] = await pool.execute('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    if (!linhas.length) return res.status(404).json({ erro: 'produto nao encontrado' });
    res.json(linhas[0]);
  } catch (e) { next(e); }
});

module.exports = router;
