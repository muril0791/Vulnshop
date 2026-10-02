import { Link, useNavigate } from 'react-router-dom';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';
import { imagemProduto } from '../imagens.js';
import Icone from '../components/Icone.jsx';

export default function Carrinho() {
  const { itens, atualizar, remover, total } = useCarrinho();
  const nav = useNavigate();
  const qtdTotal = itens.reduce((s, x) => s + Number(x.quantidade || 0), 0);

  if (itens.length === 0) {
    return (
      <div>
        <h1>Carrinho</h1>
        <div className="carrinho-vazio">
          <Icone nome="sacola" tamanho={48} />
          <h2>Seu carrinho esta vazio</h2>
          <p className="suave">Que tal explorar o catalogo e encontrar algo novo?</p>
          <Link className="btn" to="/">Ver catalogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Carrinho <span className="titulo-contagem">({qtdTotal} {qtdTotal === 1 ? 'item' : 'itens'})</span></h1>

      <div className="carrinho-layout">
        <div className="carrinho-itens">
          {itens.map((it, idx) => {
            const sub = Number(it.preco) * Number(it.quantidade);
            const link = it.produto_id ? '/produto/' + it.produto_id : '#';
            return (
              <div className="linha-carrinho" key={idx}>
                <Link to={link} className="lc-thumb"><img src={imagemProduto(it)} alt={it.nome} /></Link>

                <div className="lc-info">
                  <Link to={link} className="lc-nome">{it.nome}</Link>
                  {it.categoria && <span className="lc-cat">{it.categoria}</span>}
                  <div className="lc-preco-unit">
                    <label>Preco unit.</label>
                    <div className="campo-moeda">
                      <span>R$</span>
                      <input type="number" step="0.01" value={it.preco} onChange={(e) => atualizar(idx, 'preco', Number(e.target.value))} />
                    </div>
                  </div>
                  <button className="lc-remover" onClick={() => remover(idx)}><Icone nome="lixeira" tamanho={15} /> Remover</button>
                </div>

                <div className="lc-qtd">
                  <div className="stepper">
                    <button type="button" onClick={() => atualizar(idx, 'quantidade', Number(it.quantidade) - 1)} aria-label="Diminuir"><Icone nome="menos" tamanho={14} /></button>
                    <input type="number" value={it.quantidade} onChange={(e) => atualizar(idx, 'quantidade', Number(e.target.value))} />
                    <button type="button" onClick={() => atualizar(idx, 'quantidade', Number(it.quantidade) + 1)} aria-label="Aumentar"><Icone nome="mais" tamanho={14} /></button>
                  </div>
                </div>

                <div className="lc-subtotal">R$ {sub.toFixed(2)}</div>
              </div>
            );
          })}
        </div>

        <aside className="resumo">
          <h3>Resumo do pedido</h3>
          <div className="total-linha"><span>Subtotal ({qtdTotal} {qtdTotal === 1 ? 'item' : 'itens'})</span><span>R$ {total.toFixed(2)}</span></div>
          <div className="total-linha"><span>Frete</span><span className="ok">Gratis</span></div>
          <div className="total-linha grande"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
          <button className="btn" style={{ width: '100%' }} onClick={() => nav('/checkout')}>Ir para o checkout</button>
          <Link to="/" className="resumo-continuar">← Continuar comprando</Link>
          <p className="resumo-seguro"><Icone nome="escudo" tamanho={14} /> Pagamento em ambiente protegido*</p>
        </aside>
      </div>

      <div className="dica" style={{ marginTop: 18 }}>
        <b>Desafios <span className="wstg">BUSL-01/03</span>:</b> preco e quantidade sao editaveis aqui (client-side).
        Em Low o checkout confia neles — tente <code>preco = 0.01</code> ou <code>quantidade = -5</code>.
      </div>
    </div>
  );
}
