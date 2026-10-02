import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';
import { imagemProduto } from '../imagens.js';
import Icone, { Estrelas } from '../components/Icone.jsx';

// Pagina inicial: hero + catalogo. Visual de loja; dados continuam vindo da API.
export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState(false);
  const [cat, setCat] = useState('Todos');
  const { adicionar } = useCarrinho();

  useEffect(() => {
    api.produtos().then(setProdutos).catch(() => setErro(true));
  }, []);

  const categorias = useMemo(
    () => ['Todos', ...Array.from(new Set(produtos.map((p) => p.categoria).filter(Boolean)))],
    [produtos]
  );
  const visiveis = cat === 'Todos' ? produtos : produtos.filter((p) => p.categoria === cat);

  return (
    <div>
      <section className="hero">
        <h1>Tecnologia que move o seu dia</h1>
        <p>
          Eletronicos, acessorios e escritorio com entrega rapida e parcelamento sem juros.
          Ofertas selecionadas toda semana na VulnShop.
        </p>
        <Link className="btn cta" to="/busca?q=">Ver ofertas</Link>
      </section>

      <div className="beneficios">
        <div className="beneficio"><span className="ico"><Icone nome="caminhao" tamanho={24} /></span><div><b>Frete rapido</b><span>Para todo o Brasil</span></div></div>
        <div className="beneficio"><span className="ico"><Icone nome="cartao" tamanho={24} /></span><div><b>Ate 12x sem juros</b><span>No cartao de credito</span></div></div>
        <div className="beneficio"><span className="ico"><Icone nome="escudo" tamanho={24} /></span><div><b>Compra segura</b><span>Ambiente protegido*</span></div></div>
        <div className="beneficio"><span className="ico"><Icone nome="troca" tamanho={24} /></span><div><b>Troca facil</b><span>7 dias de garantia</span></div></div>
      </div>

      {erro && <p className="erro" style={{ marginTop: 16 }}>Nao foi possivel carregar os produtos (backend/MySQL no ar?).</p>}

      <div className="secao-titulo">
        <h2>Catalogo</h2>
        <span className="suave">{visiveis.length} produto(s)</span>
      </div>

      <div className="chips">
        {categorias.map((c) => (
          <button key={c} className={'chip' + (c === cat ? ' ativo' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="grade-produtos">
        {visiveis.map((p) => {
          const preco = Number(p.preco);
          const parcela = (preco / 12).toFixed(2);
          // avaliacao decorativa e estavel por produto (loja ficticia)
          const estrelas = 4 + (Number(p.id) % 2) * 0.5;
          const numAval = 8 + (Number(p.id) * 13) % 180;
          return (
            <div key={p.id} className="cartao-produto">
              <Link to={'/produto/' + p.id} style={{ color: 'inherit' }}>
                <div className="thumb">
                  <img src={imagemProduto(p)} alt={p.nome} loading="lazy" />
                  {p.id % 3 === 0 && <span className="selo-desc">OFERTA</span>}
                </div>
                <p className="categoria">{p.categoria}</p>
                <h3>{p.nome}</h3>
              </Link>
              <div className="card-aval">
                <Estrelas valor={estrelas} tamanho={14} />
                <span>({numAval})</span>
              </div>
              <p className="preco">R$ {preco.toFixed(2)}</p>
              <p className="parcelas">em ate 12x de R$ {parcela} sem juros</p>
              <div className="linha-botoes">
                <Link className="btn secundario" to={'/produto/' + p.id}>Detalhes</Link>
                <button className="btn" onClick={() => adicionar(p)}>+ Carrinho</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
