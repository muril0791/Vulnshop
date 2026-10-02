import { createContext, useContext, useEffect, useState } from 'react';
import { api, setCsrf } from '../api/client.js';

// ============================================================================
//  Contexto de autenticação: usuário logado, nível e token anti-CSRF.
//   [WSTG-CLNT-12] Em Low/Medium guardamos um "token" sensível no localStorage
//   (acessível a qualquer XSS). Em High confiamos no cookie HttpOnly + CSRF token.
// ============================================================================
const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [nivel, setNivel] = useState('low');
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    api.getNivel().then((d) => setNivel(d.nivel)).catch(() => {});
    api.eu()
      .then((d) => { setUsuario(d.usuario); setCsrf(d.csrf); })
      .catch(() => api.continuar().then((d) => { setUsuario(d.usuario); setCsrf(d.csrf); }).catch(() => {}))
      .finally(() => setPronto(true));
  }, []);

  async function login(dados) {
    const r = await api.login(dados);
    setUsuario(r.usuario);
    setCsrf(r.csrf);
    if (nivel !== 'high') {
      localStorage.setItem('vulnshop_token', btoa(JSON.stringify(r.usuario)) + '.' + dados.usuario);
    }
    return r;
  }
  async function logout() {
    try { await api.logout(); } catch { /* ignore */ }
    setUsuario(null); setCsrf(null);
    localStorage.removeItem('vulnshop_token');
  }

  return (
    <Ctx.Provider value={{ usuario, setUsuario, nivel, pronto, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
