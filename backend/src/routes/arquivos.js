// ============================================================================
//  Rota de ARQUIVOS — download de comprovante/nota por nome de arquivo.
//   [WSTG-ATHZ-01] Directory Traversal / Local File Include:
//   como o caminho vem do usuario, da pra "subir" diretorios e ler arquivos
//   fora da pasta de comprovantes.
// ============================================================================
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const BASE = path.resolve(__dirname, '../../comprovantes');

// GET /api/arquivos/comprovante?file=nota-1001.txt
router.get('/comprovante', (req, res) => {
  const file = String(req.query.file || '');
  if (!file) return res.status(400).json({ erro: 'informe ?file=' });

  let alvo;
  switch (req.nivel) {
    case 'high': {
      // Correto: descarta qualquer diretorio do input (path.basename) e confina
      // o resultado dentro de BASE.
      alvo = path.join(BASE, path.basename(file));
      if (!alvo.startsWith(BASE)) return res.status(400).json({ erro: 'caminho invalido' });
      break;
    }
    case 'medium': {
      // Blacklist fraca: remove "../". BYPASS: "....//" (vira "../"), barras
      // invertidas "..\\" no Windows, caminho absoluto, ou URL-encoding.
      const limpo = file.replace(/\.\.\//g, '');
      alvo = path.resolve(BASE, limpo);
      break;
    }
    case 'low':
    default:
      // [WSTG-ATHZ-01] resolve o caminho como veio. Payloads:
      //  Windows: ?file=..\..\..\..\..\..\Windows\win.ini   ou  ?file=C:\Windows\win.ini
      //  Linux:   ?file=../../../../etc/passwd
      alvo = path.resolve(BASE, file);
      break;
  }

  fs.readFile(alvo, (err, data) => {
    if (err) return res.status(404).json({ erro: 'arquivo nao encontrado', detalhe: err.message, tentado: alvo });
    res.type('text/plain').send(data);
  });
});

module.exports = router;
