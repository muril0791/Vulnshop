import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function PedidoDetalhe() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [erro, setErro] = useState(null);
  useEffect(() => {
    setErro(null);
    api.pedido(id).then(setP).catch((e) => setErro(e.dados?.erro || e.message));
  }, [id]);

  return (
    <div>
      <h1>Pedido #{id}</h1>
      <p className="suave"><Link to="/pedidos">← meus pedidos</Link> · troque o numero na URL para testar o IDOR</p>
      {erro && <p className="erro">{erro}</p>}
      {p && (
        <div className="caixa">
          <p><b>Dono (usuario_id):</b> {p.usuario_id} · <b>Total:</b> R$ {Number(p.total).toFixed(2)} · <b>Status:</b> {p.status}</p>
          <p><b>Endereco:</b> {p.endereco}</p>
          <table>
            <thead><tr><th>Produto</th><th>Qtd</th><th>Preco</th></tr></thead>
            <tbody>
              {p.itens?.map((i) => (
                <tr key={i.id}><td>{i.nome_produto}</td><td>{i.quantidade}</td><td>R$ {Number(i.preco_unitario).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
