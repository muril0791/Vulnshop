// ============================================================================
//  Middleware que carrega a sessao a partir do cookie "sid" e popula:
//    req.sid, req.sessao e req.usuario  (ou null se nao logado)
// ============================================================================
const { obterSessao } = require('../sessao');

function sessaoMiddleware(req, res, next) {
  const sid = req.cookies && req.cookies.sid;
  req.sid = sid || null;
  const s = obterSessao(sid, req.nivel);
  req.sessao = s || null;
  req.usuario = s ? { id: s.usuarioId, usuario: s.usuario, papel: s.papel } : null;
  next();
}

module.exports = { sessaoMiddleware };
