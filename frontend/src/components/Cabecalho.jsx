import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SeletorNivel from './SeletorNivel.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';

// Cabecalho: marca, busca, navegacao, area de autenticacao e seletor de nivel.
export default function Cabecalho() {
  const { usuario, logout } = useAuth();
  const { itens } = useCarrinho();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const qtd = itens.reduce((s, x) => s + Number(x.quantidade || 0), 0);

  function buscar(e) { e.preventDefault(); nav('/busca?q=' + encodeURIComponent(q)); }

  return (
    <header className="cabecalho">
      <div className="marca">
        <Link to="/" className="logo">🛒 VulnShop</Link>
        <span className="versao">v0.2.0</span>
      </div>

      <form className="busca" onSubmit={buscar}>
        <input placeholder="Buscar produtos..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button>🔎</button>
      </form>

      <nav className="nav">
        <Link to="/">Catalogo</Link>
        <Link to="/carrinho">Carrinho{qtd ? ` (${qtd})` : ''}</Link>
        <Link to="/pedidos">Pedidos</Link>
        <Link to="/contato">Contato</Link>
        <Link to="/arquivos">Notas</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/client-side">Client-side</Link>
        <Link to="/graphql">GraphQL</Link>
        <Link to="/extras">Extras</Link>
        <Link to="/console">Console</Link>
      </nav>

      <div className="auth-area">
        {usuario ? (
          <>
            <Link to="/perfil">👤 {usuario.usuario}{usuario.papel === 'admin' ? ' ⭐' : ''}</Link>
            <button className="btn-link" onClick={logout}>Sair</button>
          </>
        ) : (
          <>
            <Link to="/login">Entrar</Link>
            <Link to="/registro">Criar conta</Link>
          </>
        )}
      </div>

      <SeletorNivel />
    </header>
  );
}
