// ============================================================================
//  Rotas de PERFIL do usuario.
//   [WSTG-ATHZ-03] Escalacao de privilegio via "mass assignment" (virar admin)
//   [WSTG-BUSL-08] Upload de tipo inesperado
//   [WSTG-BUSL-09] Upload de arquivo malicioso (.php/.svg/.html)
// ============================================================================
const express = require('express');
const router = express.Router();
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { pool } = require('../db');
const { requerLogin } = require('../middleware/autorizacao');

const DIR_UPLOAD = path.resolve(__dirname, '../../uploads');

// GET /api/perfil — dados do usuario logado.
router.get('/', requerLogin, async (req, res, next) => {
  try {
    const [r] = await pool.execute(
      'SELECT id,nome,email,usuario,papel,avatar,pergunta_secreta FROM usuarios WHERE id = ?', [req.usuario.id]);
    res.json(r[0] || null);
  } catch (e) { next(e); }
});

// Colunas que EXISTEM na tabela (evita injecao pelo nome da coluna).
const COLUNAS = ['nome', 'email', 'senha', 'papel', 'avatar', 'pergunta_secreta', 'resposta_secreta'];

// POST /api/perfil — atualiza o perfil.
router.post('/', requerLogin, async (req, res, next) => {
  try {
    const body = req.body || {};
    const sets = [], vals = [];
    for (const chave of Object.keys(body)) {
      const col = chave.toLowerCase();
      if (!COLUNAS.includes(col)) continue;

      // Controle de campos permitido por nivel:
      if (req.nivel === 'high' && !['nome', 'email', 'pergunta_secreta', 'resposta_secreta'].includes(col)) {
        continue; // allowlist: campos sensiveis (papel/senha) nunca vem do body
      }
      if (req.nivel === 'medium' && chave === 'papel') {
        continue; // blacklist CASE-SENSITIVE -> BYPASS enviando "Papel" ou "PAPEL"
      }
      sets.push(`${col} = ?`);
      vals.push(body[chave]);
    }
    if (!sets.length) return res.status(400).json({ erro: 'nada para atualizar' });

    // [WSTG-ATHZ-03] Em Low: enviar {"papel":"admin"} promove voce a admin.
    //                Em Medium: {"papel":"admin"} e barrado, mas {"Papel":"admin"} passa.
    //                Em High: papel/senha nem sao aceitos aqui.
    vals.push(req.usuario.id);
    await pool.execute(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, vals);

    // Sincroniza a sessao em memoria com o papel do banco. Sem isto, a escalacao
    // so valeria apos um novo login (a sessao guarda o papel do momento do login).
    // Fazer o sync aqui deixa o ATHZ-03 exploravel na hora.
    if (req.sessao) {
      const [u] = await pool.execute('SELECT papel FROM usuarios WHERE id = ?', [req.usuario.id]);
      if (u.length) req.sessao.papel = u[0].papel;
    }
    res.json({ ok: true, atualizado: sets.map(s => s.split(' ')[0]) });
  } catch (e) { next(e); }
});

// --- Upload de avatar --------------------------------------------------------
const armazenamento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIR_UPLOAD),
  filename: (req, file, cb) => {
    if (req.nivel === 'high') {
      // Correto: nome aleatorio + extensao normalizada (evita sobrescrever/adivinhar).
      cb(null, crypto.randomBytes(8).toString('hex') + path.extname(file.originalname).toLowerCase());
    } else {
      // Mantem o nome original (previsivel; permite sobrescrever outro arquivo).
      cb(null, file.originalname);
    }
  }
});
function filtro(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  switch (req.nivel) {
    case 'high': {
      // Correto: ALLOWLIST de extensoes + checagem de mimetype (o ideal e checar
      // tambem os "magic bytes" do arquivo).
      const ok = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      if (!ok.includes(ext)) return cb(new Error('extensao nao permitida'));
      if (!/^image\//.test(file.mimetype)) return cb(new Error('mimetype nao permitido'));
      return cb(null, true);
    }
    case 'medium':
      // Blacklist: bloqueia so ".php". BYPASS: .phtml/.php5/.svg/.html, ou dupla
      // extensao "shell.php.png", ou mimetype forjado.
      if (ext === '.php') return cb(new Error('.php bloqueado'));
      return cb(null, true);
    case 'low':
    default:
      // [WSTG-BUSL-08/09] Aceita QUALQUER tipo (.php, .svg, .html, .exe...).
      return cb(null, true);
  }
}
const upload = multer({ storage: armazenamento, fileFilter: filtro, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/avatar', requerLogin, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ erro: err.message });
    if (!req.file) return res.status(400).json({ erro: 'envie o arquivo no campo "avatar"' });
    const url = '/uploads/' + req.file.filename;
    await pool.execute('UPDATE usuarios SET avatar = ? WHERE id = ?', [url, req.usuario.id]);
    // Dica: um .svg ou .html com <script> servido em /uploads executa no navegador
    // (XSS armazenado via upload). Um .php nao roda aqui (nao ha PHP), mas o
    // conceito de "webshell" e o mesmo em servidores que interpretam PHP.
    res.json({
      ok: true, avatar: url,
      aviso: req.nivel !== 'high' ? 'tipo de arquivo NAO validado corretamente (BUSL-08/09)' : undefined
    });
  });
});

module.exports = router;
