import { useState } from 'react';
import { api } from '../api/client.js';

export default function GraphQLPage() {
  const [query, setQuery] = useState('{ usuarios { id usuario senha papel } }');
  const [res, setRes] = useState(null);
  const introspection = '{ __schema { queryType { name } types { name fields { name } } } }';

  async function rodar() {
    setRes('...');
    try { const r = await api.graphql(query); setRes(JSON.stringify(r, null, 2)); }
    catch (e) { setRes('Erro: ' + e.message); }
  }

  return (
    <div>
      <h1>GraphQL <span className="wstg">APIT-01</span></h1>
      <p className="suave">Endpoint <code>POST /graphql</code> — sem autenticacao, sem rate limit e com introspection habilitada.</p>
      <textarea style={{ width: '100%', minHeight: 130 }} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="linha-botoes">
        <button className="btn" onClick={rodar}>Executar</button>
        <button className="btn secundario" onClick={() => setQuery(introspection)}>Introspection</button>
        <button className="btn secundario" onClick={() => setQuery('{ usuarios { usuario senha papel } }')}>Dump usuarios</button>
        <button className="btn secundario" onClick={() => setQuery('{ pedido(id: 2) { id usuario_id total endereco } }')}>IDOR pedido</button>
      </div>
      {res && <pre>{res}</pre>}
      <div className="dica" style={{ marginTop: 12 }}>
        A query <code>usuarios</code> nao tem autorizacao: vaza ate a senha. <code>pedido(id)</code> permite IDOR pela API.
        A introspection revela todo o schema.
      </div>
    </div>
  );
}
