import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Admin() {
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState(null);
  const [host, setHost] = useState('127.0.0.1 & whoami');
  const [ping, setPing] = useState(null);
  const [expr, setExpr] = useState('7*7');
  const [calc, setCalc] = useState(null);
  const [msgs, setMsgs] = useState([]);

  function carregar() {
    api.adminUsuarios().then(setUsuarios).catch((e) => setErro(e.dados?.erro || e.message));
    api.adminMensagens().then(setMsgs).catch(() => {});
  }
  useEffect(() => { carregar(); }, []);

  async function rodarPing() {
    setPing('...'); try { const r = await api.adminPing(host); setPing(r.saida || JSON.stringify(r)); }
    catch (e) { setPing('Erro: ' + (e.dados?.erro || e.message)); }
  }
  async function rodarCalc() {
    setCalc('...'); try { const r = await api.adminCalcular(expr); setCalc(String(r.resultado)); }
    catch (e) { setCalc('Erro: ' + (e.dados?.erro || e.message)); }
  }

  return (
    <div>
      <h1>Painel administrativo <span className="wstg">CONF-05 / ATHZ-02</span></h1>
      <p className="suave">Em Low, QUALQUER visitante (ate deslogado) abre isto. Em Medium, mandar o header <code>X-Admin: true</code> burla a checagem.</p>
      {erro && <p className="erro">{erro}</p>}

      <div className="caixa">
        <h3>Usuarios <span className="wstg">CRYP-03/04</span></h3>
        <div className="tabela-scroll">
          <table>
            <thead><tr><th>id</th><th>usuario</th><th>senha (texto puro!)</th><th>papel</th><th>token_lembrar (MD5)</th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td><td>{u.usuario}</td><td className="erro">{u.senha}</td><td>{u.papel}</td>
                  <td className="suave">{u.token_lembrar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="caixa">
        <h3>Checar status (ping) <span className="wstg">INPV-12 Command Injection</span></h3>
        <input className="campo" value={host} onChange={(e) => setHost(e.target.value)} />
        <button className="btn" onClick={rodarPing}>Executar</button>
        {ping && <pre>{ping}</pre>}
        <div className="dica">Low (Windows): <code>127.0.0.1 &amp; whoami</code> ou <code>127.0.0.1 &amp; dir</code>.</div>
      </div>

      <div className="caixa">
        <h3>Calculadora de desconto <span className="wstg">INPV-11 Code Injection</span></h3>
        <input className="campo" value={expr} onChange={(e) => setExpr(e.target.value)} />
        <button className="btn" onClick={rodarCalc}>Calcular</button>
        {calc && <pre>{calc}</pre>}
        <div className="dica">Low (RCE): <code>global.process.mainModule.require('child_process').execSync('whoami').toString()</code></div>
      </div>

      <div className="caixa">
        <h3>Mensagens de contato</h3>
        <div className="tabela-scroll">
          <table>
            <thead><tr><th>id</th><th>nome</th><th>email</th><th>mensagem</th><th>url</th></tr></thead>
            <tbody>
              {msgs.map((m) => (
                <tr key={m.id}><td>{m.id}</td><td>{m.nome}</td><td>{m.email}</td><td>{m.mensagem}</td><td className="suave">{m.url_avatar}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
