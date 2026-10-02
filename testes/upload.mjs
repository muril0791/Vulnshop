// Testa o upload de avatar (BUSL-08/09) end-to-end usando fetch/FormData/Blob
// globais do Node 22. Uso:  node testes/upload.mjs   (backend precisa estar no ar)
const API = 'http://localhost:4000';
const J = { 'Content-Type': 'application/json' };
const sidOf = (r) => (r.headers.getSetCookie ? r.headers.getSetCookie() : []).map(c => c.split(';')[0]).join('; ');
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)"><text>x</text></svg>';

// ---- LOW: aceita .svg malicioso ----
const login = await fetch(API + '/api/auth/login', { method: 'POST', headers: J, body: JSON.stringify({ usuario: 'alice', senha: 'alice123' }) });
const sid = sidOf(login);
const fd = new FormData();
fd.append('avatar', new Blob([SVG], { type: 'image/svg+xml' }), 'xss.svg');
const up = await fetch(API + '/api/perfil/avatar', { method: 'POST', headers: { Cookie: sid }, body: fd });
const d = await up.json();
console.log('[BUSL-09] LOW upload .svg =>', JSON.stringify(d));
if (d.avatar) {
  const f = await fetch(API + d.avatar);
  const t = await f.text();
  console.log('   servido:', d.avatar, '| content-type:', f.headers.get('content-type'), '| contem onload:', t.includes('onload'));
}

// ---- HIGH: rejeita .svg (allowlist de imagem) ----
const loginH = await fetch(API + '/api/auth/login', { method: 'POST', headers: { ...J, Cookie: 'vulnshop_nivel=high' }, body: JSON.stringify({ usuario: 'alice', senha: 'alice123' }) });
const lh = await loginH.json();
const sidH = sidOf(loginH);
const fd2 = new FormData();
fd2.append('avatar', new Blob([SVG], { type: 'image/svg+xml' }), 'xss.svg');
const upH = await fetch(API + '/api/perfil/avatar', { method: 'POST', headers: { Cookie: 'vulnshop_nivel=high; ' + sidH, 'X-CSRF-Token': lh.csrf || '' }, body: fd2 });
console.log('[High] upload .svg => status', upH.status, JSON.stringify(await upH.json()), '(esperado: rejeitado)');
