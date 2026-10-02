// ============================================================================
//  Rota de CONTATO — inclui um "preview de URL" que o SERVIDOR busca.
//   [WSTG-INPV-19] SSRF: o backend faz a requisicao para a URL que o usuario
//   informou. Isso permite acessar servicos internos (ex.: http://localhost:4000
//   /api/admin/usuarios), o metadata de nuvem (169.254.169.254), etc.
// ============================================================================
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

function ehInternoOuPrivado(host) {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|::1|\[::1\])/i.test(host);
}

// Busca a URL com timeout (para nao pendurar em host interno que nao responde).
async function buscar(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const resp = await fetch(url, { redirect: 'follow', signal: ctrl.signal });
    const texto = await resp.text();
    return { status: resp.status, tamanho: texto.length, trecho: texto.slice(0, 2000) };
  } catch (e) {
    return { erro: e.message };
  } finally { clearTimeout(t); }
}

router.post('/', async (req, res, next) => {
  try {
    const { nome = '', email = '', mensagem = '', url_preview = '' } = req.body || {};
    await pool.execute(
      'INSERT INTO mensagens_contato (nome, email, mensagem, url_avatar) VALUES (?,?,?,?)',
      [nome, email, mensagem, url_preview]);

    let preview = null;
    if (url_preview) {
      switch (req.nivel) {
        case 'high': {
          // Correto: valida esquema e BLOQUEIA destinos internos/privados.
          let u; try { u = new URL(url_preview); } catch { return res.status(400).json({ erro: 'url invalida' }); }
          if (!['http:', 'https:'].includes(u.protocol)) return res.status(400).json({ erro: 'protocolo nao permitido' });
          if (ehInternoOuPrivado(u.hostname)) return res.status(400).json({ erro: 'destino interno bloqueado' });
          preview = await buscar(url_preview);
          break;
        }
        case 'medium': {
          // Blacklist textual fraca. BYPASS: 127.1, 0.0.0.0, [::1], IP decimal,
          // um dominio que resolve p/ 127.0.0.1, ou um redirect externo -> interno.
          if (/localhost|127\.0\.0\.1/i.test(url_preview)) return res.status(400).json({ erro: 'destino bloqueado' });
          preview = await buscar(url_preview);
          break;
        }
        case 'low':
        default:
          // Busca QUALQUER coisa, sem validar nada.
          preview = await buscar(url_preview);
          break;
      }
    }
    res.json({ ok: true, preview });
  } catch (e) { next(e); }
});

module.exports = router;
