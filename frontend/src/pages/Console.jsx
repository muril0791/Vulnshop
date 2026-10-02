import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { api } from '../api/client.js';

// ============================================================================
//  Terminal interativo de treino: xterm.js conectado por WebSocket a um PTY
//  real no backend (PowerShell/bash). Comporta-se como um terminal de verdade:
//  prompt real, `cd` persiste, cores, programas interativos.
//  ⚠️ Executa na maquina do lab. So uso local (o backend so aceita localhost).
// ============================================================================
export default function Console() {
  const elRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Consolas, "Cascadia Mono", "Courier New", monospace',
      fontSize: 14,
      theme: { background: '#0b0f17', foreground: '#d6e2f0', cursor: '#7fd1ff' }
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(elRef.current);
    // fit depois do primeiro paint, senao o container ainda nao tem tamanho.
    requestAnimationFrame(() => { try { fit.fit(); } catch { /* ignore */ } });

    const url = api.base.replace(/^http/, 'ws') + '/api/console/pty';
    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      term.focus();
    };
    ws.onmessage = (ev) => term.write(ev.data);
    ws.onerror = () => term.write('\r\n\x1b[31m[erro de conexao — o backend esta no ar?]\x1b[0m\r\n');
    ws.onclose = () => term.write('\r\n\x1b[33m[sessao encerrada]\x1b[0m\r\n');

    term.onData((d) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data: d }));
    });

    function aoRedimensionar() {
      try { fit.fit(); } catch { /* ignore */ }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    }
    window.addEventListener('resize', aoRedimensionar);

    return () => {
      window.removeEventListener('resize', aoRedimensionar);
      try { ws.close(); } catch { /* ignore */ }
      term.dispose();
    };
  }, []);

  return (
    <div>
      <h1>Console <span className="wstg">TREINO · shell interativo</span></h1>

      <div className="caixa" style={{ borderLeft: '4px solid #e5533d' }}>
        <b>⚠️ Perigoso de verdade:</b> terminal interativo completo (PowerShell) na
        máquina que hospeda o lab, com os privilégios do seu usuário. Uso{' '}
        <b>local e isolado</b> apenas — a conexão só é aceita de <code>localhost</code>.
        O <code>cd</code> persiste, dá pra rodar programas interativos, etc.
      </div>

      <div
        ref={elRef}
        style={{
          height: 460, marginTop: 12, borderRadius: 8, overflow: 'hidden',
          padding: 8, background: '#0b0f17'
        }}
      />
    </div>
  );
}
