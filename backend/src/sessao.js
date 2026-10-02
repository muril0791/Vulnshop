// ============================================================================
//  GERENCIAMENTO DE SESSAO (proposital e didaticamente inseguro)
//
//  Guardamos as sessoes em memoria (Map). Cada login cria um "sid" que vai
//  para um cookie. O jeito como o sid e gerado e tratado muda por nivel:
//
//   [WSTG-SESS-09] ID de sessao previsivel
//   [WSTG-SESS-03] Session fixation
//   [WSTG-SESS-07] Timeout de sessao ausente
//
//  Low    => sid SEQUENCIAL ("sessao-1001"): trivial de adivinhar; aceita sid
//            vindo do cliente e NAO regenera no login (fixation); sem expiracao.
//  Medium => sid = base64("usuario:contador"): ainda enumeravel/adivinhavel.
//  High   => sid aleatorio (crypto.randomBytes), regenerado no login, com TTL.
// ============================================================================
const crypto = require('crypto');

const sessoes = new Map(); // sid -> { usuarioId, usuario, papel, criadoEm }
let contadorPrevisivel = 1000;

// TTL usado apenas no nivel High (30 min). Low/Medium: sem timeout (SESS-07).
const TTL_MS = 30 * 60 * 1000;

function gerarSid(nivel, usuario) {
  switch (nivel) {
    case 'high':
      // Correcao: identificador aleatorio de 192 bits, impossivel de prever.
      return crypto.randomBytes(24).toString('hex');
    case 'medium':
      // Fraco: base64 de dados previsiveis -> um atacante consegue enumerar.
      contadorPrevisivel++;
      return Buffer.from(usuario + ':' + contadorPrevisivel).toString('base64');
    case 'low':
    default:
      // Pessimo: sequencial. Se meu sid e "sessao-1005", tento "sessao-1004".
      contadorPrevisivel++;
      return 'sessao-' + contadorPrevisivel;
  }
}

function criarSessao(usuario, nivel, sidFornecidoPeloCliente) {
  let sid;
  // [WSTG-SESS-03] Session fixation: em Low, se o cliente ja mandou um "sid",
  // reaproveitamos ele e NAO regeneramos -> o atacante fixa o ID da vitima.
  if (nivel === 'low' && sidFornecidoPeloCliente) {
    sid = sidFornecidoPeloCliente;
  } else {
    sid = gerarSid(nivel, usuario.usuario);
  }
  sessoes.set(sid, {
    usuarioId: usuario.id,
    usuario: usuario.usuario,
    papel: usuario.papel,
    criadoEm: Date.now(),
    // Token anti-CSRF (usado apenas no nivel High — ver middleware/csrf.js).
    csrf: crypto.randomBytes(16).toString('hex')
  });
  return sid;
}

function obterSessao(sid, nivel) {
  if (!sid) return null;
  const s = sessoes.get(sid);
  if (!s) return null;
  // [WSTG-SESS-07] Timeout: so o High expira sessoes antigas.
  if (nivel === 'high' && Date.now() - s.criadoEm > TTL_MS) {
    sessoes.delete(sid);
    return null;
  }
  return s;
}

function destruirSessao(sid) {
  sessoes.delete(sid);
}

module.exports = { sessoes, criarSessao, obterSessao, destruirSessao, gerarSid };
