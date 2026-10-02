import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icone from './Icone.jsx';
import SeletorNivel from './SeletorNivel.jsx';
import { api } from '../api/client.js';

// ============================================================================
//  Painel lateral "Laboratorio WSTG" (side tab/drawer).
//  Separa o aparato de treino (seletor de nivel + superficies de ataque) do
//  menu da loja, que fica so com features de e-commerce de verdade.
// ============================================================================
const FERRAMENTAS = [
  { to: '/admin', nome: 'Painel Admin', icone: 'engrenagem', wstg: 'CONF-05 · ATHZ-02', desc: 'Acesso sem auth · command & code injection' },
  { to: '/client-side', nome: 'Client-side', icone: 'codigo', wstg: 'CLNT-01/04/11/12', desc: 'DOM XSS · postMessage · open redirect' },
  { to: '/graphql', nome: 'GraphQL', icone: 'grafo', wstg: 'APIT-01', desc: 'Sem auth · introspection · IDOR via API' },
  { to: '/extras', nome: 'Extras', icone: 'laboratorio', wstg: 'INPV-08/09 · INPV-03', desc: 'SSI · XPath · verb tampering · CSRF/CORS' },
  { to: '/console', nome: 'Console', icone: 'terminal', wstg: 'TREINO', desc: 'Shell interativo (PTY) — perigoso de verdade' }
];

export default function PainelLab() {
  const [aberto, setAberto] = useState(false);
  const [saude, setSaude] = useState(null);
  const { pathname } = useLocation();

  useEffect(() => { api.health().then(setSaude).catch(() => setSaude(null)); }, []);

  return (
    <>
      <button className="lab-tab" onClick={() => setAberto(true)} aria-label="Abrir laboratorio WSTG" title="Laboratorio WSTG">
        <Icone nome="laboratorio" tamanho={20} />
        <span>LAB</span>
      </button>

      {aberto && <div className="lab-backdrop" onClick={() => setAberto(false)} />}

      <aside className={'lab-drawer' + (aberto ? ' aberto' : '')} aria-hidden={!aberto}>
        <div className="lab-drawer-topo">
          <span className="lab-titulo"><Icone nome="laboratorio" tamanho={20} /> Laboratorio WSTG</span>
          <button className="lab-fechar" onClick={() => setAberto(false)} aria-label="Fechar painel">
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>
        <p className="lab-sub">Superficies de treino e controle de dificuldade — fora do fluxo normal da loja.</p>

        <div className="lab-bloco">
          <span className="lab-bloco-rotulo">Dificuldade</span>
          <SeletorNivel />
        </div>

        <div className="lab-bloco">
          <span className="lab-bloco-rotulo">Ambiente</span>
          <div className="lab-status">
            <div><span>Backend</span><b>{saude ? `${saude.servico} v${saude.versao}` : '—'}</b></div>
            <div><span>Banco</span><b className={saude?.banco === 'conectado' ? 'ok' : 'falha'}>{saude?.banco || 'offline'}</b></div>
            <div><span>Nivel ativo</span><b style={{ textTransform: 'uppercase' }}>{saude?.nivel_atual || '—'}</b></div>
            {saude?.logado_como && <div><span>Logado como</span><b>{saude.logado_como}</b></div>}
          </div>
        </div>

        <div className="lab-bloco">
          <span className="lab-bloco-rotulo">Superficies de ataque</span>
          <nav className="lab-links">
            {FERRAMENTAS.map((f) => (
              <Link
                key={f.to}
                to={f.to}
                className={'lab-link' + (pathname === f.to ? ' ativo' : '')}
                onClick={() => setAberto(false)}
              >
                <span className="lab-link-ico"><Icone nome={f.icone} tamanho={18} /></span>
                <span className="lab-link-txt">
                  <b>{f.nome}</b>
                  <span className="wstg">{f.wstg}</span>
                  <small>{f.desc}</small>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
