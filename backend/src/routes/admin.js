// ============================================================================
//  PAINEL ADMINISTRATIVO (Fase 4). Todas as rotas passam por requerAdmin, que
//  em Low nao checa nada e em Medium aceita bypass por header (ver autorizacao.js).
//   [WSTG-CRYP-03/04] listagem de usuarios expoe senha em texto puro + token MD5
//   [WSTG-INPV-12] Command Injection (ping)
//   [WSTG-INPV-11] Code Injection (calculadora com eval)
//   [WSTG-CONF-05] Interface administrativa exposta/adivinhavel
// ============================================================================
const express = require('express');
const router = express.Router();
const { exec, execFile } = require('child_process');
const { pool } = require('../db');
const { requerAdmin } = require('../middleware/autorizacao');

// --- Listagens sensiveis -----------------------------------------------------
router.get('/usuarios', requerAdmin, async (req, res, next) => {
  try {
    // [WSTG-CRYP-03/04] devolve senha (texto puro) e token_lembrar (MD5). Como
    // em Low nao ha checagem de admin, QUALQUER visitante ve tudo isso.
    const [r] = await pool.query('SELECT id,nome,email,usuario,senha,papel,token_lembrar,avatar FROM usuarios');
    res.json(r);
  } catch (e) { next(e); }
});
router.get('/pedidos', requerAdmin, async (req, res, next) => {
  try { const [r] = await pool.query('SELECT * FROM pedidos ORDER BY id DESC'); res.json(r); }
  catch (e) { next(e); }
});
router.get('/mensagens', requerAdmin, async (req, res, next) => {
  try { const [r] = await pool.query('SELECT * FROM mensagens_contato ORDER BY id DESC'); res.json(r); }
  catch (e) { next(e); }
});

// --- Command Injection (INPV-12): "checar status" de um host via ping ---------
router.post('/ping', requerAdmin, (req, res) => {
  const { host = '' } = req.body || {};
  const win = process.platform === 'win32';
  switch (req.nivel) {
    case 'high': {
      // Correto: valida o host e usa execFile (SEM shell) passando argumentos.
      if (!/^[a-zA-Z0-9.\-]+$/.test(host)) return res.status(400).json({ erro: 'host invalido' });
      const args = win ? ['-n', '1', host] : ['-c', '1', host];
      return execFile('ping', args, (e, out, errout) => res.json({ saida: out || errout || (e && e.message) }));
    }
    case 'medium': {
      // Blacklist parcial: remove ; & | . Ainda contornavel dependendo do SO.
      const limpo = host.replace(/[;&|]/g, '');
      const cmd = (win ? 'ping -n 1 ' : 'ping -c 1 ') + limpo;
      return exec(cmd, (e, out, errout) => res.json({ cmd, saida: out || errout || (e && e.message) }));
    }
    case 'low':
    default: {
      // [WSTG-INPV-12] concatena no shell. Payloads:
      //  Windows: host = 127.0.0.1 & whoami        (ou  & dir)
      //  Linux:   host = 127.0.0.1; id             (ou  ; cat /etc/passwd)
      const cmd = (win ? 'ping -n 1 ' : 'ping -c 1 ') + host;
      return exec(cmd, (e, out, errout) => res.json({ cmd, saida: out || errout || (e && e.message) }));
    }
  }
});

// --- Code Injection (INPV-11): "calculadora de desconto" com eval ------------
router.post('/calcular', requerAdmin, (req, res) => {
  const { expr = '' } = req.body || {};
  switch (req.nivel) {
    case 'high':
      // Correto: nunca eval. So aceita numeros/operadores e avalia isolado.
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) return res.status(400).json({ erro: 'expressao invalida' });
      try { return res.json({ resultado: Function('"use strict";return (' + expr + ')')() }); }
      catch { return res.status(400).json({ erro: 'expressao invalida' }); }
    case 'medium':
      if (/require|process|global|child_process|import|constructor/i.test(expr))
        return res.status(400).json({ erro: 'palavra bloqueada' });
      try { return res.json({ resultado: eval(expr) }); } catch (e) { return res.status(400).json({ erro: e.message }); }
    case 'low':
    default:
      // [WSTG-INPV-11] eval na entrada crua. Payload de RCE:
      //  global.process.mainModule.require('child_process').execSync('whoami').toString()
      try { return res.json({ resultado: eval(expr) }); } catch (e) { return res.status(400).json({ erro: e.message }); }
  }
});

// --- CRUD basico (gestao) — tambem sob a mesma autorizacao falha -------------
router.post('/produtos', requerAdmin, async (req, res, next) => {
  try {
    const { nome, descricao, preco, categoria, estoque = 0, imagem = '' } = req.body || {};
    const [r] = await pool.execute(
      'INSERT INTO produtos (nome,descricao,preco,categoria,estoque,imagem) VALUES (?,?,?,?,?,?)',
      [nome, descricao, preco, categoria, estoque, imagem]);
    res.json({ ok: true, id: r.insertId });
  } catch (e) { next(e); }
});
router.put('/produtos/:id', requerAdmin, async (req, res, next) => {
  try {
    const { nome, descricao, preco, categoria, estoque, imagem } = req.body || {};
    await pool.execute(
      'UPDATE produtos SET nome=?,descricao=?,preco=?,categoria=?,estoque=?,imagem=? WHERE id=?',
      [nome, descricao, preco, categoria, estoque, imagem, req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
router.delete('/produtos/:id', requerAdmin, async (req, res, next) => {
  try { await pool.execute('DELETE FROM produtos WHERE id=?', [req.params.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});
router.delete('/usuarios/:id', requerAdmin, async (req, res, next) => {
  try { await pool.execute('DELETE FROM usuarios WHERE id=?', [req.params.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});

module.exports = router;
