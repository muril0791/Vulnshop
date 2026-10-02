// ============================================================================
//  "Site do atacante" — servidor estático mínimo (Node puro, sem dependências).
//  Roda numa ORIGEM SEPARADA (http://localhost:4444) para demonstrar de forma
//  realista CSRF, CORS mal configurado e Clickjacking contra o VulnShop.
//
//  Uso:  node atacante/servir.js     (ou  npm run atacante  na raiz)
//  ⚠️ Ainda é AMBIENTE DE TREINO — só localhost.
// ============================================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const PORT = 4444;

http.createServer((req, res) => {
  let f = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const fp = path.join(DIR, path.normalize(f));
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    const ext = path.extname(fp);
    res.writeHead(200, { 'Content-Type': ext === '.html' ? 'text/html; charset=utf-8' : 'text/plain' });
    res.end(d);
  });
}).listen(PORT, () => console.log('>> Site do ATACANTE em http://localhost:' + PORT));
