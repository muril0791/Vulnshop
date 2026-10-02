import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Perfil() {
  const { usuario, setUsuario, nivel } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [arq, setArq] = useState(null);
  const [msgUp, setMsgUp] = useState(null);

  function carregar() {
    api.perfil().then((p) => { setPerfil(p); setNome(p?.nome || ''); setEmail(p?.email || ''); }).catch(() => {});
  }
  useEffect(() => { if (usuario) carregar(); }, [usuario]);
  if (!usuario) return <p>Faca <Link to="/login">login</Link>.</p>;

  async function salvar(e) {
    e.preventDefault(); setMsg(null);
    try { await api.atualizarPerfil({ nome, email }); setMsg('Perfil salvo!'); carregar(); }
    catch (e) { setMsg('Erro: ' + (e.dados?.erro || e.message)); }
  }
  async function virarAdmin() {
    setMsg(null);
    try {
      // [WSTG-ATHZ-03] mass assignment: Low aceita "papel"; Medium bloqueia
      // "papel" mas nao "Papel" (blacklist case-sensitive).
      const payload = nivel === 'medium' ? { Papel: 'admin' } : { papel: 'admin' };
      await api.atualizarPerfil(payload);
      const eu = await api.eu(); setUsuario(eu.usuario); carregar();
      setMsg('Tentativa enviada — veja o campo Papel acima.');
    } catch (e) { setMsg('Erro: ' + (e.dados?.erro || e.message)); }
  }
  async function enviarAvatar(e) {
    e.preventDefault(); setMsgUp(null);
    if (!arq) return;
    try { const r = await api.uploadAvatar(arq); setMsgUp('Enviado: ' + r.avatar); carregar(); }
    catch (e) { setMsgUp('Erro: ' + (e.dados?.erro || e.message)); }
  }

  return (
    <div>
      <h1>Meu perfil</h1>
      <div className="caixa">
        <p><b>Usuario:</b> {perfil?.usuario} · <b>Papel:</b>{' '}
          <span className={perfil?.papel === 'admin' ? 'ok' : ''}>{perfil?.papel}</span></p>
        {perfil?.avatar && <p><b>Avatar:</b> <a href={api.base + perfil.avatar} target="_blank" rel="noreferrer">{perfil.avatar}</a></p>}
        <form onSubmit={salvar}>
          <label>Nome</label><input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <label>E-mail</label><input className="campo" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn">Salvar</button>
        </form>
        {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
      </div>

      <div className="caixa">
        <h3>Escalar privilegio <span className="wstg">ATHZ-03</span></h3>
        <p className="suave">O update de perfil aceita campos extras (mass assignment). Low aceita <code>papel:"admin"</code>;
          em Medium o bypass e a chave <code>Papel</code>; em High nem e aceito.</p>
        <button className="btn secundario" onClick={virarAdmin}>Tentar virar admin</button>
      </div>

      <div className="caixa">
        <h3>Foto de avatar <span className="wstg">BUSL-08/09</span></h3>
        <form onSubmit={enviarAvatar}>
          <input type="file" onChange={(e) => setArq(e.target.files[0])} />
          <button className="btn">Enviar</button>
        </form>
        {msgUp && <p className={msgUp.startsWith('Erro') ? 'erro' : 'ok'}>{msgUp}</p>}
        <div className="dica" style={{ marginTop: 10 }}>
          Em Low, envie um <code>.svg</code>/<code>.html</code> com <code>{'<script>'}</code>: ao abrir em <code>/uploads/</code> ele executa (XSS via upload).
          Em Medium, apenas <code>.php</code> e bloqueado (tente <code>.svg</code> ou <code>arquivo.php.png</code>).
        </div>
      </div>
    </div>
  );
}
