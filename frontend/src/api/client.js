// ============================================================================
//  Cliente HTTP único para o backend. credentials:'include' envia/recebe
//  cookies (nível de segurança e sessão). Em High, mandamos o token anti-CSRF.
// ============================================================================
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Token anti-CSRF (definido pelo AuthContext após login/eu). Só usado no High.
let csrfToken = null;
export function setCsrf(t) { csrfToken = t || null; }

async function req(caminho, opcoes = {}) {
  const resp = await fetch(API + caminho, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(opcoes.headers || {})
    },
    ...opcoes
  });
  const texto = await resp.text();
  let dados;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }
  if (!resp.ok) throw Object.assign(new Error((dados && dados.erro) || 'erro na requisicao'), { status: resp.status, dados });
  return dados;
}
const get = (c) => req(c);
const post = (c, b) => req(c, { method: 'POST', body: JSON.stringify(b) });

export const api = {
  base: API,
  get, post, setCsrf,
  // saúde / nível
  health: () => get('/api/health'),
  getNivel: () => get('/api/nivel'),
  setNivel: (n) => post('/api/nivel', { nivel: n }),
  // produtos / busca / avaliações
  produtos: () => get('/api/produtos'),
  produto: (id) => get('/api/produtos/' + id),
  busca: (q) => get('/api/produtos/busca?q=' + encodeURIComponent(q)),
  avaliacoes: (pid) => get('/api/avaliacoes/' + pid),
  addAvaliacao: (pid, d) => post('/api/avaliacoes/' + pid, d),
  // auth
  login: (d) => post('/api/auth/login', d),
  registro: (d) => post('/api/auth/registro', d),
  logout: () => post('/api/auth/logout', {}),
  eu: () => get('/api/auth/eu'),
  continuar: () => post('/api/auth/continuar', {}),
  esqueci: (usuario) => post('/api/auth/esqueci-senha', { usuario }),
  resetar: (d) => post('/api/auth/resetar-senha', d),
  pergunta: (usuario) => get('/api/auth/pergunta-secreta?usuario=' + encodeURIComponent(usuario)),
  recuperarPergunta: (d) => post('/api/auth/recuperar-por-pergunta', d),
  // pedidos / perfil
  pedidos: () => get('/api/pedidos'),
  pedido: (id) => get('/api/pedidos/' + id),
  perfil: () => get('/api/perfil'),
  atualizarPerfil: (d) => post('/api/perfil', d),
  uploadAvatar: async (file) => {
    const fd = new FormData(); fd.append('avatar', file);
    const resp = await fetch(API + '/api/perfil/avatar', {
      method: 'POST', credentials: 'include',
      headers: { ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
      body: fd
    });
    const d = await resp.json();
    if (!resp.ok) throw Object.assign(new Error(d.erro || 'erro'), { dados: d });
    return d;
  },
  // contato / arquivos
  contato: (d) => post('/api/contato', d),
  comprovanteUrl: (file) => API + '/api/arquivos/comprovante?file=' + encodeURIComponent(file),
  // carrinho / cupom / checkout
  cupom: (codigo) => get('/api/cupom/' + encodeURIComponent(codigo)),
  checkout: (d) => post('/api/checkout', d),
  // admin
  adminUsuarios: () => get('/api/admin/usuarios'),
  adminPedidos: () => get('/api/admin/pedidos'),
  adminMensagens: () => get('/api/admin/mensagens'),
  adminPing: (host) => post('/api/admin/ping', { host }),
  adminCalcular: (expr) => post('/api/admin/calcular', { expr }),
  // util / injeções / verbo / graphql
  template: (template) => post('/api/util/template', { template }),
  redirectUrl: (url) => API + '/api/util/redirect?url=' + encodeURIComponent(url),
  ssi: (texto) => post('/api/injecoes/ssi', { texto }),
  xpathLogin: (usuario, senha) => post('/api/injecoes/xpath', { usuario, senha }),
  promoverPut: (id) => req('/api/verbo/promover/' + id, { method: 'PUT' }),
  graphql: (query) => post('/graphql', { query }),
  // console de treino (⚠️ executa comandos reais; backend so aceita localhost)
  console: (cmd) => post('/api/console', { cmd })
};
