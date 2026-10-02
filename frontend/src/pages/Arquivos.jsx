import { useState } from 'react';
import { api } from '../api/client.js';

export default function Arquivos() {
  const [file, setFile] = useState('nota-1001.txt');
  const [conteudo, setConteudo] = useState(null);

  async function baixar() {
    setConteudo('carregando...');
    try {
      const r = await fetch(api.comprovanteUrl(file), { credentials: 'include' });
      setConteudo(await r.text());
    } catch (e) { setConteudo('Erro: ' + e.message); }
  }

  return (
    <div>
      <h1>Notas / Comprovantes</h1>
      <div className="caixa">
        <label>Nome do arquivo</label>
        <input className="campo" value={file} onChange={(e) => setFile(e.target.value)} />
        <button className="btn" onClick={baixar}>Baixar</button>
        {conteudo != null && <pre>{conteudo}</pre>}
        <div className="dica" style={{ marginTop: 10 }}>
          <b>Desafio <span className="wstg">ATHZ-01 Path Traversal</span>:</b> em Low tente
          <code> C:/Windows/win.ini</code> ou <code>..\..\..\..\..\..\Windows\win.ini</code>
          (Linux: <code>../../../../etc/passwd</code>). Em Medium o filtro remove <code>../</code> — tente <code>....//</code> ou barras <code>..\</code>.
        </div>
      </div>
    </div>
  );
}
