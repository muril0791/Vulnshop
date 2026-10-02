// ============================================================================
//  CHECKOUT e CUPONS — regras de negocio (Business Logic).
//   [WSTG-BUSL-01] Validacao de negocio (quantidade/preco negativos)
//   [WSTG-BUSL-03] Checagem de integridade (confiar no preco vindo do cliente)
//   [WSTG-BUSL-05] Limite de uso de funcao (reusar cupom infinitas vezes)
//   [WSTG-BUSL-06] Burlar o fluxo (finalizar sem login/endereco)
// ============================================================================
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/cupom/:codigo — consulta um cupom (usada pelo carrinho).
router.get('/cupom/:codigo', async (req, res, next) => {
  try {
    const [c] = await pool.execute(
      'SELECT codigo, desconto_percentual, ativo, usos FROM cupons WHERE codigo = ?', [req.params.codigo]);
    if (!c.length || !c[0].ativo) return res.status(404).json({ erro: 'cupom invalido' });
    res.json(c[0]);
  } catch (e) { next(e); }
});

// POST /api/checkout  { itens:[{produto_id,nome,preco,quantidade}], cupom, endereco }
router.post('/checkout', async (req, res, next) => {
  try {
    const { itens = [], cupom = null, endereco = '' } = req.body || {};
    const nivel = req.nivel;

    // [WSTG-BUSL-06] Em High exige login + endereco (nao da pra pular etapas).
    if (nivel === 'high' && !req.usuario) return res.status(401).json({ erro: 'faca login para finalizar' });
    if (nivel === 'high' && !endereco) return res.status(400).json({ erro: 'endereco obrigatorio' });

    let subtotal = 0;
    const itensFinal = [];
    for (const it of itens) {
      let preco, nome;
      if (nivel === 'low') {
        // [WSTG-BUSL-03] Confia no PRECO enviado pelo cliente (adulteravel no DevTools).
        preco = Number(it.preco);
        nome = it.nome;
      } else {
        // Medium/High: recalculam o preco pelo BANCO (fonte da verdade).
        const [p] = await pool.execute('SELECT nome, preco FROM produtos WHERE id = ?', [it.produto_id]);
        if (!p.length) continue;
        preco = Number(p[0].preco);
        nome = p[0].nome;
      }
      let qtd = Number(it.quantidade);
      // [WSTG-BUSL-01] Em High, quantidade tem que ser inteiro positivo.
      if (nivel === 'high' && (!Number.isInteger(qtd) || qtd <= 0)) {
        return res.status(400).json({ erro: 'quantidade invalida' });
      }
      // Low/Medium: aceitam quantidade negativa -> o total pode virar credito.
      subtotal += preco * qtd;
      itensFinal.push({ produto_id: it.produto_id, nome, quantidade: qtd, preco_unitario: preco });
    }

    // Cupom
    let desconto = 0, cupomAplicado = null;
    if (cupom) {
      const [c] = await pool.execute('SELECT * FROM cupons WHERE codigo = ? AND ativo = 1', [cupom]);
      if (c.length) {
        cupomAplicado = c[0].codigo;
        // [WSTG-BUSL-05] Em High cada cupom so pode ser usado 1x (simplificado,
        // global). Em Low/Medium nao ha limite -> reuse a vontade.
        if (nivel === 'high' && c[0].usos >= 1) {
          return res.status(400).json({ erro: 'cupom ja utilizado' });
        }
        desconto = subtotal * (c[0].desconto_percentual / 100);
        await pool.execute('UPDATE cupons SET usos = usos + 1 WHERE id = ?', [c[0].id]);
      }
    }

    let total = subtotal - desconto;
    if (nivel === 'high' && total < 0) total = 0;

    // Registra o pedido (se houver usuario logado).
    let pedidoId = null;
    if (req.usuario) {
      const [r] = await pool.execute(
        'INSERT INTO pedidos (usuario_id, total, status, endereco) VALUES (?,?,?,?)',
        [req.usuario.id, total, 'pago', endereco]);
      pedidoId = r.insertId;
      for (const it of itensFinal) {
        await pool.execute(
          'INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario) VALUES (?,?,?,?,?)',
          [pedidoId, it.produto_id, it.nome, it.quantidade, it.preco_unitario]);
      }
    }

    res.json({
      ok: true, subtotal, desconto, total, cupom: cupomAplicado, pedido_id: pedidoId,
      aviso: nivel !== 'high' ? 'regras de negocio ausentes (preco/quantidade/cupom podem ser abusados)' : undefined
    });
  } catch (e) { next(e); }
});

module.exports = router;
