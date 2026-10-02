import { Link, useNavigate } from 'react-router-dom';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';

export default function Carrinho() {
  const { itens, atualizar, remover, total } = useCarrinho();
  const nav = useNavigate();

  return (
    <div>
      <h1>Carrinho</h1>
      {itens.length === 0 && <p className="suave">Vazio. <Link to="/">Ver catalogo</Link></p>}
      {itens.map((it, idx) => (
        <div className="item-carrinho" key={idx}>
          <div>{it.nome}</div>
          <input type="number" step="0.01" value={it.preco} onChange={(e) => atualizar(idx, 'preco', Number(e.target.value))} />
          <input type="number" value={it.quantidade} onChange={(e) => atualizar(idx, 'quantidade', Number(e.target.value))} />
          <button className="btn-link" onClick={() => remover(idx)}>✕</button>
        </div>
      ))}
      {itens.length > 0 && (
        <>
          <div className="total-linha grande"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
          <button className="btn" onClick={() => nav('/checkout')}>Ir para o checkout</button>
          <div className="dica" style={{ marginTop: 12 }}>
            <b>Desafios <span className="wstg">BUSL-01/03</span>:</b> preco e quantidade sao editaveis aqui (client-side).
            Em Low o checkout confia neles — tente <code>preco = 0.01</code> ou <code>quantidade = -5</code>.
          </div>
        </>
      )}
    </div>
  );
}
