// ============================================================================
//  VulnShop — servidor Express (BACKEND)
//  ⚠️  AMBIENTE DE TREINO DELIBERADAMENTE VULNERAVEL.
//      NAO EXPONHA NA INTERNET. Rode apenas em localhost / rede docker isolada.
// ============================================================================
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cookieParser = require('cookie-parser');

const { testarConexao } = require('./db');
const { nivelSeguranca } = require('./middleware/nivelSeguranca');
const { sessaoMiddleware } = require('./middleware/sessao');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONT = process.env.FRONTEND_ORIGIN || 'http://localhost:5444';

// ---------------------------------------------------------------------------
// [WSTG-INFO-02] Fingerprint verboso do servidor — nivel: Low
// Expomos de proposito headers reveladores. Correcao (High): remover.
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Express/4.19 (VulnShop)');
  res.setHeader('Server', 'VulnShop/0.2.0 (Node ' + process.version + ')');
  next();
});

// Parsers e cookies primeiro (o nivel e o restante dependem deles).
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(nivelSeguranca);   // define req.nivel (low/medium/high)

// ---------------------------------------------------------------------------
// [WSTG-CLNT-07] CORS mal configurado — por nivel.
//  Low/Medium: refletem QUALQUER Origin e ainda permitem credenciais
//  (Allow-Credentials: true) -> um site malicioso consegue ler respostas
//  autenticadas da vitima. High: restringe a origem conhecida.
//
//  IMPORTANTE: este bloco precisa rodar ANTES de qualquer middleware que possa
//  encerrar a resposta (CSRF, verb tampering, TRACE, handler de erro). Caso
//  contrario, uma rejeicao antecipada (ex.: 403 do CSRF no High) voltaria SEM
//  os cabecalhos de CORS e o navegador mascararia o status real como
//  "CORS Missing Allow Origin". So depende de req.nivel (logo, vem apos o
//  nivelSeguranca). O preflight OPTIONS tambem e respondido aqui.
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (req.nivel === 'high') {
    if (origin === FRONT) {
      res.setHeader('Access-Control-Allow-Origin', FRONT);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // reflete a origem recebida (equivalente pratico a "*", porem com credenciais)
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,TRACE');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(sessaoMiddleware); // define req.usuario a partir do cookie sid

// [WSTG-INPV-03] Method override inseguro (Low/Medium): troca o verbo HTTP via
// header X-HTTP-Method-Override (ex.: POST -> PUT) para furar checagens que
// dependem do metodo. Em High, ignorado.
app.use((req, res, next) => {
  if (req.nivel !== 'high') {
    const ov = req.headers['x-http-method-override'];
    if (ov) req.method = String(ov).toUpperCase();
  }
  next();
});

// [WSTG-SESS-05] Protecao CSRF — ativa apenas no nivel High.
// (O CORS ja rodou la em cima, logo apos o nivelSeguranca, para que uma
//  rejeicao 403 aqui ainda carregue os cabecalhos Access-Control-*.)
app.use(require('./middleware/csrf').csrf);

// ---------------------------------------------------------------------------
// Headers de seguranca: presentes SO no nivel High.
//  [WSTG-CLNT-09] Clickjacking (falta X-Frame-Options)
//  [WSTG-CONF-07] HSTS ausente
//  Falta X-Content-Type-Options / CSP em Low/Medium.
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  if (req.nivel === 'high') {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Referrer-Policy', 'no-referrer');
  }
  next();
});

// ---------------------------------------------------------------------------
// [WSTG-CONF-06 / INPV-03] Metodos HTTP perigosos habilitados.
//  TRACE ecoa a requisicao (Cross-Site Tracing). Em High, bloqueamos TRACE.
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  if (req.method === 'TRACE') {
    if (req.nivel === 'high') return res.status(405).json({ erro: 'metodo nao permitido' });
    res.type('message/http');
    return res.send(`TRACE ${req.originalUrl} HTTP/1.1\n` +
      Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\n'));
  }
  next();
});

// ---------------------------------------------------------------------------
// Arquivos estaticos:
//  - /uploads     -> avatares enviados (um .svg/.html malicioso executa aqui!)
//  - /            -> public (robots.txt, sitemap.xml, config.js.bak)
// ---------------------------------------------------------------------------
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use(express.static(path.resolve(__dirname, '../public')));

// ---------------------------------------------------------------------------
// Saude
// ---------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  res.json({
    ok: true, servico: 'vulnshop-backend', versao: '0.2.0',
    nivel_atual: req.nivel,
    logado_como: req.usuario ? req.usuario.usuario : null,
    banco: (await testarConexao()) ? 'conectado' : 'indisponivel',
    aviso: 'AMBIENTE DE TREINO — NAO EXPONHA NA INTERNET'
  });
});

// ---------------------------------------------------------------------------
// Rotas por area funcional
// ---------------------------------------------------------------------------
app.use('/api/nivel', require('./routes/nivel'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/avaliacoes', require('./routes/avaliacoes'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/contato', require('./routes/contato'));
app.use('/api/arquivos', require('./routes/arquivos'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/util', require('./routes/utilitarios'));
app.use('/api/injecoes', require('./routes/injecoes')); // [WSTG-INPV-08/09] SSI/XPath
app.use('/api/verbo', require('./routes/verbo'));        // [WSTG-INPV-03] verb tampering
app.use('/api', require('./routes/checkout'));   // /api/checkout e /api/cupom/:codigo
app.use('/graphql', require('./routes/graphql')); // [WSTG-APIT-01]
app.use('/api/console', require('./routes/console')); // ⚠️ shell de treino (so localhost)

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'rota nao encontrada', caminho: req.originalUrl });
});

// ---------------------------------------------------------------------------
// [WSTG-ERRH-01/02] Tratamento de erro + stack trace vazando.
//  Low/Medium: devolvem message + stack (vaza caminhos, SQL, versoes).
//  High: mensagem generica; o detalhe vai so para o log do servidor.
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[ERRO]', err);
  if (req.nivel === 'high') {
    return res.status(err.status || 500).json({ erro: 'erro interno' });
  }
  res.status(err.status || 500).json({ erro: 'erro interno', detalhe: err.message, stack: err.stack });
});

const servidor = app.listen(PORT, () => {
  console.log('==================================================');
  console.log('  VulnShop backend em http://localhost:' + PORT);
  console.log('  Nivel padrao: low  |  Health: /api/health');
  console.log('  Terminal interativo (⚠️ local): ws /api/console/pty');
  console.log('  ⚠️  AMBIENTE DE TREINO — NAO EXPONHA NA INTERNET');
  console.log('==================================================');
});

// Terminal interativo (PTY real) sobre WebSocket — so aceita localhost.
require('./pty').attachPtyConsole(servidor);
