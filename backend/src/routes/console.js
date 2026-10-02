// ============================================================================
//  CONSOLE DE TREINO — executa comandos do SO como um terminal (estilo DVWA).
//
//  ⚠️⚠️  DELIBERADAMENTE PERIGOSO: roda comandos REAIS na maquina que hospeda
//        o lab, com os privilegios do processo Node (o seu usuario). Serve so
//        para uso LOCAL no ambiente isolado. NAO EXPONHA NA INTERNET/REDE.
//
//  Trava de seguranca: este endpoint so aceita requisicoes vindas de localhost
//  (loopback). Mesmo que o backend esteja ouvindo em 0.0.0.0, qualquer cliente
//  da rede e recusado aqui — um shell web nao pode ficar acessivel a terceiros.
// ============================================================================
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

function ehLocal(req) {
  const ip = req.socket.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

// Qualquer rota deste router exige origem loopback.
router.use((req, res, next) => {
  if (!ehLocal(req)) {
    return res.status(403).json({ erro: 'console restrito ao localhost' });
  }
  next();
});

// POST /api/console  { cmd }  -> executa e devolve a saida (stdout + stderr)
router.post('/', (req, res) => {
  const cmd = String((req.body && req.body.cmd) || '');
  if (!cmd.trim()) return res.json({ cmd, saida: '', codigo: 0 });

  exec(cmd, { timeout: 20000, maxBuffer: 2 * 1024 * 1024, windowsHide: true },
    (e, out, errout) => {
      let saida = (out || '') + (errout || '');
      if (e && e.killed) saida += '\n[timeout: o comando passou de 20s e foi encerrado]';
      if (!saida) saida = e ? e.message : '(sem saida)';
      res.json({ cmd, saida, codigo: e ? (e.code != null ? e.code : 1) : 0 });
    });
});

module.exports = router;
