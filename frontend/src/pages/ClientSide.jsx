import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Laboratorio de vulnerabilidades client-side.
export default function ClientSide() {
  const { nivel } = useAuth();
  const domRef = useRef(null);
  const pmRef = useRef(null);
  const [token, setToken] = useState(null);

  // [WSTG-CLNT-01] DOM-based XSS: escreve o location.hash via innerHTML (Low/Medium).
  useEffect(() => {
    function render() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!domRef.current) return;
      if (nivel === 'high') domRef.current.textContent = hash;      // seguro
      else domRef.current.innerHTML = hash || '<i>(vazio)</i>';     // vulneravel
    }
    render();
    window.addEventListener('hashchange', render);
    return () => window.removeEventListener('hashchange', render);
  }, [nivel]);

  // [WSTG-CLNT-11] postMessage sem checar origin (Low/Medium).
  useEffect(() => {
    function onMsg(e) {
      if (nivel === 'high' && e.origin !== window.location.origin) return;
      if (pmRef.current) pmRef.current.innerHTML = 'Recebido: ' + e.data;
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [nivel]);

  // [WSTG-CLNT-12] token sensivel no localStorage.
  useEffect(() => { setToken(localStorage.getItem('vulnshop_token')); }, []);

  return (
    <div>
      <h1>Laboratorio client-side</h1>

      <div className="caixa">
        <h3>DOM-based XSS <span className="wstg">CLNT-01</span></h3>
        <p className="suave">O texto apos o <code>#</code> na URL e escrito com <code>innerHTML</code>.</p>
        <p>Cole na barra de endereco: <code>/client-side#&lt;img src=x onerror=alert('domxss')&gt;</code></p>
        <div className="dica" ref={domRef} />
      </div>

      <div className="caixa">
        <h3>Web Messaging / postMessage <span className="wstg">CLNT-11</span></h3>
        <button className="btn" onClick={() => window.postMessage("<img src=x onerror=alert('postMessage')>", '*')}>
          Enviar postMessage malicioso
        </button>
        <div ref={pmRef} className="dica" style={{ marginTop: 10 }} />
      </div>

      <div className="caixa">
        <h3>Token no localStorage <span className="wstg">CLNT-12</span></h3>
        <p className="suave">Qualquer XSS le isto (em High nao guardamos token no storage). Valor atual:</p>
        <pre>{token || '(faca login em Low/Medium para popular)'}</pre>
      </div>

      <div className="caixa">
        <h3>Open Redirect <span className="wstg">CLNT-04</span></h3>
        <p className="suave">Servidor: <a href={api.redirectUrl('https://example.com')}>/api/util/redirect?url=https://example.com</a></p>
        <p className="suave">Cliente (login): <code>/login?redirect=https://example.com</code></p>
      </div>

      <div className="caixa">
        <h3>Clickjacking <span className="wstg">CLNT-09</span></h3>
        <p className="suave">Em Low/Medium o backend nao envia <code>X-Frame-Options</code>/CSP, entao as paginas podem ser embutidas num <code>&lt;iframe&gt;</code> de outro site (UI redressing).</p>
      </div>
    </div>
  );
}
