import { useState } from 'react';
import { api } from '../api/client.js';

// Laboratório extra: injeções que estavam conceituais (SSI/XPath), verb
// tampering e os ataques cross-origin (via site do atacante em :4444).
export default function Extras() {
  const [ssiTexto, setSsiTexto] = useState('Servidor: <!--#exec cmd="whoami"-->');
  const [ssiOut, setSsiOut] = useState(null);
  const [xu, setXu] = useState('admin');
  const [xs, setXs] = useState("' or '1'='1");
  const [xOut, setXOut] = useState(null);
  const [vid, setVid] = useState('2');
  const [vOut, setVOut] = useState(null);

  async function rodarSsi() {
    setSsiOut('...'); try { const r = await api.ssi(ssiTexto); setSsiOut(r.render); }
    catch (e) { setSsiOut('Erro: ' + (e.dados?.erro || e.message)); }
  }
  async function rodarXpath() {
    setXOut('...'); try { const r = await api.xpathLogin(xu, xs); setXOut(JSON.stringify(r)); }
    catch (e) { setXOut('Erro: ' + (e.dados?.erro || e.message)); }
  }
  async function rodarVerbo() {
    setVOut('...'); try { const r = await api.promoverPut(vid); setVOut('PUT executou: ' + JSON.stringify(r)); }
    catch (e) { setVOut('Bloqueado: ' + (e.dados?.erro || e.message)); }
  }

  return (
    <div>
      <h1>Laboratório extra</h1>

      <div className="caixa">
        <h3>SSI Injection <span className="wstg">INPV-08</span></h3>
        <p className="suave">Diretivas Server Side Includes processadas em Low/Medium; High trata como texto.</p>
        <textarea value={ssiTexto} onChange={(e) => setSsiTexto(e.target.value)} />
        <button className="btn" onClick={rodarSsi}>Renderizar</button>
        {ssiOut != null && <pre>{ssiOut}</pre>}
        <div className="dica">Low: <code>{'<!--#exec cmd="whoami"-->'}</code> (RCE) · <code>{'<!--#include file="C:/Windows/win.ini"-->'}</code> (LFI).</div>
      </div>

      <div className="caixa">
        <h3>XPath Injection <span className="wstg">INPV-09</span></h3>
        <p className="suave">"Login" contra um XML. Coloque a injeção no campo <b>senha</b> (o <code>and</code> do usuário some).</p>
        <label>Usuário</label><input className="campo" value={xu} onChange={(e) => setXu(e.target.value)} />
        <label>Senha</label><input className="campo" value={xs} onChange={(e) => setXs(e.target.value)} />
        <button className="btn" onClick={rodarXpath}>Autenticar (XML)</button>
        {xOut != null && <pre>{xOut}</pre>}
        <div className="dica">Payload na senha: <code>' or '1'='1</code> → autentica como admin.</div>
      </div>

      <div className="caixa">
        <h3>HTTP Verb Tampering <span className="wstg">INPV-03</span></h3>
        <p className="suave">O <code>POST /api/verbo/promover/:id</code> é protegido, mas o <code>PUT</code> não é (Low/Medium). Promova alguém a admin via PUT.</p>
        <label>ID do usuário</label><input className="campo" value={vid} onChange={(e) => setVid(e.target.value)} />
        <button className="btn" onClick={rodarVerbo}>Promover via PUT</button>
        {vOut != null && <pre>{vOut}</pre>}
      </div>

      <div className="caixa">
        <h3>Ataques cross-origin <span className="wstg">SESS-05 · CLNT-07 · CLNT-09</span></h3>
        <p className="suave">Suba o site do atacante (<code>node atacante/servir.js</code>) e, <b>logado aqui</b>, abra:</p>
        <ul>
          <li><a href="http://localhost:4444/csrf.html" target="_blank" rel="noreferrer">CSRF</a> — te promove a admin sem consentimento</li>
          <li><a href="http://localhost:4444/cors.html" target="_blank" rel="noreferrer">CORS</a> — rouba seus dados privados</li>
          <li><a href="http://localhost:4444/clickjacking.html" target="_blank" rel="noreferrer">Clickjacking</a> — embute página sensível em iframe</li>
        </ul>
        <p className="suave">Em <b>High</b> os três falham (token CSRF, CORS restrito, X-Frame-Options).</p>
      </div>
    </div>
  );
}
