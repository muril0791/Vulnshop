// ============================================================================
//  Injeções "extras" que estavam conceituais e viraram demonstráveis.
//   [WSTG-INPV-08] SSI Injection  -> POST /api/injecoes/ssi
//   [WSTG-INPV-09] XPath Injection -> POST /api/injecoes/xpath
// ============================================================================
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { execSync } = require('child_process');
const { DOMParser } = require('@xmldom/xmldom');
const xpath = require('xpath');

// --- SSI Injection -----------------------------------------------------------
// Processa diretivas de Server Side Includes vindas do usuário.
router.post('/ssi', (req, res) => {
  const { texto = '' } = req.body || {};
  if (req.nivel === 'high') {
    // Correto: tratar como texto (escapar), sem processar diretiva alguma.
    return res.json({ render: String(texto).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;')) });
  }
  let out = String(texto);
  // <!--#echo var="NOME" -->  (vaza variáveis de ambiente)
  out = out.replace(/<!--#echo var="(\w+)"-->/g, (_, v) => process.env[v] || ('$' + v));
  // <!--#include file="CAMINHO" -->  (LFI — lê arquivos do servidor)
  out = out.replace(/<!--#include file="([^"]+)"-->/g, (_, f) => {
    try { return fs.readFileSync(f, 'utf8'); } catch (e) { return '[erro: ' + e.message + ']'; }
  });
  // <!--#exec cmd="COMANDO" -->  (RCE) — só em Low.
  if (req.nivel === 'low') {
    out = out.replace(/<!--#exec cmd="([^"]+)"-->/g, (_, c) => {
      try { return execSync(c).toString(); } catch (e) { return '[erro: ' + e.message + ']'; }
    });
  }
  res.json({ render: out });
});

// --- XPath Injection ---------------------------------------------------------
// "Login" contra um documento XML (simulando um back-end que usa XPath).
const XML_USUARIOS = `<?xml version="1.0"?>
<usuarios>
  <usuario><nome>admin</nome><senha>admin</senha><papel>admin</papel></usuario>
  <usuario><nome>alice</nome><senha>alice123</senha><papel>cliente</papel></usuario>
  <usuario><nome>bob</nome><senha>bob123</senha><papel>cliente</papel></usuario>
</usuarios>`;

function literalXPath(s) {
  // Escapa a string para usar como literal seguro em XPath (usado no High).
  if (!s.includes("'")) return `'${s}'`;
  if (!s.includes('"')) return `"${s}"`;
  return "concat('" + s.replace(/'/g, `', "'", '`) + "')";
}

router.post('/xpath', (req, res) => {
  const { usuario = '', senha = '' } = req.body || {};
  const doc = new DOMParser().parseFromString(XML_USUARIOS, 'text/xml');
  try {
    if (req.nivel === 'high') {
      // Correto: entradas viram literais escapados (não alteram a estrutura).
      const expr = `//usuario[nome=${literalXPath(usuario)} and senha=${literalXPath(senha)}]`;
      const nodes = xpath.select(expr, doc);
      return res.json({ autenticado: nodes.length > 0 });
    }
    // [WSTG-INPV-09] Low/Medium: concatena -> injeção. Payload no usuario:
    //   ' or '1'='1     (autentica como o primeiro usuário = admin)
    const expr = `//usuario[nome='${usuario}' and senha='${senha}']`;
    const nodes = xpath.select(expr, doc);
    const papel = nodes.length ? xpath.select('string(papel)', nodes[0]) : null;
    res.json({ expr, autenticado: nodes.length > 0, papel });
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

module.exports = router;
