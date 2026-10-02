import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';

export default function Checkout() {
  const { itens, total, limpar } = useCarrinho();
  const [cupom, setCupom] = useState('');
  const [endereco, setEndereco] = useState('');
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState(null);
  const nav = useNavigate();

  async function finalizar(e) {
    e.preventDefault(); setErro(null); setRes(null);
    try { const r = await api.checkout({ itens, cupom: cupom || null, endereco }); setRes(r); }
    catch (e) { setErro(e.dados?.erro || e.message); }
  }

  return (
    <div>
      <h1>Checkout</h1>
      {itens.length === 0 && !res && <p className="suave">Carrinho vazio.</p>}
      <form className="form larga" onSubmit={finalizar}>
        <label>Endereco de entrega</label>
        <input className="campo" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        <label>Cupom</label>
        <input className="campo" value={cupom} onChange={(e) => setCupom(e.target.value)} placeholder="BEMVINDO10 / PROMO50 / FRETEGRATIS" />
        <div className="total-linha grande"><span>Total (calculado no cliente)</span><span>R$ {total.toFixed(2)}</span></div>
        {erro && <p className="erro">{erro}</p>}
        <button className="btn">Finalizar compra</button>
      </form>
      {res && (
        <div className="caixa">
          <p className="ok">Pedido processado!</p>
          <p>Subtotal: R$ {Number(res.subtotal).toFixed(2)} · Desconto: R$ {Number(res.desconto).toFixed(2)} · <b>Total: R$ {Number(res.total).toFixed(2)}</b></p>
          {res.pedido_id && <p>Pedido #{res.pedido_id}. <button className="btn-link" onClick={() => { limpar(); nav('/pedidos'); }}>ver pedidos</button></p>}
          {res.aviso && <p className="suave">⚠ {res.aviso}</p>}
        </div>
      )}
      <div className="dica" style={{ marginTop: 12 }}>
        <b>Desafios <span className="wstg">BUSL-01/03/05/06</span>:</b> reuse o mesmo cupom varias vezes, aplique <code>PROMO50</code> repetido,
        envie quantidade negativa, ou finalize sem login (em Low). Em High tudo isso e barrado.
      </div>
    </div>
  );
}
