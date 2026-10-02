// ============================================================================
//  TERMINAL INTERATIVO DE TREINO (PTY real via WebSocket).
//
//  ⚠️⚠️  Abre um SHELL completo (PowerShell no Windows / bash no Linux) na
//        maquina do lab, com os privilegios do processo Node. So uso LOCAL no
//        ambiente isolado. NAO EXPONHA NA INTERNET/REDE.
//
//  Trava de seguranca: a conexao WebSocket so e aceita de localhost (loopback);
//  qualquer cliente da rede e recusado no handshake.
//
//  Protocolo:
//    cliente -> servidor : JSON { type:'input', data } | { type:'resize', cols, rows }
//    servidor -> cliente : bytes crus do shell (vao direto pro xterm.js)
// ============================================================================
const os = require('os');
const pty = require('@homebridge/node-pty-prebuilt-multiarch');
const { WebSocketServer } = require('ws');

function ehLocal(req) {
  const ip = (req.socket && req.socket.remoteAddress) || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function attachPtyConsole(server) {
  const wss = new WebSocketServer({ server, path: '/api/console/pty' });

  wss.on('connection', (ws, req) => {
    if (!ehLocal(req)) { ws.close(1008, 'console restrito ao localhost'); return; }

    const win = process.platform === 'win32';
    const shell = win ? 'powershell.exe' : (process.env.SHELL || 'bash');
    const term = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: os.homedir(),
      env: process.env,
      // No Windows, o kill() via ConPTY tem um bug conhecido
      // (_getConsoleProcessList() volta undefined -> .forEach quebra e derruba o
      // backend). Forcar winpty evita esse caminho.
      useConpty: false
    });

    // shell -> navegador
    term.onData((d) => { try { ws.send(d); } catch { /* ws fechando */ } });
    term.onExit(() => { try { ws.close(); } catch { /* ja fechado */ } });

    // navegador -> shell
    ws.on('message', (raw) => {
      let o;
      try { o = JSON.parse(raw.toString()); } catch { return; }
      if (o.type === 'input') term.write(o.data);
      else if (o.type === 'resize' && o.cols && o.rows) {
        try { term.resize(o.cols, o.rows); } catch { /* dimensoes invalidas */ }
      }
    });

    ws.on('close', () => { try { term.kill(); } catch { /* ja morreu */ } });
  });

  return wss;
}

module.exports = { attachPtyConsole };
