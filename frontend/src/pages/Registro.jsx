import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function Registro() {
  const [f, setF] = useState({ nome: '', email: '', usuario: '', senha: '', pergunta_secreta: '', resposta_secreta: '' });
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(false);
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault(); setErro(null);
    try { await api.registro(f); setOk(true); setTimeout(() => nav('/login'), 900); }
    catch (e) { setErro(e.dados?.erro || e.message); }
  }

  return (
    <div>
      <h1>Criar conta</h1>
      <form className="form" onSubmit={enviar}>
        <label>Nome</label><input className="campo" value={f.nome} onChange={set('nome')} />
        <label>E-mail</label><input className="campo" value={f.email} onChange={set('email')} />
        <label>Usuario</label><input className="campo" value={f.usuario} onChange={set('usuario')} />
        <label>Senha</label><input className="campo" type="password" value={f.senha} onChange={set('senha')} />
        <label>Pergunta secreta</label><input className="campo" value={f.pergunta_secreta} onChange={set('pergunta_secreta')} />
        <label>Resposta secreta</label><input className="campo" value={f.resposta_secreta} onChange={set('resposta_secreta')} />
        {erro && <p className="erro">{erro}</p>}
        {ok && <p className="ok">Conta criada! Redirecionando...</p>}
        <button className="btn">Registrar</button>
      </form>
      <p className="suave" style={{ marginTop: 12 }}>Ja tem conta? <Link to="/login">Entrar</Link></p>
      <div className="dica" style={{ marginTop: 14 }}>
        <b>Desafios:</b> <span className="wstg">ATHN-07</span> politica de senha (Low aceita "123") ·
        <span className="wstg"> IDNT-05</span> usuario fraco (Low aceita "a").
      </div>
    </div>
  );
}
