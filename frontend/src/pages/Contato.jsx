import { useState } from 'react';
import { api } from '../api/client.js';

export default function Contato() {
  const [f, setF] = useState({ nome: '', email: '', mensagem: '', url_preview: '' });
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault(); setErro(null); setRes(null);
    try { const r = await api.contato(f); setRes(r); } catch (e) { setErro(e.dados?.erro || e.message); }
  }

  return (
    <div>
      <h1>Contato</h1>
      <form className="form larga" onSubmit={enviar}>
        <label>Nome</label><input className="campo" value={f.nome} onChange={set('nome')} />
        <label>E-mail</label><input className="campo" value={f.email} onChange={set('email')} />
        <label>Mensagem</label><textarea value={f.mensagem} onChange={set('mensagem')} />
        <label>URL para "preview" (opcional)</label>
        <input className="campo" value={f.url_preview} onChange={set('url_preview')} placeholder="http://..." />
        {erro && <p className="erro">{erro}</p>}
        <button className="btn">Enviar</button>
      </form>
      {res && (
        <div className="caixa">
          <p className="ok">Mensagem enviada!</p>
          {res.preview && (
            <div>
              <b>Preview buscado pelo SERVIDOR:</b>
              <p className="suave">status {res.preview.status} · {res.preview.tamanho} bytes</p>
              <pre>{res.preview.trecho || res.preview.erro}</pre>
            </div>
          )}
        </div>
      )}
      <div className="dica" style={{ marginTop: 12 }}>
        <b>Desafio <span className="wstg">INPV-19 SSRF</span>:</b> em "URL para preview" aponte para um destino interno —
        ex.: <code>http://localhost:4000/api/admin/usuarios</code> ou <code>http://127.0.0.1:4000/config.js.bak</code>.
        O servidor busca por voce. Em Medium, o filtro bloqueia "localhost/127.0.0.1" — tente <code>http://127.1:4000/...</code> ou <code>http://0.0.0.0:4000/...</code>.
      </div>
    </div>
  );
}
