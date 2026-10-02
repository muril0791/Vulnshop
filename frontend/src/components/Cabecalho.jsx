import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Icone from './Icone.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';

// Cabecalho em dois niveis (estilo loja): barra superior com marca/busca/conta
// e barra de navegacao. Apenas visual — rotas e logica inalteradas.
export default function Cabecalho() {
  const { usuario, logout } = useAuth();
  const { itens } = useCarrinho();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const qtd = itens.reduce((s, x) => s + Number(x.quantidade || 0), 0);

  function buscar(e) { e.preventDefault(); nav('/busca?q=' + encodeURIComponent(q)); }

  return (
    <header className="cabecalho">
      <div className="cabecalho-topo">
        <div className="marca">
          <Link to="/" className="logo"><Icone nome="sacola" tamanho={22} /> VulnShop</Link>
          <span className="versao">v0.2.0</span>
        </div>

        <form className="busca" onSubmit={buscar}>
          <input placeholder="Buscar produtos, marcas e muito mais..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button aria-label="Buscar"><Icone nome="busca" tamanho={18} /></button>
        </form>

        <div className="auth-area">
          {usuario ? (
            <>
              <Link to="/perfil">
                <Icone nome="usuario" tamanho={17} /> {usuario.usuario}
                {usuario.papel === 'admin' ? <Icone nome="estrela" tamanho={14} preenchido style={{ color: 'var(--cor-nota)' }} /> : null}
              </Link>
              <button className="btn-link" onClick={logout}><Icone nome="sair" tamanho={16} /> Sair</button>
            </>
          ) : (
            <>
              <Link to="/login"><Icone nome="usuario" tamanho={17} /> Entrar</Link>
              <Link to="/registro">Criar conta</Link>
            </>
          )}
          <Link to="/carrinho" className="link-carrinho">
            <Icone nome="sacola" tamanho={18} /> Carrinho{qtd ? <span className="carrinho-badge">{qtd}</span> : ''}
          </Link>
        </div>
      </div>

      <div className="cabecalho-nav">
        <div className="nav-inner">
          <nav className="nav">
            <Link to="/">Catalogo</Link>
            <Link to="/pedidos">Meus pedidos</Link>
            <Link to="/arquivos">Notas e comprovantes</Link>
            <Link to="/contato">Atendimento</Link>
            <Link to="/sobre">Sobre</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
