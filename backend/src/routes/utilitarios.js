// ============================================================================
//  Rotas UTILITARIAS que concentram algumas injecoes/redirecionamentos.
//   [WSTG-CLNT-04] Open Redirect       -> GET  /api/util/redirect?url=
//   [WSTG-INPV-18] SSTI (Server-Side Template Injection) -> POST /api/util/template
//   [WSTG-INPV-04] HTTP Parameter Pollution (demo)        -> GET  /api/util/hpp
// ============================================================================
const express = require('express');
const router = express.Router();
const ejs = require('ejs');

// --- Open Redirect -----------------------------------------------------------
router.get('/redirect', (req, res) => {
  const url = req.query.url || '/';
  switch (req.nivel) {
    case 'high':
      // Correto: so aceita caminho relativo interno (comeca com "/", sem "//").
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) return res.redirect(url);
      return res.status(400).json({ erro: 'redirect externo bloqueado' });
    case 'medium':
      // "Protecao" fraca: basta a URL conter "vulnshop". BYPASS: http://evil.com/vulnshop
      if (String(url).includes('vulnshop')) return res.redirect(url);
      return res.status(400).json({ erro: 'bloqueado' });
    case 'low':
    default:
      // Redireciona para QUALQUER lugar (?url=https://site-malicioso).
      return res.redirect(url);
  }
});

// --- SSTI --------------------------------------------------------------------
router.post('/template', (req, res) => {
  const { template = '' } = req.body || {};
  const dados = { usuario: req.usuario ? req.usuario.usuario : 'visitante', loja: 'VulnShop' };
  try {
    switch (req.nivel) {
      case 'high':
        // Correto: template FIXO no servidor; a entrada do usuario e apenas DADO.
        return res.json({ render: ejs.render('Ola <%= nome %>, bem-vindo(a) a <%= loja %>!',
          { nome: String(template).slice(0, 60), loja: dados.loja }) });
      case 'medium':
        // Blacklist de palavras perigosas — contornavel (ex.: montar strings,
        // usar this.constructor, notacao alternativa...).
        if (/process|require|global|child_process|constructor|mainModule/i.test(template))
          return res.status(400).json({ erro: 'palavra bloqueada' });
        return res.json({ render: ejs.render(template, dados) });
      case 'low':
      default:
        // [WSTG-INPV-18] SSTI cru: renderiza o template enviado pelo usuario.
        //  Teste inicial:  <%= 7*7 %>  -> 49
        //  RCE:  <%= global.process.mainModule.require('child_process').execSync('whoami') %>
        return res.json({ render: ejs.render(template, dados) });
    }
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// --- HTTP Parameter Pollution (demonstracao) ---------------------------------
router.get('/hpp', (req, res) => {
  // Com ?cor=a&cor=b o Express entrega req.query.cor como array ['a','b'].
  res.json({
    recebido: req.query.cor,
    tipo: Array.isArray(req.query.cor) ? 'array' : 'string',
    nota: 'Parametros duplicados mudam tipo/valor e podem furar validacoes que so olham a 1a ocorrencia.'
  });
});

module.exports = router;
