import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { imagemProduto } from '../imagens.js';

export default function Busca() {
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const { nivel } = useAuth();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setErro(null);
    api.busca(q).then(setDados).catch((e) => setErro(e.dados?.erro || e.message));
  }, [q]);

  const renderHtml = nivel !== 'high';

  return (
    <div>
      <h1>Resultados</h1>
      {/* [WSTG-INPV-01] XSS Refletido: o termo volta e e renderizado sem escapar (Low/Medium) */}
      <p className="suave">
        Voce buscou por: {renderHtml ? <span dangerouslySetInnerHTML={{ __html: q }} /> : <span>{q}</span>}
      </p>
      {erro && <p className="erro">{erro}</p>}
      {dados && <p className="suave">{dados.total} resultado(s).</p>}
      <div className="grade-produtos">
        {dados?.resultados?.map((p, i) => (
          <Link to={'/produto/' + p.id} key={i} className="cartao-produto" style={{ color: 'inherit' }}>
            <div className="thumb"><img src={imagemProduto(p)} alt={p.nome} /></div>
            <h3>{p.nome}</h3>
            <p className="categoria">{p.categoria}</p>
            <p className="preco">R$ {Number(p.preco).toFixed(2)}</p>
          </Link>
        ))}
      </div>
      <div className="dica" style={{ marginTop: 14 }}>
        <b>Desafios:</b> <span className="wstg">INPV-01</span> XSS refletido — busque <code>{'<img src=x onerror=alert(1)>'}</code>.
        <span className="wstg"> INPV-05</span> SQLi (dump de usuarios):
        <code>{"x%' UNION SELECT id,usuario,senha,papel,email,1,1,NOW() FROM usuarios -- "}</code>
      </div>
    </div>
  );
}
