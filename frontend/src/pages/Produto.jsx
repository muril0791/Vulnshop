import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCarrinho } from '../contexts/CarrinhoContext.jsx';
import { imagemProduto } from '../imagens.js';

export default function Produto() {
  const { id } = useParams();
  const { nivel } = useAuth();
  const { adicionar } = useCarrinho();
  const [p, setP] = useState(null);
  const [avs, setAvs] = useState([]);
  const [form, setForm] = useState({ autor: '', nota: 5, comentario: '' });
  const [msg, setMsg] = useState(null);

  function carregar() {
    api.produto(id).then(setP).catch(() => {});
    api.avaliacoes(id).then(setAvs).catch(() => {});
  }
  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [id]);

  async function enviar(e) {
    e.preventDefault(); setMsg(null);
    try { await api.addAvaliacao(id, form); setForm({ autor: '', nota: 5, comentario: '' }); carregar(); setMsg('Avaliacao enviada!'); }
    catch (e) { setMsg('Erro: ' + (e.dados?.erro || e.message)); }
  }

  // Em Low/Medium renderizamos HTML cru (vulneravel). Em High, texto escapado.
  const renderHtml = nivel !== 'high';
  if (!p) return <p>Carregando...</p>;

  return (
    <div>
      <div className="produto-detalhe">
        <div className="thumb"><img src={imagemProduto(p)} alt={p.nome} /></div>
        <div>
          <h1>{p.nome}</h1>
          <p className="suave">{p.categoria} · estoque {p.estoque}</p>
          {/* [WSTG-CLNT-03] HTML Injection: descricao renderizada como HTML em Low/Medium */}
          {renderHtml
            ? <p dangerouslySetInnerHTML={{ __html: p.descricao || '' }} />
            : <p>{p.descricao}</p>}
          <p style={{ fontSize: 22, color: 'var(--cor-preco)', fontWeight: 700 }}>R$ {Number(p.preco).toFixed(2)}</p>
          <button className="btn" onClick={() => adicionar(p)}>Adicionar ao carrinho</button>
        </div>
      </div>

      <div className="caixa">
        <h2>Avaliacoes <span className="wstg">INPV-02 XSS armazenado</span></h2>
        {avs.length === 0 && <p className="suave">Sem avaliacoes ainda.</p>}
        {avs.map((a) => (
          <div className="avaliacao" key={a.id}>
            <div className="autor">{a.autor} <span className="nota">{'★'.repeat(a.nota || 0)}</span></div>
            {/* [WSTG-INPV-02] comentario renderizado como HTML em Low/Medium */}
            {renderHtml
              ? <div dangerouslySetInnerHTML={{ __html: a.comentario || '' }} />
              : <div>{a.comentario}</div>}
          </div>
        ))}
        <form onSubmit={enviar} style={{ marginTop: 12 }}>
          <label>Seu nome</label>
          <input className="campo" value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
          <label>Nota</label>
          <select className="campo" value={form.nota} onChange={(e) => setForm({ ...form, nota: Number(e.target.value) })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <label>Comentario</label>
          <textarea value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} />
          {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
          <button className="btn">Enviar avaliacao</button>
        </form>
        <div className="dica" style={{ marginTop: 10 }}>
          Em Low, tente o comentario <code>{'<img src=x onerror=alert(document.cookie)>'}</code>.
          Em Medium, <code>{'<script>'}</code> e removido — use o <code>onerror</code>.
        </div>
      </div>
    </div>
  );
}
