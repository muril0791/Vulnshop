// ============================================================================
//  Middlewares de AUTORIZACAO.
//   [WSTG-ATHZ-02] Bypass de autorizacao
//   [WSTG-ATHZ-03] Escalacao de privilegio (a checagem de admin)
// ============================================================================

// Exige apenas estar logado.
function requerLogin(req, res, next) {
  if (!req.usuario) return res.status(401).json({ erro: 'nao autenticado' });
  next();
}

// Exige ser admin — com falhas propositais por nivel.
function requerAdmin(req, res, next) {
  switch (req.nivel) {
    case 'high':
      // Correto: so passa quem esta logado E tem papel 'admin' no servidor.
      if (!req.usuario || req.usuario.papel !== 'admin') {
        return res.status(403).json({ erro: 'acesso negado' });
      }
      return next();

    case 'medium':
      // [WSTG-ATHZ-02] Bypass: alem do papel real, a app "confia" em um header
      // ou parametro que o proprio cliente controla. Basta mandar X-Admin:true.
      if (
        (req.usuario && req.usuario.papel === 'admin') ||
        req.headers['x-admin'] === 'true' ||
        req.query.admin === '1'
      ) {
        return next();
      }
      return res.status(403).json({ erro: 'acesso negado' });

    case 'low':
    default:
      // Pessimo: NENHUMA checagem. Qualquer um (ate deslogado) acessa o /admin.
      return next();
  }
}

module.exports = { requerLogin, requerAdmin };
