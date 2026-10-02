// ============================================================================
//  [WSTG-SESS-05] Proteção CSRF — presente APENAS no nível High.
//
//  Em Low/Medium não há token: qualquer site consegue forjar uma requisição
//  autenticada (o cookie de sessão viaja junto). No High, exigimos um token
//  anti-CSRF (gerado no login, guardado na sessão) no header `X-CSRF-Token`.
//
//  Observação técnica: portas diferentes são o MESMO "site" para o navegador,
//  então o cookie `sid` é enviado mesmo de http://localhost:4444. Por isso o
//  diferencial Low/Medium × High aqui é o TOKEN (não o SameSite).
// ============================================================================
const METODOS_MUTANTES = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Rotas isentas (não dá para exigir token onde ainda não há sessão).
const ISENTOS = [
  '/api/auth/login', '/api/auth/registro', '/api/auth/continuar',
  '/api/auth/esqueci-senha', '/api/auth/resetar-senha',
  '/api/auth/recuperar-por-pergunta', '/api/nivel', '/graphql',
  // Ferramentas "stateless" (não alteram estado da CONTA do usuário): a defesa
  // delas é a própria lógica High; isentamos do CSRF para testá-las sem login.
  '/api/injecoes', '/api/util', '/api/contato'
];

function csrf(req, res, next) {
  // Low/Medium: sem proteção nenhuma (vulnerável a CSRF).
  if (req.nivel !== 'high') return next();
  if (!METODOS_MUTANTES.includes(req.method)) return next();
  if (ISENTOS.some((p) => req.path.startsWith(p))) return next();

  const enviado = req.headers['x-csrf-token'] || (req.body && req.body._csrf);
  if (!req.sessao || !enviado || enviado !== req.sessao.csrf) {
    return res.status(403).json({ erro: 'CSRF token invalido ou ausente' });
  }
  next();
}

module.exports = { csrf };
