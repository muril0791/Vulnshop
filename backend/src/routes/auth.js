// ============================================================================
//  ROTAS DE AUTENTICACAO E SESSAO (Fase 1) — deliberadamente vulneraveis.
//  Concentra varias tecnicas do WSTG:
//   INPV-05 SQLi no login | IDNT-04 enumeracao de usuarios | ATHN-02 creds padrao
//   ATHN-03 brute force | ATHN-05 "lembrar-me" previsivel | ATHN-07 senha fraca
//   ATHN-08 pergunta secreta | ATHN-09 reset previsivel | INPV-17 host header
//   SESS-02 cookie inseguro | SESS-03 fixation | SESS-04 vars de sessao
//   SESS-06 logout que nao invalida | SESS-07 sem timeout
// ============================================================================
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../db');
const { criarSessao, destruirSessao, sessoes } = require('../sessao');
const { tentativasLogin } = require('../estado');

// --- Helpers -----------------------------------------------------------------

// [WSTG-SESS-02] Atributos do cookie de sessao, por nivel.
function definirCookieSessao(res, sid, nivel) {
  switch (nivel) {
    case 'high':
      // Correto: HttpOnly (JS nao le -> resiste a roubo por XSS) e SameSite
      // estrito (resiste a CSRF). Secure exige HTTPS; em producao seria true.
      res.cookie('sid', sid, { httpOnly: true, sameSite: 'strict', secure: false, path: '/' });
      break;
    case 'medium':
      // Parcial: HttpOnly, porem sem SameSite -> ainda cai em CSRF.
      res.cookie('sid', sid, { httpOnly: true, path: '/' });
      break;
    case 'low':
    default:
      // Pessimo: sem HttpOnly (roubavel via document.cookie num XSS),
      // sem SameSite, sem Secure.
      res.cookie('sid', sid, { httpOnly: false, path: '/' });
      break;
  }
}

// [WSTG-ATHN-03] Controle (ou ausencia) de bloqueio por brute force.
function checarBloqueio(usuario, nivel) {
  if (nivel === 'low') return { bloqueado: false }; // Low: sem lockout nenhum
  const t = tentativasLogin.get(usuario);
  if (t && t.bloqueadoAte && Date.now() < t.bloqueadoAte) {
    return { bloqueado: true, segundos: Math.ceil((t.bloqueadoAte - Date.now()) / 1000) };
  }
  return { bloqueado: false };
}
function registrarFalha(usuario, nivel) {
  if (nivel === 'low') return; // Low nem conta as tentativas
  const t = tentativasLogin.get(usuario) || { qtd: 0 };
  t.qtd++;
  // Medium: limite ALTO e bloqueio CURTO (fraco). High: limite baixo, bloqueio longo.
  const limite = nivel === 'high' ? 5 : 20;
  const duracaoMs = nivel === 'high' ? 5 * 60 * 1000 : 15 * 1000;
  if (t.qtd >= limite) { t.bloqueadoAte = Date.now() + duracaoMs; t.qtd = 0; }
  tentativasLogin.set(usuario, t);
}
function limparFalhas(usuario) { tentativasLogin.delete(usuario); }

// --- POST /api/auth/login ----------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { usuario = '', senha = '', lembrar } = req.body || {};
    const nivel = req.nivel;

    const bloqueio = checarBloqueio(usuario, nivel);
    if (bloqueio.bloqueado) {
      return res.status(429).json({ erro: `bloqueado por brute force, tente em ${bloqueio.segundos}s` });
    }

    let linhas;
    switch (nivel) {
      case 'high': {
        // [WSTG-INPV-05] CORRIGIDO: prepared statement — dados != codigo SQL.
        // Obs: comparamos senha em texto puro porque o seed guarda assim
        // (ver WSTG-CRYP-03); o certo seria bcrypt/argon2 com verify.
        const [rs] = await pool.execute(
          'SELECT * FROM usuarios WHERE usuario = ? AND senha = ?', [usuario, senha]);
        linhas = rs;
        break;
      }
      case 'medium': {
        // Blacklist ingenua: remove aspas simples. CONTORNAVEL (ex.: payloads
        // sem aspas, ou explorando outros campos/codificacoes).
        const u = usuario.replace(/'/g, '');
        const p = senha.replace(/'/g, '');
        const [rs] = await pool.query(
          `SELECT * FROM usuarios WHERE usuario = '${u}' AND senha = '${p}'`);
        linhas = rs;
        break;
      }
      case 'low':
      default: {
        // [WSTG-INPV-05] SQL Injection CRUA: entrada concatenada direto no SQL.
        // Payloads: usuario =  admin' --      ou      ' OR '1'='1
        const [rs] = await pool.query(
          `SELECT * FROM usuarios WHERE usuario = '${usuario}' AND senha = '${senha}'`);
        linhas = rs;
        break;
      }
    }

    if (!linhas || linhas.length === 0) {
      registrarFalha(usuario, nivel);
      // [WSTG-IDNT-04] Enumeracao: Low/Medium diferenciam "nao existe" x "senha errada".
      if (nivel !== 'high') {
        const [existe] = await pool.execute('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
        return res.status(401).json({ erro: existe.length ? 'senha incorreta' : 'usuario nao encontrado' });
      }
      return res.status(401).json({ erro: 'credenciais invalidas' }); // High: generico
    }

    limparFalhas(usuario);
    const user = linhas[0];

    // [WSTG-SESS-03] Session fixation: em Low reaproveita o sid enviado pelo
    // cliente (nao regenera). Em Medium/High sempre gera um novo.
    const sid = criarSessao(user, nivel, nivel === 'low' ? req.sid : null);
    definirCookieSessao(res, sid, nivel);

    // [WSTG-ATHN-05] "lembrar-me": token previsivel (MD5 do usuario) em Low/Medium.
    if (lembrar) {
      if (nivel === 'high') {
        const forte = crypto.randomBytes(24).toString('hex');
        await pool.execute('UPDATE usuarios SET token_lembrar = ? WHERE id = ?', [forte, user.id]);
        res.cookie('lembrar', forte, { httpOnly: true, sameSite: 'strict', path: '/' });
      } else {
        res.cookie('lembrar', user.token_lembrar, { httpOnly: false, path: '/' });
      }
    }

    res.json({ ok: true, usuario: { id: user.id, usuario: user.usuario, nome: user.nome, papel: user.papel }, csrf: sessoes.get(sid) && sessoes.get(sid).csrf });
  } catch (e) { next(e); }
});

// --- POST /api/auth/continuar (auto-login pelo cookie "lembrar") --------------
router.post('/continuar', async (req, res, next) => {
  try {
    const lembrar = req.cookies && req.cookies.lembrar;
    if (!lembrar) return res.status(401).json({ erro: 'sem token de lembrar' });
    // [WSTG-ATHN-05] Confia cegamente no token do cookie. Como em Low/Medium ele
    // e MD5(usuario), um atacante forja o cookie e "vira" qualquer usuario.
    const [rs] = await pool.execute('SELECT * FROM usuarios WHERE token_lembrar = ?', [lembrar]);
    if (!rs.length) return res.status(401).json({ erro: 'token invalido' });
    const user = rs[0];
    const sid = criarSessao(user, req.nivel, null);
    definirCookieSessao(res, sid, req.nivel);
    res.json({ ok: true, usuario: { id: user.id, usuario: user.usuario, nome: user.nome, papel: user.papel }, csrf: sessoes.get(sid) && sessoes.get(sid).csrf });
  } catch (e) { next(e); }
});

// --- POST /api/auth/registro -------------------------------------------------
router.post('/registro', async (req, res, next) => {
  try {
    const { nome = '', email = '', usuario = '', senha = '',
            pergunta_secreta = null, resposta_secreta = null } = req.body || {};
    const nivel = req.nivel;

    if (nivel === 'high') {
      // [WSTG-IDNT-05] usuario | [WSTG-ATHN-07] politica de senha
      if (usuario.length < 4 || !/^[a-zA-Z0-9_]+$/.test(usuario))
        return res.status(400).json({ erro: 'usuario invalido (min 4, apenas letras/numeros/_)' });
      const forte = senha.length >= 8 && /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[0-9]/.test(senha);
      if (!forte)
        return res.status(400).json({ erro: 'senha fraca (min 8, com maiuscula, minuscula e numero)' });
      if (!email.includes('@'))
        return res.status(400).json({ erro: 'email invalido' });
    }
    // Low/Medium: aceita QUALQUER coisa (senha "123", usuario "a"...).

    const [existe] = await pool.execute('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    if (existe.length) return res.status(409).json({ erro: 'usuario ja existe' });

    // token de lembrar previsivel de fabrica (MD5 do usuario) — CRYP-04/ATHN-05.
    const tokenLembrar = crypto.createHash('md5').update(usuario).digest('hex');

    const [r] = await pool.execute(
      `INSERT INTO usuarios (nome,email,usuario,senha,papel,pergunta_secreta,resposta_secreta,token_lembrar)
       VALUES (?,?,?,?,?,?,?,?)`,
      [nome, email, usuario, senha, 'cliente', pergunta_secreta, resposta_secreta, tokenLembrar]);
    res.json({ ok: true, id: r.insertId });
  } catch (e) { next(e); }
});

// --- POST /api/auth/logout ---------------------------------------------------
router.post('/logout', (req, res) => {
  if (req.nivel === 'high') {
    // Correto: destroi a sessao no SERVIDOR (nao so o cookie no cliente).
    if (req.sid) destruirSessao(req.sid);
    res.clearCookie('sid');
    return res.json({ ok: true });
  }
  // [WSTG-SESS-06] Low/Medium: so limpa o cookie; a sessao no servidor CONTINUA
  // valida. Quem tiver capturado o sid antigo segue autenticado.
  res.clearCookie('sid');
  res.json({ ok: true, aviso: 'sessao do servidor NAO foi invalidada (SESS-06)' });
});

// --- GET /api/auth/eu (quem sou eu) ------------------------------------------
router.get('/eu', (req, res) => {
  if (!req.usuario) return res.status(401).json({ erro: 'nao autenticado' });
  // [WSTG-SESS-04] Low expoe variaveis internas da sessao (sid, objeto cru).
  if (req.nivel === 'low') return res.json({ usuario: req.usuario, sessao: req.sessao, sid: req.sid, csrf: req.sessao && req.sessao.csrf });
  res.json({ usuario: req.usuario, csrf: req.sessao && req.sessao.csrf });
});

// --- POST /api/auth/esqueci-senha (gera token de reset) ----------------------
router.post('/esqueci-senha', async (req, res, next) => {
  try {
    const { usuario = '' } = req.body || {};
    const nivel = req.nivel;
    const [rs] = await pool.execute('SELECT id, usuario FROM usuarios WHERE usuario = ?', [usuario]);
    if (!rs.length) {
      if (nivel === 'high') return res.json({ ok: true, msg: 'se o usuario existir, enviaremos instrucoes' });
      return res.status(404).json({ erro: 'usuario nao encontrado' }); // enumeracao de novo
    }
    const user = rs[0];
    let token;
    switch (nivel) {
      case 'high':  token = crypto.randomBytes(32).toString('hex'); break;      // imprevisivel
      case 'medium': token = Buffer.from('reset:' + user.id).toString('base64'); break; // adivinhavel
      case 'low':
      default:      token = String(user.id); break; // [WSTG-ATHN-09] o proprio ID!
    }
    await pool.execute(
      'INSERT INTO tokens_reset (usuario_id, token, expira_em, usado) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 1 HOUR),0)',
      [user.id, token]);

    // [WSTG-INPV-17] Host Header Injection: o link de reset e montado com o
    // header Host da requisicao. Se o atacante forja Host, o link (e o token)
    // vazam para o dominio dele quando a vitima clicar.
    const host = nivel === 'high' ? (process.env.APP_HOST || 'localhost:5173') : req.headers.host;
    const link = `http://${host}/resetar-senha?token=${token}&u=${user.usuario}`;
    // Nao enviamos e-mail real; devolvemos o link para fins de laboratorio.
    res.json({ ok: true, link, token_didatico: token });
  } catch (e) { next(e); }
});

// --- POST /api/auth/resetar-senha --------------------------------------------
router.post('/resetar-senha', async (req, res, next) => {
  try {
    const { token = '', nova_senha = '' } = req.body || {};
    const [rs] = await pool.execute(
      'SELECT id, usuario_id FROM tokens_reset WHERE token = ? AND usado = 0 AND expira_em > NOW()', [token]);
    if (!rs.length) return res.status(400).json({ erro: 'token invalido ou expirado' });
    await pool.execute('UPDATE usuarios SET senha = ? WHERE id = ?', [nova_senha, rs[0].usuario_id]);
    await pool.execute('UPDATE tokens_reset SET usado = 1 WHERE id = ?', [rs[0].id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// --- Pergunta secreta [WSTG-ATHN-08] -----------------------------------------
router.get('/pergunta-secreta', async (req, res, next) => {
  try {
    const { usuario = '' } = req.query;
    const [rs] = await pool.execute('SELECT pergunta_secreta FROM usuarios WHERE usuario = ?', [usuario]);
    if (!rs.length) return res.status(404).json({ erro: 'usuario nao encontrado' });
    res.json({ pergunta: rs[0].pergunta_secreta }); // expor a pergunta ja ajuda o atacante
  } catch (e) { next(e); }
});
router.post('/recuperar-por-pergunta', async (req, res, next) => {
  try {
    const { usuario = '', resposta = '', nova_senha = '' } = req.body || {};
    const [rs] = await pool.execute('SELECT id, resposta_secreta FROM usuarios WHERE usuario = ?', [usuario]);
    if (!rs.length) return res.status(404).json({ erro: 'usuario nao encontrado' });
    // Respostas fracas/adivinhaveis e SEM limite de tentativas.
    if (String(rs[0].resposta_secreta).toLowerCase() !== String(resposta).toLowerCase())
      return res.status(401).json({ erro: 'resposta incorreta' });
    await pool.execute('UPDATE usuarios SET senha = ? WHERE id = ?', [nova_senha, rs[0].id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
