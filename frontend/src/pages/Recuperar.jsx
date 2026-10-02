import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';

// Recuperacao de senha: por token (reset link) e por pergunta secreta.
export default function Recuperar() {
  const [sp] = useSearchParams();
  const tokenUrl = sp.get('token');

  // --- modo reset (veio de um link com ?token=) ---
  const [novaSenha, setNovaSenha] = useState('');
  const [token, setToken] = useState(tokenUrl || '');
  const [msgReset, setMsgReset] = useState(null);
  async function resetar(e) {
    e.preventDefault(); setMsgReset(null);
    try { await api.resetar({ token, nova_senha: novaSenha }); setMsgReset('Senha alterada com sucesso!'); }
    catch (e) { setMsgReset('Erro: ' + (e.dados?.erro || e.message)); }
  }

  // --- gerar link/token ---
  const [usuario, setUsuario] = useState('');
  const [link, setLink] = useState(null);
  async function gerar(e) {
    e.preventDefault(); setLink(null);
    try { const r = await api.esqueci(usuario); setLink(r); } catch (e) { setLink({ erro: e.dados?.erro || e.message }); }
  }

  // --- pergunta secreta ---
  const [uPergunta, setUPergunta] = useState('');
  const [pergunta, setPergunta] = useState(null);
  const [resposta, setResposta] = useState('');
  const [novaPorPergunta, setNovaPorPergunta] = useState('');
  const [msgPergunta, setMsgPergunta] = useState(null);
  async function verPergunta(e) {
    e.preventDefault(); setPergunta(null);
    try { const r = await api.pergunta(uPergunta); setPergunta(r.pergunta); } catch (e) { setMsgPergunta('Erro: ' + (e.dados?.erro || e.message)); }
  }
  async function recuperarPergunta(e) {
    e.preventDefault(); setMsgPergunta(null);
    try { await api.recuperarPergunta({ usuario: uPergunta, resposta, nova_senha: novaPorPergunta }); setMsgPergunta('Senha alterada!'); }
    catch (e) { setMsgPergunta('Erro: ' + (e.dados?.erro || e.message)); }
  }

  return (
    <div>
      <h1>Recuperar senha</h1>

      {tokenUrl && (
        <div className="caixa">
          <h3>Redefinir com token</h3>
          <form onSubmit={resetar}>
            <label>Token</label><input className="campo" value={token} onChange={(e) => setToken(e.target.value)} />
            <label>Nova senha</label><input className="campo" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            <button className="btn">Redefinir</button>
          </form>
          {msgReset && <p className={msgReset.startsWith('Erro') ? 'erro' : 'ok'}>{msgReset}</p>}
        </div>
      )}

      <div className="caixa">
        <h3>Gerar link de reset <span className="wstg">ATHN-09 / INPV-17</span></h3>
        <form onSubmit={gerar}>
          <label>Usuario</label><input className="campo" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          <button className="btn">Gerar</button>
        </form>
        {link && (link.erro
          ? <p className="erro">{link.erro}</p>
          : <div className="dica" style={{ marginTop: 10 }}>
              Token: <code>{link.token_didatico}</code><br />Link: <code>{link.link}</code>
              <br /><span className="suave">Em Low o token e o proprio ID do usuario (previsivel). O link usa o header Host (injecao).</span>
            </div>)}
      </div>

      <div className="caixa">
        <h3>Pergunta secreta <span className="wstg">ATHN-08</span></h3>
        <form onSubmit={verPergunta}>
          <label>Usuario</label><input className="campo" value={uPergunta} onChange={(e) => setUPergunta(e.target.value)} />
          <button className="btn secundario">Ver pergunta</button>
        </form>
        {pergunta && (
          <form onSubmit={recuperarPergunta} style={{ marginTop: 10 }}>
            <p><b>Pergunta:</b> {pergunta}</p>
            <label>Resposta</label><input className="campo" value={resposta} onChange={(e) => setResposta(e.target.value)} />
            <label>Nova senha</label><input className="campo" type="password" value={novaPorPergunta} onChange={(e) => setNovaPorPergunta(e.target.value)} />
            <button className="btn">Trocar senha</button>
          </form>
        )}
        {msgPergunta && <p className={msgPergunta.startsWith('Erro') ? 'erro' : 'ok'}>{msgPergunta}</p>}
      </div>
    </div>
  );
}
