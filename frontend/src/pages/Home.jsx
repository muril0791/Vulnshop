import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';
import { imagemProduto } from '../imagens.js';

// Pagina inicial: catalogo + status da integracao (health).
export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [saude, setSaude] = useState(null);
  const [erro, setErro] = useState(false);
  const { adicionar } = useCarrinho();

  useEffect(() => {
    api.health().then(setSaude).catch(() => {});
    api.produtos().then(setProdutos).catch(() => setErro(true));
  }, []);

  return (
    <div>
      <h1>Catalogo</h1>
      {saude && (
        <p className="status">
          Backend <b>{saude.servico}</b> v{saude.versao} · Banco:{' '}
          <b className={saude.banco === 'conectado' ? 'ok' : 'falha'}>{saude.banco}</b> ·
          Nivel ativo: <b>{saude.nivel_atual}</b>
          {saude.logado_como ? <> · logado: <b>{saude.logado_como}</b></> : ''}
        </p>
      )}
      {erro && <p className="erro">Nao foi possivel carregar os produtos (backend/MySQL no ar?).</p>}

      <div className="grade-produtos">
        {produtos.map((p) => (
          <div key={p.id} className="cartao-produto">
            <Link to={'/produto/' + p.id} style={{ color: 'inherit' }}>
              <div className="thumb"><img src={imagemProduto(p)} alt={p.nome} /></div>
              <h3>{p.nome}</h3>
            </Link>
            <p className="categoria">{p.categoria}</p>
            <p className="preco">R$ {Number(p.preco).toFixed(2)}</p>
            <div className="linha-botoes">
              <Link className="btn secundario" to={'/produto/' + p.id}>Detalhes</Link>
              <button className="btn" onClick={() => adicionar(p)}>+ Carrinho</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
