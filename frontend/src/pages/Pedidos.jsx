import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Pedidos() {
  const { usuario } = useAuth();
  const [ps, setPs] = useState([]);
  const [erro, setErro] = useState(null);
  useEffect(() => { api.pedidos().then(setPs).catch((e) => setErro(e.dados?.erro || e.message)); }, []);

  if (!usuario) return <p>Faca <Link to="/login">login</Link> para ver seus pedidos.</p>;
  return (
    <div>
      <h1>Meus pedidos</h1>
      {erro && <p className="erro">{erro}</p>}
      <div className="tabela-scroll">
        <table>
          <thead><tr><th>ID</th><th>Total</th><th>Status</th><th>Endereco</th><th></th></tr></thead>
          <tbody>
            {ps.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td><td>R$ {Number(p.total).toFixed(2)}</td><td>{p.status}</td><td>{p.endereco}</td>
                <td><Link to={'/pedidos/' + p.id}>ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dica" style={{ marginTop: 12 }}>
        <b>Desafio <span className="wstg">ATHZ-04 IDOR</span>:</b> abra <code>/pedidos/1</code>, <code>/pedidos/2</code>, <code>/pedidos/3</code>
        e veja pedidos de <i>outros</i> usuarios (funciona em Low/Medium; bloqueado em High).
      </div>
    </div>
  );
}
