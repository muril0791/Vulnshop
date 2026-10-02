import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const { login, nivel } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState(null);
  const nav = useNavigate();
  const [sp] = useSearchParams();

  async function enviar(e) {
    e.preventDefault(); setErro(null);
    try {
      await login({ usuario, senha, lembrar });
      // [WSTG-CLNT-04] Open Redirect no cliente: em Low/Medium obedece ?redirect=
      // sem validar (ex.: /login?redirect=https://site-malicioso).
      const destino = sp.get('redirect');
      if (destino && nivel !== 'high') { window.location.href = destino; return; }
      nav('/');
    } catch (e) { setErro(e.dados?.erro || e.message); }
  }

  return (
    <div>
      <h1>Entrar</h1>
      <form className="form" onSubmit={enviar}>
        <label>Usuario</label>
        <input className="campo" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        <label>Senha</label>
        <input className="campo" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <div className="check">
          <input id="lb" type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
          <label htmlFor="lb" style={{ margin: 0 }}>Lembrar de mim</label>
        </div>
        {erro && <p className="erro">{erro}</p>}
        <button className="btn">Entrar</button>
      </form>
      <p className="suave" style={{ marginTop: 12 }}>
        <Link to="/registro">Criar conta</Link> · <Link to="/recuperar">Esqueci minha senha</Link>
      </p>
      <div className="dica" style={{ marginTop: 14 }}>
        <b>Desafios aqui:</b> <span className="wstg">INPV-05</span> SQLi (usuario <code>admin' --</code>) ·
        <span className="wstg"> ATHN-02</span> admin/admin · <span className="wstg">IDNT-04</span> erro que diferencia usuario/senha ·
        <span className="wstg"> ATHN-03</span> sem bloqueio de brute force · <span className="wstg">CLNT-04</span> <code>?redirect=</code>.
      </div>
    </div>
  );
}
